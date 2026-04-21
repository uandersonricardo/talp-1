import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import classesRouter from "./routes/classes";
import goalsRouter from "./routes/goals";
import studentsRouter from "./routes/students";
import e2eRouter from "./routes/e2e";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/students", studentsRouter);
app.use("/api/classes", classesRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/e2e", e2eRouter);

export default app;
