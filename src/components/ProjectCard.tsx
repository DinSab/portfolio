import type { Project } from "@/content/portfolio";
import styles from "@/styles/components/project-card.module.scss";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.title}>{project.title}</h3>
        {project.href ? (
          <a className={styles.open} href={project.href} target="_blank" rel="noreferrer">
            Öffnen →
          </a>
        ) : (
          <span className={styles.placeholder}>Coming soon</span>
        )}
      </div>

      <p className={styles.desc}>{project.description}</p>

      <div className={styles.tech}>
        {project.tech.map((t) => (
          <span key={t} className={styles.tag}>
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}