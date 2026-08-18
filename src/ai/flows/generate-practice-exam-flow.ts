'use server';
/**
 * @fileOverview An advanced AI agent for generating professional, unique exam questions.
 * 
 * - generatePracticeExam - A function that handles the AI generation process.
 * - GeneratePracticeExamInput - The input type for the function.
 * - GeneratePracticeExamOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const GeneratePracticeExamInputSchema = z.object({
  grade: z
    .string()
    .optional()
    .describe('The class, grade or exam level (e.g. Class 10, JEE, NEET).'),
  subject: z
    .string()
    .describe('The broad academic subject (e.g. Mathematics, Physics, History).'),
  topic: z
    .string()
    .optional()
    .describe('The specific topic within the subject. If empty, generate from entire subject.'),
  numberOfQuestions: z
    .number()
    .int()
    .min(1)
    .max(50)
    .describe('Total number of MCQ questions to generate.'),
  difficulty: z
    .enum(['Easy', 'Medium', 'Hard'])
    .describe('The complexity level of the questions.'),
  language: z
    .enum(['English', 'Hindi'])
    .default('English')
    .describe('The language in which to generate the exam.'),
  seed: z
    .number()
    .optional()
    .describe('A random seed to ensure uniqueness between calls.'),
});
export type GeneratePracticeExamInput = z.infer<typeof GeneratePracticeExamInputSchema>;

const MCQQuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  optionA: z.string().describe('Option A text.'),
  optionB: z.string().describe('Option B text.'),
  optionC: z.string().describe('Option C text.'),
  optionD: z.string().describe('Option D text.'),
  correctAnswer: z
    .string()
    .describe('The correct option letter (A, B, C, or D).'),
  solution: z.string().describe('A detailed explanation of the correct answer.'),
});

const GeneratePracticeExamOutputSchema = z.object({
  examTitle: z.string().describe('A professional title for the exam.'),
  questions: z.array(MCQQuestionSchema).describe('The list of generated MCQ questions.'),
});
export type GeneratePracticeExamOutput = z.infer<typeof GeneratePracticeExamOutputSchema>;

/**
 * Helper to retry AI calls on transient errors.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error.message || '';
    
    // Skip retries on 404 Not Found (configuration errors)
    if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found')) {
      console.error("Critical AI Configuration Error (404):", msg);
      throw error;
    }

    const isTransient = 
      msg.includes('503') || 
      msg.includes('429') || 
      msg.includes('overloaded') || 
      msg.includes('UNAVAILABLE') || 
      msg.includes('quota') ||
      msg.includes('rate limit');
      
    if (retries <= 0 || !isTransient) throw error;
    console.warn(`Transient AI error, retrying in ${delay}ms...`, msg);
    await new Promise(res => setTimeout(res, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

const generatePracticeExamPrompt = ai.definePrompt({
  name: 'generatePracticeExamPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: {schema: GeneratePracticeExamInputSchema},
  output: {schema: GeneratePracticeExamOutputSchema},
  config: {
    temperature: 1.0, // High creativity for uniqueness
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are an elite academic examination designer. 

MISSION: Generate a high-quality, professional MCQ exam set strictly based on the following context. 

CRITICAL UNIQUENESS & VARIETY RULE:
- Use the random execution seed ({{{seed}}}) to shift your logic and ensure this set of questions is ENTIRELY UNIQUE.
- DO NOT use common or overused textbook questions.
- Vary the question styles: conceptual, application-based, and scenario-based.

CRITICAL BOUNDARY RULES:
1. SUBJECT LOCK: You MUST generate questions strictly for the Subject: "{{{subject}}}".
2. TOPIC FOCUS: If a Specific Topic is provided ("{{{topic}}}"), focus 100% on that area. 
3. LEVEL ADHERENCE: Calibrate question difficulty for Level/Grade: "{{{grade}}}". 
4. COUNT ADHERENCE: You MUST generate EXACTLY {{{numberOfQuestions}}} unique questions.

Context Parameters:
- Target Subject: {{{subject}}}
- Targeted Topic: {{#if topic}}{{{topic}}}{{else}}Broad Subject Coverage{{/if}}
- Target Grade/Level: {{{grade}}}
- Quantity Needed: {{{numberOfQuestions}}} MCQs
- Complexity: {{{difficulty}}}
- Output Language: {{{language}}}

FORMATTING RULES:
- Exactly 4 options (A, B, C, D).
- 'correctAnswer' must be "A", "B", "C", or "D".
- Provide an educational solution for every question.
- If language is Hindi, use formal Devanagari script for ALL output fields.

Return valid JSON.`,
});

const generatePracticeExamFlow = ai.defineFlow(
  {
    name: 'generatePracticeExamFlow',
    inputSchema: GeneratePracticeExamInputSchema,
    outputSchema: GeneratePracticeExamOutputSchema,
  },
  async input => {
    const executionSeed = Math.floor(Math.random() * 99999999);
    const payload = {
      ...input,
      seed: input.seed ?? executionSeed
    };
    
    const {output} = await withRetry(() => generatePracticeExamPrompt(payload));
    if (!output) throw new Error("AI failed to produce valid output.");
    return output;
  }
);

export async function generatePracticeExam(input: GeneratePracticeExamInput): Promise<GeneratePracticeExamOutput> {
  return generatePracticeExamFlow(input);
}
