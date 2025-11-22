import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use process.env.API_KEY directly in initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePostIdeas = async (topic: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 creative blog post titles about: ${topic}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Error generating ideas. Check API Key."];
  }
};

export const generateArticleContent = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a comprehensive and engaging blog post about: "${topic}". 
      
      Structure requirements:
      - Start with an engaging introduction.
      - Use clear headings (Markdown format ## for main sections, ### for subsections).
      - Include a conclusion.
      - Use bullet points where appropriate.
      
      Ensure the tone is professional but accessible. Write in the same language as the topic.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content. Please check your API Key.";
  }
};

export const polishContent = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following text to be more engaging, professional, and fix any grammatical errors. Keep the HTML/Markdown formatting if present:\n\n${content}`,
    });
    return response.text || content;
  } catch (error) {
    console.error("Gemini Error:", error);
    return content;
  }
};

export const generateTags = async (content: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this content and generate 5 relevant SEO tags. Return ONLY a JSON array of strings. Content: ${content.substring(0, 1000)}...`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["general"];
  }
};