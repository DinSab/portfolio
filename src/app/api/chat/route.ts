import { NextResponse } from "next/server";
import profile from "@/data/profile.json";

// Simple in-memory rate limiting (IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
let lastCleanupAt = 0;

// Sweep infrequently to keep per-request overhead low while preventing unbounded growth.
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;

function cleanupExpiredRateLimitEntries(now: number): void {
  if (now - lastCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS) return;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }

  lastCleanupAt = now;
}

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
  cleanupExpiredRateLimitEntries(now);

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) return false;

  record.count++;
  return true;
}

function formatList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatProjects(): string {
  return profile.projects
    .map(
      (project) => `- ${project.title}: ${project.description}\n  Role: ${project.role ?? "Not publicly listed"}\n  Stack: ${project.technologies.join(", ")}\n  Highlights: ${(project.highlights ?? []).join(" ")}\n  Link: ${project.link}`
    )
    .join("\n");
}

function formatExperience(): string {
  return profile.experience
    .map(
      (entry) => `- ${entry.title} at ${entry.company} (${entry.start} to ${entry.end})\n  Responsibilities: ${(entry.responsibilities ?? []).join(" ")}\n  Highlights: ${(entry.highlights ?? []).join(" ")}\n  Stack: ${(entry.technologies ?? []).join(", ") || "Not publicly listed"}`
    )
    .join("\n");
}

function formatEducation(): string {
  return profile.education
    .map((entry) => `- ${entry.degree} (${entry.institution})`)
    .join("\n");
}

function formatLanguages(): string {
  return profile.languages.map((entry) => `- ${entry.name}`).join("\n");
}

function isLikelyGermanText(text: string): boolean {
  return /\b(ich|und|der|die|das|mit|uber|projekt|erfahrung|kontakt|hallo|danke)\b|[äöüß]/i.test(
    text
  );
}

function createFallbackAnswer(question: string): string {
  if (isLikelyGermanText(question)) {
    return [
      "Dazu habe ich hier gerade keine verlassliche offentliche Antwort.",
      "",
      `Du kannst mir die Frage aber direkt per E-Mail schicken: **${profile.contact.email}**.`,
      "Ich antworte dir dann gerne personlich.",
    ].join("\n");
  }

  return [
    "I do not have a reliable public answer for that here.",
    "",
    `You can contact me directly by email at **${profile.contact.email}**.`,
    "I will be happy to answer you personally.",
  ].join("\n");
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

    const fallbackAnswer = createFallbackAnswer(trimmedQuestion);

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json({ answer: fallbackAnswer });
    }

    const contactLines = [
      `- Email: ${profile.contact.email}`,
      `- GitHub: ${profile.contact.github}`,
      `- LinkedIn: ${profile.contact.linkedin}`,
      ...(profile.contact.instagram ? [`- Instagram: ${profile.contact.instagram}`] : []),
    ].join("\n");

    const contactPriority = formatList(profile.chatPreferences.contactPriority);

    const systemPrompt = `
You are an AI assistant representing ${profile.name}, a ${profile.role} based in ${profile.location}.

About ${profile.name}:
${profile.intro}

${profile.about}

Skills & Technologies:
${profile.skills.join(", ")}

Strengths:
${formatList(profile.strengths)}

Projects:
${formatProjects()}

Experience:
${formatExperience()}

Education:
${formatEducation()}

Languages:
${formatLanguages()}

Availability:
${profile.availability}

Contact Information:
${contactLines}

Preferred contact priority:
${contactPriority}

Chat tone and language:
- ${profile.chatPreferences.tone}
- ${profile.chatPreferences.languagePolicy}

Mention only when asked:
${formatList(profile.chatPreferences.mentionOnlyWhenAsked)}

Never mention:
${formatList(profile.chatPreferences.neverMention)}

Answer style guardrails:
${formatList(profile.chatPreferences.answerStyle)}

When answering questions:
1. Provide accurate information based only on the profile above
2. Be professional, concise, and grounded in facts
3. Do not guess or invent missing details, numbers, metrics, clients, team sizes, or business impact
4. If a detail is missing, say that it is not publicly listed or available on request
5. Keep responses concise first, then expand if the visitor asks a follow-up question
6. Prefer concrete technologies, responsibilities, and project details over generic claims
7. Always respond in the same language as the question (German or English)
8. Use simple markdown formatting when it improves readability, such as short bullet lists and bold labels; avoid tables
9. If you cannot answer confidently from the provided profile, say the detail is not publicly listed and suggest contacting ${profile.name} directly via email at ${profile.contact.email}
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
      return NextResponse.json({ answer: fallbackAnswer });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ answer: fallbackAnswer });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Unhandled API error:", error);
    const fallbackAnswer = createFallbackAnswer("fallback");
    return NextResponse.json({ answer: fallbackAnswer });
  }
}