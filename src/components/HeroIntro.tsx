"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { portfolio } from "@/content/portfolio";
import { moodboardItems } from "@/content/moodboard";
import MoodboardModal from "@/components/MoodboardModal";
import pageStyles from "@/styles/page.module.scss";
import sectionStyles from "@/styles/components/mesection.module.scss";

const DESKTOP_MOODBOARD_QUERY = "(min-width: 861px) and (hover: hover) and (pointer: fine)";

export default function HeroIntro() {
  const [canOpenMoodboard, setCanOpenMoodboard] = useState(false);
  const [isMoodboardOpen, setIsMoodboardOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MOODBOARD_QUERY);
    const update = () => {
      const canOpen = mediaQuery.matches;
      setCanOpenMoodboard(canOpen);
      if (!canOpen) {
        setIsMoodboardOpen(false);
      }
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return (
    <>
      <div className={sectionStyles.heroMediaWrap}>
        {canOpenMoodboard ? (
          <button
            ref={triggerRef}
            type="button"
            className={sectionStyles.heroImageButton}
            onClick={() => setIsMoodboardOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMoodboardOpen}
            aria-controls="moodboard-modal"
          >
            <Image
              className={sectionStyles.heroImage}
              alt="Portrait in Shibuya Sky"
              src="/img/bild_zara.jpg"
              width={840}
              height={1120}
              priority
            />
            <span className={sectionStyles.heroImageHint}>Open moodboard</span>
          </button>
        ) : (
          <Image
            className={sectionStyles.heroImage}
            alt="Portrait in Shibuya Sky"
            src="/img/bild_zara.jpg"
            width={840}
            height={1120}
            priority
          />
        )}
      </div>

      <h1>{portfolio.firstName}</h1>
      <p>{portfolio.role}</p>
      <p>{portfolio.intro}</p>
      <div className={pageStyles.links}>
        <a className={pageStyles.link} href={portfolio.contact.github} target="_blank" rel="noreferrer">
          <i className="fa-brands fa-github"></i>
        </a>
        <a className={pageStyles.link} href={portfolio.contact.linkedin} target="_blank" rel="noreferrer">
          <i className="fa-brands fa-square-linkedin"></i>
        </a>
        <a className={pageStyles.link} href={portfolio.contact.instagram} target="_blank" rel="noreferrer">
          <i className="fa-brands fa-instagram"></i>
        </a>
        <a className={pageStyles.link} href="/Sabic_Din_Lebenslauf.pdf" target="_blank" rel="noreferrer" download>
          <i className="fa-solid fa-file"></i>
        </a>
      </div>

      <MoodboardModal
        open={isMoodboardOpen && canOpenMoodboard}
        items={moodboardItems}
        onClose={() => setIsMoodboardOpen(false)}
        returnFocusRef={triggerRef}
      />
    </>
  );
}