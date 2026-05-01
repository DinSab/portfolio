"use client";

import React, { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, Mail, Send, Sparkles, UserRound, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "@/styles/components/chat.module.scss";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatResponse {
  answer?: string;
  error?: string;
  retryAfter?: number;
}

const shortcuts = [
  { id: 1, label: "Erzahl mir etwas uber deinen Hintergrund.", icon: UserRound },
  { id: 2, label: "Welche Technologien nutzt du am haufigsten?", icon: Zap },
  { id: 3, label: "Welche Projekte und Praxiserfahrung bringst du mit?", icon: BriefcaseBusiness },
  { id: 4, label: "Wie kann ich dich kontaktieren?", icon: Mail },
];

const uiText = {
  de: {
    subtitle: "Frage nach meinem Hintergrund, Projekten, Stack oder meiner Verfugbarkeit.",
    emptyTitle: "Wie kann ich dir helfen?",
    emptyText: "Wahle eine Frage unten oder stelle direkt eine eigene.",
    placeholder: "Stelle deine Frage...",
    sendLabel: "Nachricht senden",
    typingLabel: "AI tippt...",
    rateLimitError: "Zu viele Anfragen auf einmal. Bitte versuche es in etwa einer Minute erneut.",
    serverError: "Der Chat ist momentan nicht verfugbar. Bitte versuche es spater erneut.",
    invalidResponse: "Es wurde keine gultige Antwort zuruckgegeben. Bitte versuche es erneut.",
    genericError: "Entschuldigung, beim Abrufen der Antwort ist ein Fehler aufgetreten.",
  },
  en: {
    subtitle: "Ask about my background, projects, stack, or availability.",
    emptyTitle: "How can I help?",
    emptyText: "Pick a question below or ask your own.",
    placeholder: "Ask your question...",
    sendLabel: "Send message",
    typingLabel: "AI is typing...",
    rateLimitError: "Too many requests right now. Please try again in about a minute.",
    serverError: "The chat is temporarily unavailable. Please try again later.",
    invalidResponse: "The response was incomplete. Please try again.",
    genericError: "Sorry, there was a problem getting a response.",
  },
} as const;

function getUiLanguage(): "de" | "en" {
  if (typeof navigator === "undefined") return "de";
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

function getFallbackError(status: number, language: "de" | "en"): string {
  if (status === 429) return uiText[language].rateLimitError;
  if (status >= 500) return uiText[language].serverError;
  return uiText[language].genericError;
}

function getRateLimitError(language: "de" | "en", retryAfterSeconds?: number): string {
  if (!retryAfterSeconds || Number.isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
    return uiText[language].rateLimitError;
  }

  const minutes = Math.floor(retryAfterSeconds / 60);
  const seconds = retryAfterSeconds % 60;

  if (language === "de") {
    if (minutes > 0 && seconds > 0) {
      return `Zu viele Anfragen. Bitte versuche es in ${minutes} Min ${seconds} Sek erneut.`;
    }

    if (minutes > 0) {
      return `Zu viele Anfragen. Bitte versuche es in ${minutes} Min erneut.`;
    }

    return `Zu viele Anfragen. Bitte versuche es in ${seconds} Sek erneut.`;
  }

  if (minutes > 0 && seconds > 0) {
    return `Too many requests. Please try again in ${minutes} min ${seconds} sec.`;
  }

  if (minutes > 0) {
    return `Too many requests. Please try again in ${minutes} min.`;
  }

  return `Too many requests. Please try again in ${seconds} sec.`;
}

function TypewriterMarkdown({
  text,
  onProgress,
}: {
  text: string;
  onProgress?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: number | undefined;

    const step = () => {
      const remaining = text.length - currentIndex;

      if (remaining <= 0) {
        setIsDone(true);
        return;
      }

      const chunkSize = Math.min(
        remaining,
        Math.random() < 0.7 ? 2 : 1 + Math.floor(Math.random() * 3)
      );
      currentIndex += chunkSize;

      setDisplayed(text.slice(0, currentIndex));
      onProgressRef.current?.();

      const nextDelay = 8 + Math.floor(Math.random() * 15);
      timeoutId = window.setTimeout(step, nextDelay);
    };

    step();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [text]);

  return (
    <div className={styles.typewriterText}>
      <div className={styles.markdown}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
          }}
        >
          {displayed}
        </ReactMarkdown>
      </div>
      {!isDone ? <span aria-hidden="true" className={styles.typewriterCaret} /> : null}
    </div>
  );
}

