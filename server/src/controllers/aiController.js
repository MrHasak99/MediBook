import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '../utils/supabase.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/ai/symptom-check
export const symptomCheck = async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || symptoms.trim().length < 5) {
    res.status(400).json({ message: 'Please describe your symptoms (at least 5 characters).' });
    return;
  }

  // Fetch available specialties to constrain the AI to real options
  const { data: specialties } = await supabaseAdmin
    .from('specialties')
    .select('id, name, description')
    .order('name');

  const specialtyList = (specialties ?? [])
    .map((s) => `- ${s.name}${s.description ? ': ' + s.description : ''}`)
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

  async function generate(modelName) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  try {
    let reply;
    try {
      reply = await generate(PRIMARY_MODEL);
    } catch (primaryError) {
      console.warn(`[Gemini] ${PRIMARY_MODEL} failed (${primaryError.message}), falling back to ${FALLBACK_MODEL}`);
      reply = await generate(FALLBACK_MODEL);
    }

    // Find which specialty was mentioned using word-boundary regex.
    // Simple substring matching (e.g. "ent") falsely matches inside common words
    // like "patient", "treatment", "current", so we require whole-word boundaries.
    const specialtyList2 = specialties ?? [];
    const matchedSpecialty = specialtyList2.find((s) => {
      const escaped = s.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(reply);
    });

    // Fall back to General Practice if no specialty could be identified
    const generalPractice = specialtyList2.find((s) =>
      s.name.toLowerCase() === 'general practice'
    );
    const suggested_specialty = matchedSpecialty ?? generalPractice ?? null;

    res.json({
      reply,
      suggested_specialty,
    });
  } catch (error) {
    console.error('[Gemini Error]', error.message);
    res.status(500).json({ message: 'AI service temporarily unavailable. Please try again later.' });
  }
};
