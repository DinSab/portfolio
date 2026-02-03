import styles from "@/styles/components/footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} — Built with Next.js</p>
    </footer>
  );
}