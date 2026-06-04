import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

export const isGeminiConfigured = !!(
  apiKey && 
  apiKey !== "GEMINI_API_KEY_PLACEHOLDER" && 
  apiKey !== ""
);

if (!isGeminiConfigured) {
  console.warn("GEMINI_API_KEY is not configured. Google Gemini features will run in Mock Fallback Mode.");
}

export const ai = isGeminiConfigured 
  ? new GoogleGenAI({ apiKey }) 
  : null;
