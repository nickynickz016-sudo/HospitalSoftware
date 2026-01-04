import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, AIAnalysisResult } from '../types';

// Safely get API key
const API_KEY = process.env.API_KEY || '';

export const analyzeInventoryWithGemini = async (items: InventoryItem[]): Promise<AIAnalysisResult> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Prepare a lightweight summary of items to send to the model to avoid token limits on large datasets
  const inventorySummary = items.map(item => ({
    name: item.name,
    qty: item.quantity,
    min: item.minLevel,
    expiry: item.expiryDate,
    category: item.category
  }));

  const prompt = `
    Analyze this medical inventory data as an expert logistics manager.
    Current Date: ${new Date().toISOString().split('T')[0]}.
    
    Data:
    ${JSON.stringify(inventorySummary)}
    
    Provide a strategic analysis including:
    1. A brief executive summary of the inventory health.
    2. Critical alerts for items that are dangerously low (below min level) or expired.
    3. Restock recommendations with specific reasoning.
    4. Expiry warnings for items expiring within the next 90 days.
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
            criticalAlerts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            restockRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  suggestedQuantity: { type: Type.NUMBER }
                }
              }
            },
            expiryWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};