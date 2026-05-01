"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/skills-section.module.scss";

type SkillNode = {
  skill: string;
  shortLabel: string;
  colorClass: string;
};

type SpherePoint = {
  x: number;
  y: number;
  z: number;
};

const SHORT_LABELS: Record<string, string> = {
  TypeScript: "TS",
  JavaScript: "JS",
  React: "React",
  "Next.js": "Next.js",
  "CSS/SCSS": "SCSS",
  Git: "Git",
  GitHub: "GitHub",
  SQL: "SQL",
  "LeanIX Custom Reports": "LeanIX",
  "Chart.js": "Chart.js",
  Redux: "Redux",
  "MS SQL Server": "MSSQL",
  Jest: "Jest",
  Vitest: "Vitest",
};

const COLOR_CLASSES = [
  "nodeBlue",
  "nodeViolet",
  "nodeGreen",
  "nodeOrange",
  "nodeCyan",
  "nodePink",
] as const;

const AUTO_SPIN_SPEED = 0.000875;

function createSpherePoints(total: number): SpherePoint[] {
  const points: SpherePoint[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < total; index += 1) {
    const offset = total === 1 ? 0 : index / (total - 1);
    const y = 1 - offset * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index;

    points.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }

  return points;
}

function rotatePoint(point: SpherePoint, rotateX: number, rotateY: number): SpherePoint {
  const cosX = Math.cos(rotateX);
  const sinX = Math.sin(rotateX);
  const cosY = Math.cos(rotateY);
  const sinY = Math.sin(rotateY);

  const yAfterX = point.y * cosX - point.z * sinX;
  const zAfterX = point.y * sinX + point.z * cosX;
  const xAfterY = point.x * cosY + zAfterX * sinY;
  const zAfterY = -point.x * sinY + zAfterX * cosY;

  return {
    x: xAfterY,
    y: yAfterX,
    z: zAfterY,
  };
}

function buildNodes(skills: string[]): SkillNode[] {
  return skills.map((skill, index) => ({
    skill,
    shortLabel: SHORT_LABELS[skill] ?? skill,
    colorClass: COLOR_CLASSES[index % COLOR_CLASSES.length],
  }));
}

export default function SkillsPlanet({
  skills,
}: {
  skills: string[];
}) {
  const nodes = useMemo(() => buildNodes(skills), [skills]);
  const points = useMemo(() => createSpherePoints(nodes.length), [nodes.length]);

  const [isCompact, setIsCompact] = useState(false);

  const draggingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: -0.28, y: 0.44 });
  const currentRotationRef = useRef({ x: -0.28, y: 0.44 });
  const backNodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const frontNodeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frontVisibleRef = useRef<boolean[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const update = () => setIsCompact(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let frame = 0;

    const animate = () => {
      if (!draggingRef.current) {
        targetRotationRef.current.y += AUTO_SPIN_SPEED;
      }

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.18;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.18;

      const sphereRadius = isCompact ? 118 : 176;
      const perspective = isCompact ? 360 : 520;

      for (let index = 0; index < nodes.length; index += 1) {
        const point = points[index];
        const node = nodes[index];
        const backEl = backNodeRefs.current[index];
        const frontEl = frontNodeRefs.current[index];

        if (!point || !node || !backEl || !frontEl) {
          continue;
        }

        const rotated = rotatePoint(point, currentRotationRef.current.x, currentRotationRef.current.y);
        const depth = (rotated.z + 1) / 2;
        const scale = perspective / (perspective - rotated.z * sphereRadius * 0.9);
        const left = rotated.x * sphereRadius * scale;
        const top = rotated.y * sphereRadius * scale;
        const transform = `translate3d(${left}px, ${top}px, 0) scale(${0.72 + depth * 0.46})`;
        const opacity = `${0.32 + depth * 0.68}`;
        const zIndex = `${Math.round(depth * 100)}`;
        const isFront = depth >= 0.5;

        backEl.style.transform = transform;
        backEl.style.opacity = isFront ? "0" : opacity;
        backEl.style.zIndex = zIndex;

        frontEl.style.transform = transform;
        frontEl.style.opacity = isFront ? opacity : "0";
        frontEl.style.zIndex = zIndex;

        if (frontVisibleRef.current[index] !== isFront) {
          frontVisibleRef.current[index] = isFront;
          frontEl.style.pointerEvents = isFront ? "auto" : "none";
          frontEl.tabIndex = isFront ? 0 : -1;
          frontEl.setAttribute("aria-hidden", isFront ? "false" : "true");
        }
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [isCompact, nodes, points]);

  useEffect(() => {
    frontVisibleRef.current = new Array(nodes.length).fill(true);
    backNodeRefs.current = backNodeRefs.current.slice(0, nodes.length);
    frontNodeRefs.current = frontNodeRefs.current.slice(0, nodes.length);
  }, [nodes.length]);

  return (
    <div className={styles.skillsPlanetWrap}>
      <div
        className={styles.planetScene}
        onPointerDown={(event) => {
          draggingRef.current = true;
          lastPointRef.current = { x: event.clientX, y: event.clientY };
          if (event.currentTarget.hasPointerCapture?.(event.pointerId) === false) {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;

          const deltaX = event.clientX - lastPointRef.current.x;
          const deltaY = event.clientY - lastPointRef.current.y;
          lastPointRef.current = { x: event.clientX, y: event.clientY };

          targetRotationRef.current.x = Math.max(
            -1.05,
            Math.min(1.05, targetRotationRef.current.x - deltaY * 0.0042)
          );
          targetRotationRef.current.y += deltaX * 0.0042;
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          draggingRef.current = false;
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerLeave={() => {
          draggingRef.current = false;
        }}
      >
        {nodes.map((node, index) => (
          <span
            key={`back-${node.skill}`}
            ref={(element) => {
              backNodeRefs.current[index] = element;
            }}
            className={`${styles.skillNode} ${styles.skillNodeBack} ${styles[node.colorClass]}`}
            aria-hidden="true"
          >
            <span className={styles.skillNodeText}>{node.shortLabel}</span>
          </span>
        ))}

        <div className={styles.planetGlow} aria-hidden="true" />
        <div className={styles.planetShell} aria-hidden="true" />
        <div className={styles.planetAtmosphere} aria-hidden="true" />
        <div className={styles.planetTerminator} aria-hidden="true" />

        {nodes.map((node, index) => (
          <button
            key={`front-${node.skill}`}
            type="button"
            ref={(element) => {
              frontNodeRefs.current[index] = element;
            }}
            className={`${styles.skillNode} ${styles.skillNodeFront} ${styles[node.colorClass]}`}
            style={{
              opacity: 0,
              pointerEvents: "none",
            }}
            aria-label={node.skill}
            aria-hidden="true"
            tabIndex={-1}
          >
            <span className={styles.skillNodeText}>{node.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}