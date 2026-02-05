"use client";

import { useEffect, useRef } from "react";
import styles from "@/styles/components/navbar.module.scss";

const links = [
  { href: "#home", label: "Home", icon: "fa-solid fa-house" },
  { href: "#about", label: "About", icon: "fa-solid fa-address-card" },
  { href: "#skills", label: "Skills", icon: "fa-solid fa-code" },
  { href: "#projects", label: "Projects", icon: "fa-solid fa-diagram-project" },
  { href: "#contact", label: "Contact", icon: "fa-solid fa-envelope" },
];

export default function Navbar() {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const inner = innerRef.current;
    const indicator = indicatorRef.current;
    if (!inner || !indicator) return;

    const items = Array.from(inner.querySelectorAll<HTMLAnchorElement>("a[data-target]"));
    const sections = items
      .map((a) => document.getElementById(a.dataset.target || ""))
      .filter(Boolean) as HTMLElement[];

    let targetX = 0, targetW = 0;
    let curX = 0, curW = 0;
    let animRaf: number | null = null;
    let scrollRaf: number | null = null;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const snap = (n: number) => Math.round(n * dpr) / dpr;

    function stickySnap(t: number, dead = 0.65) {
      t = clamp(t, 0, 1);
      if (t <= dead) {
        const u = t / dead;
        return 0.08 * u * u;
      }
      const u = (t - dead) / (1 - dead);
      const eased = 1 - Math.pow(1 - u, 3);
      return 0.08 + 0.92 * eased;
    }

    function animate() {
      if (!indicator) return;
      const posFollow = 0.15;
      const sizeFollow = 0.20;

      curX += (targetX - curX) * posFollow;
      curW += (targetW - curW) * sizeFollow;

      indicator.style.transform = `translate3d(${snap(curX)}px, 0, 0)`;
      indicator.style.width = `${snap(curW)}px`;

      if (Math.abs(targetX - curX) < 0.2 && Math.abs(targetW - curW) < 0.2) {
        animRaf = null;
        return;
      }
      animRaf = requestAnimationFrame(animate);
    }

    function setIndicatorToItem(index: number) {
      if (!inner || !indicator) return;
      const el = items[index];
      if (!el) return;
      const parentRect = inner.getBoundingClientRect();
      const r = el.getBoundingClientRect();

      targetX = r.left - parentRect.left;
      targetW = r.width;

      indicator.style.opacity = "1";
      if (!animRaf) animRaf = requestAnimationFrame(animate);
    }

    function setIndicatorBetween(i: number, j: number, mix: number) {
      if (!inner || !indicator) return;
      const pr = inner.getBoundingClientRect();
      const a = items[i]?.getBoundingClientRect();
      const b = items[j]?.getBoundingClientRect();
      if (!a || !b) return;

      const ax = a.left - pr.left;
      const bx = b.left - pr.left;
      const aw = a.width;
      const bw = b.width;

      targetX = ax + (bx - ax) * mix;
      targetW = aw + (bw - aw) * mix;

      indicator.style.opacity = "1";
      if (!animRaf) animRaf = requestAnimationFrame(animate);
    }

    function getScrollProgress() {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const ref = y + vh * 0.25;

      let idx = 0;
      for (let i = 0; i < sections.length; i++) {
        const top = sections[i].getBoundingClientRect().top + window.scrollY;
        if (top <= ref) idx = i;
      }

      const next = clamp(idx + 1, 0, sections.length - 1);
      if (next === idx) return { idx, next, t: 0 };

      const aTop = sections[idx].getBoundingClientRect().top + window.scrollY;
      const bTop = sections[next].getBoundingClientRect().top + window.scrollY;

      const tRaw = (ref - aTop) / Math.max(1, bTop - aTop);
      return { idx, next, t: clamp(tRaw, 0, 1) };
    }

    function onScrollThrottled() {
      if (scrollRaf != null) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        const { idx, next, t } = getScrollProgress();
        if (idx === next) setIndicatorToItem(idx);
        else setIndicatorBetween(idx, next, stickySnap(t));
      });
    }

    items.forEach((a, i) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const id = a.dataset.target!;
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setIndicatorToItem(i);
        history.replaceState(null, "", `#${id}`);
      });
    });

    window.addEventListener("scroll", onScrollThrottled, { passive: true });
    window.addEventListener("resize", onScrollThrottled);

    requestAnimationFrame(() => {
      onScrollThrottled();
      curX = targetX;
      curW = targetW;
      indicator.style.width = `${snap(curW)}px`;
      indicator.style.transform = `translate3d(${snap(curX)}px, 0, 0)`;
      indicator.style.opacity = "1";
    });

    return () => {
      window.removeEventListener("scroll", onScrollThrottled);
      window.removeEventListener("resize", onScrollThrottled);
      if (animRaf) cancelAnimationFrame(animRaf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
    };
  }, []);

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.links} ref={innerRef}>
          {links.map((l) => (
            <a
              key={l.href}
              className={styles.link}
              href={l.href}
              data-target={l.href.replace("#", "")}
              aria-label={l.label}
            >
              <i className={l.icon} aria-hidden="true" />
              <span className={styles.linkLabel}>{l.label}</span>
            </a>
          ))}
          <span className={styles.indicator} ref={indicatorRef} aria-hidden="true" />
        </div>
      </nav>
    </header>
  );
}