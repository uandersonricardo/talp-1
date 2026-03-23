import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import examsRouter from "./routes/exams";
import questionsRouter from "./routes/questions";

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/questions", questionsRouter);
app.use("/api/exams", examsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
