import styles from "@/styles/components/footer.module.scss";

export default function Footer() {
  return (
    <footer id="contact" className={styles.footer}>
      <p>© {new Date().getFullYear()} — Built with Next.js, React, and TypeScript</p>
    </footer>
  );
}