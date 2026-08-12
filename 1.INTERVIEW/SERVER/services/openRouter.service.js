import axios from "axios";

export const askAi = async (message) => {
  try {
    if (!message || !Array.isArray(message) || message.length === 0) {
      throw new Error("Invalid message format. Expected a non-empty array of messages.");
    }

    const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: message,
      },
      {
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error("No content found in the response from OpenRouter API.");
    }

    return content;
  } catch (error) {
    console.error("Error in askAi function:", error?.response?.data || error.message);
    throw new Error("Failed to get AI response.");
  }
};