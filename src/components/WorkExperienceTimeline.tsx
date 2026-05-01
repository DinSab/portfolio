"use client";

import { motion } from "framer-motion";
import Section from "@/components/Section";
import profile from "@/data/profile.json";
import styles from "@/styles/components/work-experience-timeline.module.scss";

type ExperienceEntry = {
  title: string;
  company: string;
  start: string;
  end: string;
  shortDescription?: string;
  highlights?: string[];
  responsibilities?: string[];
};

const uiText = {
  de: {
    kicker: "Berufserfahrung",
    title: "Timeline",
    fallbackDescription: "Details sind auf Anfrage verfugbar.",
    present: "Heute",
  },
  en: {
    kicker: "Work Experience",
    title: "Timeline",
    fallbackDescription: "Details are available on request.",
    present: "Present",
  },
} as const;

function getLanguage(): "de" | "en" {
  if (typeof navigator === "undefined") return "de";
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

function parseMonth(input: string): Date | null {
  const normalized = /^\d{4}-\d{2}$/.test(input) ? `${input}-01` : input;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonth(input: string, language: "de" | "en"): string {
  const date = parseMonth(input);
  if (!date) return input;

  return new Intl.DateTimeFormat(language === "de" ? "de-CH" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateRange(start: string, end: string, language: "de" | "en"): string {
  const startText = formatMonth(start, language);
  const endText = end.toLowerCase() === "present" ? uiText[language].present : formatMonth(end, language);
  return `${startText} - ${endText}`;
}

export default function WorkExperienceTimeline() {
  const language = getLanguage();

  const entries = [...(profile.experience as ExperienceEntry[])].sort((a, b) => {
    const left = parseMonth(a.start)?.getTime() ?? 0;
    const right = parseMonth(b.start)?.getTime() ?? 0;
    return right - left;
  });

  return (
    <Section id="experience" flatContent>
      <motion.div
        className={styles.timelineMotion}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.25, once: false }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        <div className={styles.header}>
          <p className={styles.kicker}>{uiText[language].kicker}</p>
          <h2 className={styles.title}>{uiText[language].title}</h2>
        </div>

        <div className={styles.timeline}>
          {entries.map((entry, index) => {
            const positionClass = index % 2 === 0 ? styles.itemLeft : styles.itemRight;
            const description =
              entry.shortDescription ||
              entry.highlights?.[0] ||
              entry.responsibilities?.[0] ||
              uiText[language].fallbackDescription;

            return (
              <motion.article
                key={`${entry.company}-${entry.title}-${entry.start}`}
                className={`${styles.item} ${positionClass}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.35, once: false }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
              >
                <div className={styles.dot} aria-hidden="true" />
                <div className={styles.card}>
                  <div className={styles.topRow}>
                    <p className={styles.company}>{entry.company}</p>
                    <p className={styles.dates}>{formatDateRange(entry.start, entry.end, language)}</p>
                  </div>

                  <p className={styles.role}>{entry.title}</p>
                  <p className={styles.description}>{description}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.div>
    </Section>
  );
}
