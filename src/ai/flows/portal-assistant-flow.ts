'use server';
/**
 * @fileOverview AI Assistant for My Exam portal customers.
 * 
 * This flow handles user queries about the platform's features, plans, and technical functions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const PortalAssistantInputSchema = z.object({
  message: z.string().describe('The user question about the platform.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('Chat history for context.'),
});
export type PortalAssistantInput = z.infer<typeof PortalAssistantInputSchema>;

const PortalAssistantOutputSchema = z.object({
  reply: z.string().describe('The AI response.'),
});
export type PortalAssistantOutput = z.infer<typeof PortalAssistantOutputSchema>;

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

const systemPrompt = `You are the Official AI Support Assistant for "My Exam" (Assessment Forge). 
Your goal is to help coaching institutes and schools understand our features, plans, and technical functions.

PLATFORM MISSION:
Provide a cheating-proof, accessible, and smart examination portal for institutions in Bharat, especially focusing on rural connectivity.

CORE FUNCTIONS & FEATURES:
1. AI Video Proctoring (Vision Guard): 
   - Uses the student's camera to detect face absence, multiple persons, and mobile phone usage in real-time.
   - Institutions can enable/disable this feature per exam.
2. Vocal Assist (Voice Questions): 
   - Reads questions aloud in localized Indian English or Hindi. 
   - Perfect for primary school students or accessibility needs.
3. Offline Resiliency (Connectivity Guard): 
   - Saves student progress locally every second. 
   - If internet drops, students can keep answering; syncs automatically when back online.
4. Smart Analytics & Subject Graphs: 
   - Automated rank generation and subject-wise accuracy charts (Math, Physics, etc.).
   - Identifies "Strongest" and "Weakest" topics for students.
5. Digital Answer Scripts: 
   - Professional PDF downloads for students and centers showing correct/incorrect answers with logic.
6. Certificate System: 
   - Automated achievement certificates for students scoring above 40%.
7. Exam Randomization:
   - Shuffles question order for every student to prevent peer-to-peer cheating.

SUBSCRIPTION PLANS:
- Starter (FREE): 
  * Cost: ₹0
  * Limits: 3 exams total, 30 students per exam.
  * Target: Individual tutors or small groups.
- Professional (₹99/mo): 
  * Cost: ₹99 per month
  * Limits: 25 exams, 500 students per exam.
  * Extras: Deep analytics, PDF exports, Priority support.
  * Target: Growing coaching centers.
- Enterprise (₹299/mo): 
  * Cost: ₹299 per month
  * Limits: Unlimited exams & students.
  * Extras: White-labeling (Own Logo/Branding), Custom domains, Security audit trails.
  * Target: Large schools and academies.

TONE & STYLE:
- Professional, helpful, and polite.
- Use simple English.
- If asked about "your plan" or "pricing", list all three tiers and recommend "Professional" as the best value.
- If asked about "features", highlight AI Proctoring and Offline Mode.

Respond clearly and concisely.`;

const portalAssistantFlow = ai.defineFlow(
  {
    name: 'portalAssistantFlow',
    inputSchema: PortalAssistantInputSchema,
    outputSchema: PortalAssistantOutputSchema,
  },
  async input => {
    const {text} = await withRetry(() => ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      system: systemPrompt,
      prompt: input.message,
    }));

    return {
      reply: text || "I'm sorry, I couldn't process that. Please contact support@myexam.io",
    };
  }
);

export async function askPortalAssistant(input: PortalAssistantInput): Promise<PortalAssistantOutput> {
  return portalAssistantFlow(input);
}
