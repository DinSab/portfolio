import { NextResponse } from "next/server";
import profile from "@/data/profile.json";

const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;

type RateLimitStore = Map<string, number[]>;

declare global {
  var __chatRateLimitStore: RateLimitStore | undefined;
  var __chatRateLimitCleanupTimer: ReturnType<typeof setInterval> | undefined;
}

const rateLimitStore: RateLimitStore = globalThis.__chatRateLimitStore ?? new Map<string, number[]>();
globalThis.__chatRateLimitStore = rateLimitStore;

function pruneExpiredRequests(now: number, requests: number[]): number[] {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  return requests.filter((timestamp) => timestamp > windowStart);
}

function cleanupExpiredRateLimitEntries(): void {
  const now = Date.now();

  for (const [key, requests] of rateLimitStore.entries()) {
    const activeRequests = pruneExpiredRequests(now, requests);
    if (activeRequests.length === 0) {
      rateLimitStore.delete(key);
      continue;
    }

    rateLimitStore.set(key, activeRequests);
  }
}

function ensureRateLimitCleanupInterval(): void {
  if (globalThis.__chatRateLimitCleanupTimer) return;

  globalThis.__chatRateLimitCleanupTimer = setInterval(
    cleanupExpiredRateLimitEntries,
    RATE_LIMIT_CLEANUP_INTERVAL_MS
  );
}

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();

  if (firstForwarded) {
    return firstForwarded;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return "unknown-ip";
}

function checkRateLimit(ip: string): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const existingRequests = rateLimitStore.get(ip) ?? [];
  const activeRequests = pruneExpiredRequests(now, existingRequests);

  if (activeRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestRequestTs = activeRequests[0];
    const retryAfterMs = Math.max(0, oldestRequestTs + RATE_LIMIT_WINDOW_MS - now);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  activeRequests.push(now);
  rateLimitStore.set(ip, activeRequests);
  return { allowed: true };
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
    ensureRateLimitCleanupInterval();

    const ip = getRateLimitKey(req);
    const rateLimitResult = checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfterSec.toString(),
          },
        }
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