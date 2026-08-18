export type UserRole = 'ADMIN' | 'CENTER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  centerInfo?: {
    ownerName: string;
    mobile: string;
    address: string;
  };
  subscription?: 'FREE' | 'PRO';
}

export type QuestionType = 'MCQ' | 'TF' | 'MULTIPLE';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string | string[];
}

export interface Exam {
  id: string;
  centerId: string;
  title: string;
  subject: string;
  description: string;
  language: 'English' | 'Hindi' | 'Both';
  duration: number; // minutes
  totalQuestions: number;
  negativeMarking: number;
  startTime: Date;
  endTime: Date;
  questions: Question[];
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
}

export interface Attempt {
  id: string;
  examId: string;
  studentName: string;
  rollNumber: string;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  timeTaken: number; // seconds
  submittedAt: Date;
  answers: Record<string, string | string[]>;
}