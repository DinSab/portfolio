"use client";

import Section from "@/components/Section";
import profile from "@/data/profile.json";
import styles from "@/styles/components/skills-section.module.scss";
import { motion } from "framer-motion";

export default function SkillsSection() {
  return (
    <Section id="skills" flatContent>
      <motion.div
        className={styles.skillsMotion}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.25, once: false }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        <div className={styles.skillsShell}>
          <div className={styles.skillsHeader}>
            <p className={styles.skillsKicker}>Core stack</p>
            <p className={styles.skillsLead}>Technologies I use to build modern, maintainable products.</p>
          </div>

          <ul className={styles.skillsGrid}>
            {profile.skills.map((skill, index) => {
              const level = (profile.skillLevels as Record<string, number>)[skill] ?? 0;
              return (
                <motion.li
                  key={skill}
                  className={styles.skillTile}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ amount: 0.5, once: false }}
                  transition={{
                    duration: 0.42,
                    ease: [0.22, 1, 0.36, 1],
                    delay: index * 0.05,
                  }}
                >
                  <span className={styles.skillName}>{skill}</span>
                  <span className={styles.stars} aria-label={`${level} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={i < level ? styles.starFilled : styles.starEmpty}
                        aria-hidden="true"
                      >★</span>
                    ))}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </Section>
  );
}
