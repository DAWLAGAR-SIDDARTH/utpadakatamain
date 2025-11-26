import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BoardItem, ItemType, TaskPriority, Expense } from '../types';

const apiKey = process.env.API_KEY || '';
// Fallback if env is missing in some dev environments, but per instructions we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey });

export const analyzeWorkspace = async (items: BoardItem[], globalExpenses: Expense[]) => {
  if (!apiKey) return "API Key missing.";

  const itemsSummary = items.map(item => {
    if (item.type === ItemType.NOTE) return `Note: ${item.content}`;
    if (item.type === ItemType.TASK) return `Task: ${item.title} (${item.priority}) - ${item.completed ? 'Done' : 'Pending'}`;
    if (item.type === ItemType.EXPENSE_WIDGET) return `Expense Widget: ${item.title}`;
    return 'Unknown Item';
  }).join('\n');

  const expenseSummary = globalExpenses.map(e => `${e.date}: ${e.description} ($${e.amount})`).join('\n');

  const prompt = `
    Analyze the following productivity workspace data.
    
    Items on Board:
    ${itemsSummary}

    Recent Expenses:
    ${expenseSummary}

    Provide a brief, encouraging summary of the user's workload, suggest 2 prioritized actions based on tasks, and give a 1-sentence financial tip based on expenses.
    Format as HTML (simple tags like <b>, <ul>, <li>).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Could not analyze workspace at this time.";
  }
};

export const generateTaskFromText = async (text: string): Promise<Partial<any> | null> => {
  if (!apiKey) return null;

  const prompt = `Convert this text into a task object: "${text}"`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      priority: { type: Type.STRING, enum: [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT] },
    },
    required: ['title', 'priority']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini task generation failed", error);
    return null;
  }
};

export const getFinancialAdvice = async (expenses: Expense[]) => {
  if (!apiKey || expenses.length === 0) return "Add expenses to get AI insights.";

  const data = JSON.stringify(expenses);
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyze these expenses and give 3 bullet points of advice: ${data}`,
      });
      return response.text;
  } catch (e) {
      return "AI Busy.";
  }
}