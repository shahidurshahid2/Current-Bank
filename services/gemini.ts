import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction } from '../types';

let ai: GoogleGenerativeAI | null = null;

try {
    if (process.env.API_KEY) {
        ai = new GoogleGenerativeAI(process.env.API_KEY);
    }
} catch (e) {
    console.error("Error initializing Gemini:", e);
}

export const analyzeData = async (transactions: Transaction[], query: string): Promise<string> => {
  if (!ai) return "API Key is missing or invalid. Please check your configuration.";
  if (transactions.length === 0) return "No data available to analyze.";

  // Compress data for token limit - send last 50 transactions if too large, or summary
  // For this demo, we'll try to send a concise CSV representation.
  const csvContext = transactions.slice(0, 100).map(t => 
    `${t.date},${t.description},${t.category},${t.type},${t.amount}`
  ).join('\n');

  const prompt = `
    You are an expert financial data analyst (simulating Python Pandas capabilities).
    I will provide you with a dataset of transactions.
    
    Data Format: Date, Description, Category, Type, Amount
    
    [DATA START]
    ${csvContext}
    [DATA END]

    User Query: "${query}"

    Instructions:
    1. Analyze the provided data to answer the query.
    2. If the user asks for "current balance", calculate it (Income - Expense).
    3. Keep the answer concise, friendly, and professional.
    4. Format money with currency symbols.
    5. If the query requires complex aggregation (e.g., "Top 3 spending categories"), perform the mental math and list them.
  `;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "I couldn't generate an analysis at this time.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Sorry, I encountered an error while analyzing your data.";
  }
};
