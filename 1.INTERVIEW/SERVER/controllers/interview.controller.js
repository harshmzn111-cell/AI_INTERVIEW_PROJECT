
import fs from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.js";
import { askAi } from "../services/openRouter.service.js";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

// Helper: some models wrap JSON replies in ```json fences — strip those before parsing
const parseAiJson = (raw) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume required",
      });
    }

    const filepath = req.file.path;
    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    // Extract text from ALL pages first, then call the AI once
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    // Done with the uploaded file now
    fs.unlinkSync(filepath);

    const messages = [
      {
        role: "system",
        content: `
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`,
      },
      {
        role: "user",
        content: resumeText,
      },
    ];

    const aiResponse = await askAi(messages);
    const parsed = parseAiJson(aiResponse);

    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText,
    });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      message: "Error analyzing resume",
    });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    let { role, experience, projects, skills, resumeText, mode } = req.body;
    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();
    if (!role || !experience || !mode) {
      return res.status(400).json({
        message: "Role, experience, and mode are required",
      });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.credits < 50) {
      return res.status(400).json({
        message: "Not enough credits. Minimum 50 required.",
      });
    }

    const projectText =
      Array.isArray(projects) && projects.length ? projects.join(", ") : "None";

    const skillsText =
      Array.isArray(skills) && skills.length ? skills.join(", ") : "None";

    const safeResume = resumeText?.trim() || "None";

    const userPrompt = `Role: ${role}
Experience: ${experience}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
Interview Mode: ${mode}`;

    if (!userPrompt.trim()) {
      return res.status(400).json({
        message: "User prompt is empty. Please provide valid input.",
      });
    }

    const messages = [
      {
        role: "system",
        content: `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy
Question 2 → easy
Question 3 → medium
Question 4 → medium
Question 5 → hard

Make questions based on the candidate's role, experience, projects, interviewMode, skills, and resume details.
`,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const aiResponse = await askAi(messages);
    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({
        message: "AI returned empty response.",
      });
    }

    const questionsArray = aiResponse
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 5);

    if (questionsArray.length === 0) {
      return res.status(500).json({
        message: "AI failed to generate questions.",
      });
    }

    user.credits -= 50;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      })),
    });

    res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Error generating questions: ${error.message}`,
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const question = interview.questions[questionIndex];
    if (!question) {
      return res.status(400).json({
        message: "Invalid question index",
      });
    }

    // If no answer
    if (!answer) {
      question.finalScore = 0;
      question.feedback = "You did not submit an answer.";
      question.answer = "";

      await interview.save();

      return res.json({
        feedback: question.feedback,
      });
    }

    // If time exceeded
    if (timeTaken > question.timeLimit) {
      question.finalScore = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";
      question.answer = answer;

      await interview.save();

      return res.json({
        feedback: question.feedback,
      });
    }

    const messages = [
      {
        role: "system",
        content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence - Does the answer sound clear, confident, and well-presented?
2. Communication - Is the language simple, clear, and easy to understand?
3. Correctness - Is the answer accurate, relevant, and complete?

- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.
Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "string"
}`,
      },
      {
        role: "user",
        content: `Question: ${question.question}
Answer: ${answer}`,
      },
    ];

    const aiResponse = await askAi(messages);
    const parsed = parseAiJson(aiResponse);

    question.answer = answer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.finalScore = parsed.finalScore;
    question.feedback = parsed.feedback;

    await interview.save();

    return res.status(200).json({
      feedback: parsed.feedback,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Error submitting answer: ${error}`,
    });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(400).json({
        message: "Interview not found",
      });
    }
    const totalQuestions = interview.questions.length;
    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.finalScore || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
    const averageConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
    const averageCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
    const averageCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";
    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(averageConfidence.toFixed(1)),
      communication: Number(averageCommunication.toFixed(1)),
      correctness: Number(averageCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.finalScore || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: `Error finishing interview: ${error}`,
    });
  }
};

export const getMyInterview = async (req, res) => {
  try {
    const interview = await Interview.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interview);
  } catch (error) {
    return res.status(500).json({
      message: `failed to find currentUser Interview ${error}`,
    });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;
    let totalScore = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
      totalScore += q.finalScore || 0;
    });

    const totalQuestions = interview.questions.length;

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
    const averageConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;
    const averageCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;
    const averageCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(averageConfidence.toFixed(1)),
      communication: Number(averageCommunication.toFixed(1)),
      correctness: Number(averageCorrectness.toFixed(1)),
      questionWiseScore: interview.questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Error finishing interview: ${error}`,
    });
  }
};