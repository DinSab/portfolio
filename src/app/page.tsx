import styles from "@/styles/page.module.scss";
import { portfolio } from "@/content/portfolio";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MeSection from "@/components/MeSection";
import ChatSection from "@/components/Chat";
import AboutMeSection from "@/components/AboutMeSection";
import SkillsSection from "@/components/SkillsSection";
import SpotifySection from "@/components/SpotifySection";

export default function Page() {
  return (
    <>
    <div className={styles.macbg}></div>
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <MeSection id="home">
          <img alt="Bild in Shibuya Sky" src="/img/bild_zara.jpg"/>
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
            <a className={styles.link} href="/Sabic_Din_Lebenslauf.pdf" target="_blank" rel="noreferrer" download>
              <i className="fa-solid fa-file"></i>
            </a>
          </div>

        </MeSection>

        <ChatSection id="chat" />

        <AboutMeSection/>

        <SkillsSection />

        <SpotifySection/>
      </main>

      <Footer />
    </div>
  </>
  );
}