import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import classesRouter from "./routes/classes";
import studentsRouter from "./routes/students";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/students", studentsRouter);
app.use("/api/classes", classesRouter);

export default app;
