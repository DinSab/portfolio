"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "@/styles/components/chat.module.scss";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const shortcuts = [
  { id: 1, label: "Über Din", emoji: "👋" },
  { id: 2, label: "Skills & Technologien", emoji: "⚡" },
  { id: 3, label: "Projekte & Erfahrung", emoji: "💼" },
  { id: 4, label: "Kontakt aufnehmen", emoji: "📧" },
];

function TypewriterText({ text, speed = 12 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    if (!text) {
      setDone(true);
      return;
    }

    let i = 0;
    const intervalId = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));

      if (i >= text.length) {
        window.clearInterval(intervalId);
        setDone(true);
      }
    }, speed);

    return () => window.clearInterval(intervalId);
  }, [text, speed]);

  return (
    <span className={styles.typewriterText}>
      {displayed}
      <span
        aria-hidden="true"
        className={`${styles.typewriterCaret} ${done ? styles.typewriterCaretDone : ""}`}
      >
        |
      </span>
    </span>
  );
}

export default function ChatSection({ id }: { id: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();

      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          text: data.answer,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      }, 300);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: "Entschuldigung, es gab einen Fehler beim Abrufen der Antwort.",
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
  }, [messages.length, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const canSend = inputValue.trim().length > 0;

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
          <p className={styles.subtitle}>Stelle mir Fragen und erfahre mehr über mich</p>
        </header>

        {/* Messages */}
        <div ref={scrollerRef} className={styles.messages}>
          {messages.length === 0 && !isTyping ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Sparkles className={styles.emptyIcon} />
              </div>
              <p className={styles.emptyTitle}>Wie kann ich dir helfen?</p>
              <p className={styles.emptyText}>
                Wähle eine der Optionen unten oder stelle deine eigene Frage
              </p>
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
                    <p className={styles.bubbleText}>
                      {m.sender === "ai" && m.id === latestAiMessageId ? (
                        <TypewriterText text={m.text} />
                      ) : (
                        m.text
                      )}
                    </p>
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
                      <div className={styles.typingDots} aria-label="AI tippt..." role="status">
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
              >
                <span className={styles.shortcutEmoji} aria-hidden="true">
                  {s.emoji}
                </span>
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
                placeholder="Stelle deine Frage..."
                className={styles.input}
              />
              <button
                type="submit"
                className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ""}`}
                disabled={!canSend}
                aria-label="Send message"
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