import styles from "@/styles/components/navbar.module.scss";

const links = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="#home">
          Portfolio
        </a>

        <div className={styles.links}>
          {links.map((l) => (
            <a key={l.href} className={styles.link} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}