"use client";

import Section from "@/components/Section";
import profile from "@/data/profile.json";
import styles from "@/styles/components/about-me-section.module.scss";
import { motion } from "framer-motion";

export default function AboutMeSection() {
  return (
    <Section id="about" flatContent>
      <motion.div
        className={styles.aboutMotion}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.3, once: false }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        <div className={styles.aboutShell}>
          <div className={styles.aboutHeader}>
            <p className={styles.aboutKicker}>Who I am</p>
            <p className={styles.aboutRole}>{profile.role}</p>
          </div>

          <div className={styles.aboutBody}>
            <p className={styles.aboutLead}>
              Ich bin Din Sabic — Frontend / Fullstack Developer aus St. Gallen.
            </p>

            <p className={styles.aboutText}>
              Mein Fokus liegt auf der Entwicklung moderner, performanter Webanwendungen mit React, Next.js und TypeScript. Ich arbeite strukturiert, lege grossen Wert auf sauberen, wartbaren Code und gute User Experience — besonders bei Projekten, die technische Anforderungen mit klarer Visualisierung verbinden.
            </p>

            <p className={styles.aboutText}>
              Während meines Praktikums bei der St. Galler Kantonalbank habe ich eine Reporting-Lösung mit React, TypeScript und Chart.js entwickelt und an einer internen Webapplikation mit Admin-Interface mitgearbeitet. Ich arbeite gerne lösungsorientiert und eng mit Stakeholdern zusammen.
            </p>

            <div className={styles.aboutTags}>
              <span>React & Next.js</span>
              <span>TypeScript</span>
              <span>St. Gallen</span>
              <span>Open to work</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
