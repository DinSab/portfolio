"use client";

import styles from "@/styles/components/mesection.module.scss";
import { motion } from "framer-motion";

export default function MeSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section 
      id={id} 
      className={styles.section}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.25 }}
      transition={{ duration: 0.6, ease: "easeOut" }}>
      <div className={styles.inner}>
        <div className={styles.content}>{children}</div>
      </div>
    </motion.section>
  );
}