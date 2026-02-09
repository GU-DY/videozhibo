import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeTranscript = async (
  transcript: string, 
  streamerName: string
): Promise<AnalysisResult> => {
  
  if (!apiKey) {
    console.warn("No API Key provided for Gemini.");
    // Return mock data if no key to prevent app crash in preview
    return {
      timestamp: Date.now(),
      summary: "未检测到API Key。模拟分析：讨论中检测到高波动性词汇。",
      sentimentScore: 45,
      riskScore: 75,
      complianceIssues: ["缺少API Key", "包含未经证实的声明"],
      investmentAdviceDetected: true
    };
  }

  try {
    const prompt = `
      你是一名负责监控直播内容的金融合规AI专员。
      主播名称: ${streamerName}
      直播文本片段: "${transcript}"
      
      请分析上述文本并返回 JSON 格式结果：
      1. 金融情感指数 (sentimentScore): 0-100，100表示极其看涨/积极。
      2. 合规风险指数 (riskScore): 0-100，100表示违法/诈骗/极高风险。
      3. 具体合规问题 (complianceIssues): 列出具体的违规点（例如：“承诺保本收益”、“诱导性喊单”、“虚假内幕消息”等），请用中文回答。
      4. 是否检测到投资建议 (investmentAdviceDetected): 布尔值。
      5. 摘要 (summary): 用一句话中文总结这段内容的中心思想。

      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentimentScore: { type: Type.NUMBER },
            riskScore: { type: Type.NUMBER },
            complianceIssues: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            investmentAdviceDetected: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");

    const data = JSON.parse(jsonText);

    return {
      timestamp: Date.now(),
      summary: data.summary,
      sentimentScore: data.sentimentScore,
      riskScore: data.riskScore,
      complianceIssues: data.complianceIssues || [],
      investmentAdviceDetected: data.investmentAdviceDetected
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      timestamp: Date.now(),
      summary: "由于错误导致分析失败。",
      sentimentScore: 50,
      riskScore: 0,
      complianceIssues: [],
      investmentAdviceDetected: false
    };
  }
};