import { NextResponse } from "next/server";
import profile from "@/data/profile.json";

// Simple in-memory rate limiting (IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // May contain multiple IPs: "client, proxy1, proxy2"
    return forwarded.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) return false;

  record.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const ip = getRateLimitKey(req);
    if (!checkRateLimit(ip, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const question = (body as { question?: unknown })?.question;
    if (typeof question !== "string") {
      return NextResponse.json({ error: "Question must be a string" }, { status: 400 });
    }

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    if (trimmedQuestion.length > 1000) {
      return NextResponse.json(
        { error: "Question is too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const contactLines = [
      `- Email: ${profile.contact.email}`,
      `- GitHub: ${profile.contact.github}`,
      `- LinkedIn: ${profile.contact.linkedin}`,
      ...(profile.contact.instagram ? [`- Instagram: ${profile.contact.instagram}`] : []),
    ].join("\n");

    const systemPrompt = `
You are an AI assistant representing ${profile.name}, a ${profile.role} based in ${profile.location}.

About ${profile.name}:
${profile.intro}

${profile.about}

Skills & Technologies:
${profile.skills.join(", ")}

Contact Information:
${contactLines}

When answering questions:
1. Provide accurate information based on the profile above
2. Be friendly, professional, and enthusiastic
3. If you don't know something specific, say so honestly
4. Keep responses concise and relevant
5. Always respond in the same language as the question (German or English)
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmedQuestion },
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      return NextResponse.json({ error: "Failed to get response from AI" }, { status: 502 });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ error: "Unexpected response format from AI" }, { status: 500 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Unhandled API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}