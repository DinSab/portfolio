"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import styles from "@/styles/components/chat.module.scss";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const shortcuts = [
  { id: 1, label: "Über mich", emoji: "👋" },
  { id: 2, label: "Skills & Technologien", emoji: "⚡" },
  { id: 3, label: "Projekte & Erfahrung", emoji: "💼" },
  { id: 4, label: "Kontakt aufnehmen", emoji: "📧" },
];

export default function ChatSection({ id }: { id: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulated AI reply (replace later with your API call)
    window.setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Das ist eine Beispielantwort. Hier wird später die KI-Integration erfolgen, die Fragen über dich beantwortet.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 800);
  };

  const handleShortcutClick = (label: string) => handleSendMessage(label);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages.length]);

  const canSend = inputValue.trim().length > 0;

  return (
    <section id={id} className={styles.wrapper}>
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
          {messages.length === 0 ? (
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
                    <p className={styles.bubbleText}>{m.text}</p>
                  </div>
                </div>
              ))}
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
    </section>
  );
}