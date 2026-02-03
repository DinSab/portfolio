import { NextResponse } from "next/server";

type ChatRequest = {
  message: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ChatRequest>;

  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json(
      { error: "Invalid payload. Expected { message: string }" },
      { status: 400 }
    );
  }

  // Platzhalter: später hier OpenAI / eigenes LLM / RAG etc.
  return NextResponse.json({
    reply: `Stub-Antwort: Ich habe "${body.message}" erhalten. (Hier kommt später dein KI-Chatbot rein.)`,
  });
}