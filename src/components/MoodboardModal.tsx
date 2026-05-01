"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { MoodboardItem } from "@/content/moodboard";
import styles from "@/styles/components/moodboard-modal.module.scss";
import Image from "next/image";

type MoodboardModalProps = {
  open: boolean;
  items: MoodboardItem[];
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export default function MoodboardModal({
  open,
  items,
  onClose,
  returnFocusRef,
}: MoodboardModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        returnFocusRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open, returnFocusRef]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            id="moodboard-modal"
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="moodboard-title"
            aria-describedby="moodboard-description"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.header}>
              <div>
                <p className={styles.kicker}>Moodboard</p>
                <h2 id="moodboard-title" className={styles.title}>Visual references and snapshots</h2>
                <p id="moodboard-description" className={styles.description}>
                  Desktop-only gallery with the current image set.
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close moodboard"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className={styles.masonry}>
              {items.map((item) => (
                <article key={item.id} className={styles.card}>
                  <Image
                    className={styles.image}
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    sizes="(max-width: 900px) 50vw, 33vw"
                    loading="lazy"
                    decoding="async"
                  />
                </article>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}