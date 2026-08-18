import { Exam, User, Attempt } from './types';

export const MOCK_CENTERS: User[] = [
  {
    id: 'c1',
    name: 'Excellence Coaching',
    email: 'contact@excellence.com',
    role: 'CENTER',
    subscription: 'PRO',
    centerInfo: {
      ownerName: 'Rahul Sharma',
      mobile: '9876543210',
      address: 'Jaipur, Rajasthan',
    }
  },
  {
    id: 'c2',
    name: 'Success Academy',
    email: 'admin@success.in',
    role: 'CENTER',
    subscription: 'FREE',
    centerInfo: {
      ownerName: 'Priya Verma',
      mobile: '9123456789',
      address: 'Delhi, India',
    }
  }
];

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam1',
    centerId: 'c1',
    title: 'UPSC Practice - Indian Polity',
    subject: 'General Studies',
    description: 'A comprehensive mock test covering the basic structure of the Indian Constitution.',
    language: 'English',
    duration: 60,
    totalQuestions: 10,
    negativeMarking: 0.25,
    startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
    endTime: new Date(Date.now() + 86400000), // Ends tomorrow
    status: 'ONGOING',
    questions: [
      {
        id: 'q1',
        text: 'Who is known as the Father of the Indian Constitution?',
        type: 'MCQ',
        options: ['A) B.R. Ambedkar', 'B) M.K. Gandhi', 'C) J.L. Nehru', 'D) Vallabhbhai Patel'],
        correctAnswer: 'A) B.R. Ambedkar'
      }
    ]
  }
];

export const MOCK_ATTEMPTS: Attempt[] = [
  {
    id: 'at1',
    examId: 'exam1',
    studentName: 'Amit Singh',
    rollNumber: 'ROLL101',
    score: 85,
    totalCorrect: 9,
    totalWrong: 1,
    timeTaken: 2400,
    submittedAt: new Date(),
    answers: { 'q1': 'A) B.R. Ambedkar' }
  }
];