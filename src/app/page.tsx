import styles from "@/styles/page.module.scss";
import { portfolio } from "@/content/portfolio";
import Navbar from "@/components/Navbar";
import Section from "@/components/Section";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <Section id="home" title="Hi, ich bin">
          <div className={styles.hero}>
            <div>
              <h1 className={styles.heroTitle}>
                {portfolio.firstName}
              </h1>
              <p className={styles.heroRole}>{portfolio.role}</p>
              <p className={styles.heroIntro}>{portfolio.intro}</p>

              <div className={styles.heroActions}>
                <a className={styles.primaryBtn} href="#projects">
                  Projekte ansehen
                </a>
                <a className={styles.secondaryBtn} href="/cv.pdf" download>
                  CV herunterladen
                </a>
              </div>
            </div>

            <div className={styles.heroCard}>
              <p className={styles.heroCardTitle}>Kurzprofil</p>
              <ul className={styles.heroList}>
                <li>📍 {portfolio.location}</li>
                <li>🧠 Fokus: UI/UX + saubere Architektur</li>
                <li>⚙️ TypeScript / React / Next.js</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="about" title="About me">
          <p className={styles.text}>{portfolio.about}</p>
        </Section>

        <Section id="skills" title="Skills">
          <div className={styles.chips}>
            {portfolio.skills.map((s) => (
              <span key={s} className={styles.chip}>
                {s}
              </span>
            ))}
          </div>
        </Section>

        <Section id="projects" title="Projects">
          <div className={styles.grid}>
            {portfolio.projects.map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
          </div>
        </Section>

        <Section id="contact" title="Contact">
          <p className={styles.text}>
            Schreib mir gern:{" "}
            <a className={styles.link} href={`mailto:${portfolio.contact.email}`}>
              {portfolio.contact.email}
            </a>
          </p>

          <div className={styles.links}>
            <a className={styles.link} href={portfolio.contact.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className={styles.link} href={portfolio.contact.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>

          <div className={styles.note}>
            <p className={styles.noteTitle}>Chatbot (später)</p>
            <p className={styles.noteText}>
              Backend ist vorbereitet unter <code>/api/chat</code>. Frontend-Widget bauen wir dann als Bonus.
            </p>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}