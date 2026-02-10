import styles from "@/styles/components/mesection.module.scss";

export default function Section({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
}