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

  const [rotation, setRotation] = useState({ x: -0.28, y: 0.44 });
  const [isCompact, setIsCompact] = useState(false);

  const draggingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: -0.28, y: 0.44 });
  const currentRotationRef = useRef({ x: -0.28, y: 0.44 });

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

      setRotation({
        x: currentRotationRef.current.x,
        y: currentRotationRef.current.y,
      });

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const sphereRadius = isCompact ? 118 : 176;
  const perspective = isCompact ? 360 : 520;
  const projectedNodes = useMemo(
    () =>
      nodes.map((node, index) => {
        const rotated = rotatePoint(points[index], rotation.x, rotation.y);
        const depth = (rotated.z + 1) / 2;
        const scale = perspective / (perspective - rotated.z * sphereRadius * 0.9);

        return {
          ...node,
          depth,
          left: rotated.x * sphereRadius * scale,
          top: rotated.y * sphereRadius * scale,
          scale: 0.72 + depth * 0.46,
          opacity: 0.32 + depth * 0.68,
          zIndex: Math.round(depth * 100),
        };
      }),
    [nodes, points, rotation.x, rotation.y, sphereRadius, perspective]
  );

  const backNodes = useMemo(() => projectedNodes.filter((node) => node.depth < 0.5), [projectedNodes]);
  const frontNodes = useMemo(() => projectedNodes.filter((node) => node.depth >= 0.5), [projectedNodes]);

  return (
    <div className={styles.skillsPlanetWrap}>
      <div
        className={styles.planetScene}
        onPointerDown={(event) => {
          draggingRef.current = true;
          lastPointRef.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
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
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerLeave={() => {
          draggingRef.current = false;
        }}
      >
        {backNodes.map((node) => (
          <span
            key={node.skill}
            className={`${styles.skillNode} ${styles.skillNodeBack} ${styles[node.colorClass]}`}
            style={{
              transform: `translate3d(${node.left}px, ${node.top}px, 0) scale(${node.scale})`,
              opacity: node.opacity,
              zIndex: node.zIndex,
            }}
            aria-hidden="true"
          >
            <span className={styles.skillNodeText}>{node.shortLabel}</span>
          </span>
        ))}

        <div className={styles.planetGlow} aria-hidden="true" />
        <div className={styles.planetShell} aria-hidden="true" />
        <div className={styles.planetAtmosphere} aria-hidden="true" />
        <div className={styles.planetTerminator} aria-hidden="true" />

        {frontNodes.map((node) => (
          <button
            key={node.skill}
            type="button"
            className={`${styles.skillNode} ${styles.skillNodeFront} ${styles[node.colorClass]}`}
            style={{
              transform: `translate3d(${node.left}px, ${node.top}px, 0) scale(${node.scale})`,
              opacity: node.opacity,
              zIndex: node.zIndex,
            }}
            aria-label={node.skill}
          >
            <span className={styles.skillNodeText}>{node.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}