/**
 * Direct Gemini Service - NO SUPABASE NEEDED
 * 
 * Calls Gemini API directly from client for Deep Rehab Analyzer
 * This is a temporary solution until Supabase is properly set up
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCZmGXNl3OB71mRgjuJtuNJnINaJeb8Zfg';

export async function analyzePropertyPhotos(
  imageFiles: File[],
  sqft?: number
): Promise<any> {
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.7
    }
  });

  // Convert files to base64
  const imageParts = await Promise.all(
    imageFiles.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      
      return {
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      };
    })
  );

  const prompt = `
You are an expert real estate general contractor and estimator.
Analyze these property interior/exterior photos and generate a DETAILED rehab estimate.

${sqft ? `Total Square Footage: ${sqft} sqft` : 'Total Square Footage: UNKNOWN (Estimate based on visual evidence)'}

For each room/area visible:
1. Identify defects and outdated items
2. RECOMMEND renovations to bring it to "Market Standard" (Flip grade)
3. ASSIGN COSTS (use US national averages for 2025)
4. LIST ASSUMPTIONS
5. PROVIDE STRATEGY (BRRRR vs FLIP)

Return ONLY a JSON object with this structure:
{
  "overall_difficulty": "1-5 scale",
  "total_estimated_cost": number,
  "assumptions_and_notes": ["string"],
  "strategy_analysis": {
    "brrrr_strategy": "string",
    "flip_strategy": "string",
    "recommendation": "BRRRR or FLIP",
    "market_positioning": "string"
  },
  "room_breakdowns": [
    { 
      "room": "Kitchen", 
      "source_image_index": 0,
      "observations": "string", 
      "recommended_action": "string", 
      "line_items": [
        { "item": "string", "cost": number, "unit": "string" }
      ],
      "room_total": number 
    }
  ],
  "hidden_damage_warnings": ["string"],
  "summary_description": "string"
}
`;

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    console.log("Gemini Response:", responseText);
    
    const analysis = JSON.parse(responseText);
    return analysis;
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to analyze photos: ${error.message}`);
  }
}

export async function visualizeRoom(
  imageFile: File,
  roomName: string,
  designOptions: {
    furnitureStyle: string;
    wallColor: string;
    flooring: string;
    curtains: string;
    decorItems: string[];
  },
  observations?: string,
  recommendedAction?: string
): Promise<string> {
  
  // For now, return a placeholder - proper image generation needs Imagen API
  // This would require additional setup
  throw new Error("Room visualization requires Supabase Edge Functions. Coming soon!");
}
