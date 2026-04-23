import styles from "@/styles/components/section.module.scss";

export default function Section({
  id,
  children,
  flatContent = false,
}: {
  id: string;
  children: React.ReactNode;
  flatContent?: boolean;
}) {
  const contentClassName = flatContent
    ? `${styles.content} ${styles.contentPlain}`
    : styles.content;

  return (
    <section id={id} className={styles.section}>
      <div className={styles.inner}>
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}