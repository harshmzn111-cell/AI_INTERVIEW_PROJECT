import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/connectDB.js";
import cors from "cors";
import cookieParser from "cookie-parser";
dotenv.config();
import authRouter from "./routes/auth.rout.js";
import userRouter from "./routes/user.routes.js";
import interviewRouter from "./routes/interview.route.js";
import paymentRouter from "./routes/paymente.route.js";
const app = express();

const PORT = process.env.PORT ||  6000;

app.use(cors({
  origin: "https://ai-interview-project-client-2.onrender.com",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
}))
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/payment",paymentRouter);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
