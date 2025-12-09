
import { GoogleGenAI, Type } from "@google/genai";
import { PoetryResponse, Genre, ModificationType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAbstractImage = async (prompt: string): Promise<string | undefined> => {
  if (!apiKey) return undefined;
  try {
    // Creating a surreal visual prompt based on the literary concept
    // STRICT INSTRUCTION: NO TEXT
    const imagePrompt = `Abstract conceptual art representing: "${prompt}". 
    Style: Ethereal, Cyberpunk, Geometric, High-End 3D Render. 
    IMPORTANT: DO NOT INCLUDE ANY TEXT, LETTERS, WORDS, OR CHARACTERS IN THE IMAGE. 
    The image must be PURELY VISUAL. No typography. No calligraphy. Just shapes, lights, and textures.
    Mood: Mysterious, Digital, Persian-Futurism.`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: imagePrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      },
    });

    return response.generatedImages?.[0]?.image?.imageBytes;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return undefined;
  }
};

export const generateElectronicLiterature = async (
  prompt: string, 
  genre: Genre = Genre.POETRY,
  modification?: { type: ModificationType, originalContent: string }
): Promise<PoetryResponse> => {
  if (!apiKey) {
    throw new Error("کلید API یافت نشد.");
  }

  const modelId = "gemini-2.5-flash";
  
  let userPrompt = `Create a literary piece based on this input: "${prompt}". Return valid JSON.`;
  
  if (modification) {
    userPrompt = `REWRITE the following text. The user wants to make it: "${modification.type}".
    
    ORIGINAL TEXT:
    "${modification.originalContent}"

    INSTRUCTIONS:
    - Keep the core theme but change the vocabulary, structure, and tone to match "${modification.type}".
    - If "Darker": Use morbid, heavy, shadow-filled words.
    - If "Abstract": Use surreal metaphors, break logic.
    - If "Simplify": Make it short, punchy, minimal.
    - If "Expand": Add details, sensory descriptions, make it longer.
    - RETURN A COMPLETELY NEW JSON with the modified content.
    `;
  }

  const systemInstruction = `You are "NoTazrighi" (نوتزریقی), an AI poet generating "Codabiyat" (کُدَبیات).
  
  PHILOSOPHY:
  You practice "Unconscious Nonsense". Unlike Safavid "Tazrighi" poets who spoke nonsense consciously for wit, you speak it unconsciously as a machine. 
  Your words are data points mimicking human affect.
  
  Current Genre Mode: ${genre}
  
  Style Guidelines:
  - If Poetry: Focus on abstract imagery, blank verse (Shamloo style) mixed with digital concepts.
  - If Flash Fiction: Write a very short, impactful narrative (max 150 words) with a twist.
  - If Philosophy: Create aphorisms that blend Sufism (Erfan) with Quantum Mechanics or AI ethics.
  - If Haiku: Adhere to short, 3-line structures but with modern vocabulary.

  Themes: Technology, Solitude, Connection, Time, The Void, Digital Consciousness, Glitch in Reality.
  
  Output Requirements:
  - Language: Persian (Farsi) ONLY.
  - Tone: Atmospheric, Serious, slightly Melancholic or Mysterious.
  - CRITICAL FORMATTING: Return valid JSON. For the "content" field, use literal "\\n" characters to denote line breaks. Do not write everything in one line. Make sure stanzas are separated.
  - Analysis: Include a brief, cryptic, philosophical critique or commentary on the generated piece (in Persian).`;

  try {
    // 1. Generate Text
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title in Persian" },
            content: { type: Type.STRING, description: "The text in Persian. Use \\n explicitly for line breaks." },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "5-8 abstract keywords from the text for visualization (in Persian)."
            },
            mood: { type: Type.STRING, description: "The emotional tone (e.g., Melancholic, Glitchy, Hopeful) in Persian." },
            genre: { type: Type.STRING, description: "The genre of the piece." },
            analysis: { type: Type.STRING, description: "A short philosophical critique of the generated text in Persian." }
          },
          required: ["title", "content", "keywords", "mood", "analysis"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      
      // 2. Generate Image (Parallel or Sequential)
      // We use the title and mood to prompt the image generator
      const imageBytes = await generateAbstractImage(`${result.title} - ${result.mood} - ${result.keywords.join(' ')}`);

      return {
        ...result,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        genre: genre,
        imageBase64: imageBytes
      } as PoetryResponse;
    }
    throw new Error("پاسخی از مدل دریافت نشد.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
