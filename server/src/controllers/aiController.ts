import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../utils/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/ai/symptom-check
export const symptomCheck = async (req: Request, res: Response): Promise<void> => {
  const { symptoms } = req.body as { symptoms?: string };

  if (!symptoms || symptoms.trim().length < 5) {
    res.status(400).json({ message: 'Please describe your symptoms (at least 5 characters).' });
    return;
  }

  // Fetch available specialties to constrain the AI to real options
  const { data: specialties } = await supabaseAdmin
    .from('specialties')
    .select('name, description')
    .order('name');

  const specialtyList = (specialties ?? [])
    .map((s: any) => `- ${s.name}${s.description ? ': ' + s.description : ''}`)
    .join('\n');

  const prompt = `You are a helpful medical intake assistant for MediBook clinic.
Your job is to read a patient's symptoms and suggest the most appropriate medical specialty from the clinic's available specialties listed below.
Always respond with:
1. A brief, empathetic acknowledgment of the patient's concern.
2. The recommended specialty name (exactly as listed).
3. A short explanation of why that specialty is relevant.
4. A reminder that this is not a medical diagnosis and the patient should consult a doctor.

Available specialties:
${specialtyList}

If no specialty clearly matches, recommend "General Practice".
Keep your response concise, warm, and professional.

Patient's symptoms: ${symptoms}`;

  // Use gemini-2.5-flash with thinking disabled for reliable, low-latency responses.
  // Thinking mode (default on) can cause response.text() to throw on safety-filtered
  // thinking tokens; setting thinkingBudget: 0 disables it entirely.
  const PRIMARY_MODEL = 'gemini-2.5-flash';
  const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

  async function generate(modelName: string): Promise<string> {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  try {
    let reply: string;
    try {
      reply = await generate(PRIMARY_MODEL);
    } catch (primaryError: any) {
      console.warn(`[Gemini] ${PRIMARY_MODEL} failed (${primaryError.message}), falling back to ${FALLBACK_MODEL}`);
      reply = await generate(FALLBACK_MODEL);
    }

    // Find which specialty was mentioned
    const matchedSpecialty = (specialties ?? []).find((s: any) =>
      reply.includes(s.name)
    );

    res.json({
      reply,
      suggested_specialty: matchedSpecialty ?? null,
    });
  } catch (error: any) {
    console.error('[Gemini Error]', error.message);
    res.status(500).json({ message: 'AI service temporarily unavailable. Please try again later.' });
  }
};
