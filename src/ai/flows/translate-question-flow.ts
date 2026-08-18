'use server';
/**
 * @fileOverview AI Flow for translating exam questions between English and Hindi.
 * 
 * - translateQuestion - A function that handles the AI translation process.
 * - TranslateQuestionInput - The input type for the function.
 * - TranslateQuestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const TranslateQuestionInputSchema = z.object({
  questionText: z.string(),
  options: z.array(z.object({
    label: z.string(),
    text: z.string(),
  })),
  solution: z.string().nullable().optional(),
  targetLanguage: z.enum(['English', 'Hindi']),
});
export type TranslateQuestionInput = z.infer<typeof TranslateQuestionInputSchema>;

const TranslateQuestionOutputSchema = z.object({
  questionText: z.string(),
  options: z.array(z.object({
    label: z.string(),
    text: z.string(),
  })),
  solution: z.string().nullable().optional(),
});
export type TranslateQuestionOutput = z.infer<typeof TranslateQuestionOutputSchema>;

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

const translatePrompt = ai.definePrompt({
  name: 'translatePrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: {schema: TranslateQuestionInputSchema},
  output: {schema: TranslateQuestionOutputSchema},
  config: {
    temperature: 0.1, // High fidelity translation
  },
  prompt: `You are an expert academic translator specializing in Indian competitive exams.
  
  TASK: Translate the following MCQ question, its options, and the solution to {{{targetLanguage}}}.
  
  CRITICAL RULES:
  1. Maintain academic and technical terms accurately in the target language.
  2. If the target language is Hindi, use formal Devanagari script for everything including options.
  3. Ensure the meaning and logic of the question remain identical.
  4. Keep the labels (A, B, C, D) as they are.
  5. If there is a solution/explanation, translate it with the same academic tone.
  
  QUESTION TO TRANSLATE:
  Question: {{{questionText}}}
  
  OPTIONS:
  {{#each options}}
  - Option {{{this.label}}}: {{{this.text}}}
  {{/each}}
  
  {{#if solution}}
  SOLUTION/EXPLANATION:
  {{{solution}}}
  {{/if}}
  
  Return the translated content as valid JSON following the output schema.`,
});

const translateQuestionFlow = ai.defineFlow(
  {
    name: 'translateQuestionFlow',
    inputSchema: TranslateQuestionInputSchema,
    outputSchema: TranslateQuestionOutputSchema,
  },
  async input => {
    const {output} = await withRetry(() => translatePrompt(input));
    if (!output) throw new Error("AI failed to translate the question.");
    return output;
  }
);

export async function translateQuestion(input: TranslateQuestionInput): Promise<TranslateQuestionOutput> {
  return translateQuestionFlow(input);
}
