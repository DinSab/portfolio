import styles from "@/styles/page.module.scss";
import { portfolio } from "@/content/portfolio";
import Navbar from "@/components/Navbar";
import Section from "@/components/Section";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import MeSection from "@/components/MeSection";
import Chat from "@/components/Chat";

export default function Page() {
  return (
    <>
    <div className={styles.macbg}></div>
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <MeSection id="home">
          <img alt="Bild in Shibuya Sky" src="/img/bild_shibuya_sky_1.JPG"/>
          <h1>{portfolio.firstName}</h1>
          <p>{portfolio.role}</p>
          <p>{portfolio.intro}</p>

          <div className={styles.links}>
            <a className={styles.link} href={portfolio.contact.github} target="_blank" rel="noreferrer">
              <i className="fa-brands fa-github"></i>
            </a>
            <a className={styles.link} href={portfolio.contact.linkedin} target="_blank" rel="noreferrer">
              <i className="fa-brands fa-square-linkedin"></i>
            </a>
            <a className={styles.link} href={portfolio.contact.instagram} target="_blank" rel="noreferrer">
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>

        </MeSection>

        <Chat id="chat" title="Ask me anything!">

          <div className={styles.note}>
            <p className={styles.noteTitle}>Chatbot (später)</p>
            <p className={styles.noteText}>
              Backend ist vorbereitet unter <code>/api/chat</code>. Frontend-Widget bauen wir dann als Bonus.
            </p>
          </div>
        </Chat>

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
      </main>

      <Footer />
    </div>
  </>
  );
}