import { NextRequest, NextResponse } from "next/server";

interface GeminiRequest {
  proofType: string; // e.g., "commit", "repository", "language", "collaboration"
  context?: string; // Any additional context about the proof
  complexity?: "simple" | "detailed"; // Level of detail in explanation
}

const GEMINI_API_KEY = "AIzaSyDWqkYwLmGQ6NB2WoDP3UxchUy756hL6BU";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GeminiRequest;
    const { proofType, context, complexity = "simple" } = body;

    if (!proofType) {
      return NextResponse.json({ error: "Missing required field: proofType" }, { status: 400 });
    }

    // Call Gemini API with context and proofType
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Explain a zero-knowledge proof about ${proofType} in the context of GitHub contributions in a ${complexity} way. ${context ? `Additional context: ${context}` : ""}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1000,
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
    }

    // Extract explanation from Gemini response
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate explanation";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explanation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 