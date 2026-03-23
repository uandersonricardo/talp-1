export interface Alternative {
  description: string;
  correct: boolean;
}

export interface Question {
  id: string;
  statement: string;
  alternatives: Alternative[];
}

export interface Exam {
  id: string;
  title: string;
  course: string;
  professor: string;
  date: string;
  identifierMode: "letters" | "powers";
  questions: string[];
}

export interface GenerationBatch {
  id: string;
  examId: string;
  count: number;
  generatedAt: string;
  sequenceNumberStart: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
