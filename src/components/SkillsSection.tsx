"use client";

import dynamic from "next/dynamic";
import Section from "@/components/Section";
import profile from "@/data/profile.json";
import styles from "@/styles/components/skills-section.module.scss";
import { motion } from "framer-motion";

const SkillsPlanet = dynamic(() => import("@/components/SkillsPlanet"), {
  ssr: false,
});

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
        <SkillsPlanet skills={profile.skills} />
      </motion.div>
    </Section>
  );
}