export default function ChatSection({ id }: { id: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [typingFrame, setTypingFrame] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLanguage(getUiLanguage());
  }, []);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = (await response.json()) as ChatResponse;

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfterSeconds = retryAfterHeader
            ? Number.parseInt(retryAfterHeader, 10)
            : data.retryAfter;

          throw new Error(getRateLimitError(language, retryAfterSeconds));
        }

        throw new Error(data.error || getFallbackError(response.status, language));
      }

      if (!data.answer) {
        throw new Error(uiText[language].invalidResponse);
      }

      const answer = data.answer;

      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          text: answer,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
        setIsLoading(false);
      }, 300);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setIsTyping(false);
      setIsLoading(false);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: error instanceof Error ? error.message : uiText[language].genericError,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleShortcutClick = (label: string) => handleSendMessage(label);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages.length, isTyping, typingFrame]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const canSend = inputValue.trim().length > 0 && !isLoading;
  const latestAiMessageId = [...messages].reverse().find((msg) => msg.sender === "ai")?.id;

  return (
    <motion.section 
      id={id} 
      className={styles.wrapper} 
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.25 }}
      transition={{ duration: 0.6, ease: "easeOut" }}>
      <div className={styles.shell}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Sparkles className={styles.headerIcon} />
            <h2 className={styles.title}>Din AI</h2>
          </div>
          <p className={styles.subtitle}>{uiText[language].subtitle}</p>
        </header>

        {/* Messages */}
        <div ref={scrollerRef} className={styles.messages}>
          {messages.length === 0 && !isTyping ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Sparkles className={styles.emptyIcon} />
              </div>
              <p className={styles.emptyTitle}>{uiText[language].emptyTitle}</p>
              <p className={styles.emptyText}>{uiText[language].emptyText}</p>
            </div>
          ) : (
            <div className={styles.thread}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.row} ${m.sender === "user" ? styles.rowUser : styles.rowAi}`}
                >
                  <div
                    className={`${styles.bubble} ${
                      m.sender === "user" ? styles.bubbleUser : styles.bubbleAi
                    }`}
                  >
                    {m.sender === "ai" ? (
                      m.id === latestAiMessageId ? (
                        <TypewriterMarkdown
                          text={m.text}
                          onProgress={() => setTypingFrame((current) => current + 1)}
                        />
                      ) : (
                        <div className={styles.markdown}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
                            }}
                          >
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      )
                    ) : (
                      <p className={styles.bubbleText}>{m.text}</p>
                    )}
                  </div>
                </div>
              ))}

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    key="typing"
                    className={`${styles.row} ${styles.rowAi}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className={`${styles.bubble} ${styles.bubbleAi} ${styles.typingBubble}`}>
                      <div className={styles.typingDots} aria-label={uiText[language].typingLabel} role="status">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className={styles.typingDot}
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                            transition={{
                              duration: 0.9,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.05,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className={styles.shortcutsWrap}>
          <div className={styles.shortcutsGrid}>
            {shortcuts.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleShortcutClick(s.label)}
                className={styles.shortcut}
                disabled={isLoading}
                aria-label={s.label}
                title={s.label}
              >
                <s.icon className={styles.shortcutIcon} aria-hidden="true" />
                <span className={styles.shortcutLabel}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className={styles.inputWrap}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputShell}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={uiText[language].placeholder}
                className={styles.input}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ""}`}
                disabled={!canSend}
                aria-label={uiText[language].sendLabel}
              >
                <Send className={styles.sendIcon} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.section>
  );
}