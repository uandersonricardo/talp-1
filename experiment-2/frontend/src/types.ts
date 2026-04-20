export interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
}

export type Grade = "MANA" | "MPA" | "MA";

export interface Goal {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  description: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
}

export interface Evaluation {
  id: string;
  classId: string;
  studentId: string;
  goalId: string;
  grade: Grade;
  updatedAt: string;
}
