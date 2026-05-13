import { GoogleGenAI, Type } from "@google/genai";
import { Job, Candidate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeCandidate(candidate: Candidate, job: Job, answers?: string) {
  const prompt = `
    حلل المرشح التالي لوظيفة "${job.title}".
    
    وصف الوظيفة: ${job.description}
    متطلبات الوظيفة: ${job.requirements}
    
    اسم المرشح: ${candidate.name}
    سياق السيرة الذاتية: الرابط المقدم هو ${candidate.cv_url}. (إذا كان الرابط فارغاً، حلل بناءً على مسمى الوظيفة والمهارات المتوقعة).
    ${answers ? `إجابات المرشح على الأسئلة التمهيدية: ${answers}` : ''}
    
    المطلوب تقديم التحليل باللغة العربية الفصحى وبالصيغة التالية:
    1. ملخص احترافي (summary): لخص نقاط القوة والضعف ومدى مناسبته للوظيفة.
    2. درجة مطابقة المهارات (skills_score): رقم من 0 إلى 100.
    3. نبرة الانطباع (sentiment): كلمة واحدة تصف شخصية المرشح من إجاباته (مثلاً: واثق، طموح، عملي، احترافي).
    
    يجب أن تكون الإجابة بصيغة JSON فقط باللغة العربية.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            skills_score: { type: Type.NUMBER },
            sentiment: { type: Type.STRING }
          },
          required: ["summary", "skills_score", "sentiment"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
