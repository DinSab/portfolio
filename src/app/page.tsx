import styles from "@/styles/page.module.scss";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MeSection from "@/components/MeSection";
import HeroIntro from "@/components/HeroIntro";
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
          <HeroIntro />
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