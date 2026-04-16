import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import studentsRouter from "./routes/students";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/students", studentsRouter);

export default app;
