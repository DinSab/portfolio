export type Project = {
  title: string;
  description: string;
  tech: string[];
  href?: string; // später GitHub / Live
};

export const portfolio = {
  firstName: "Din",
  role: "Frontend / Fullstack Developer",
  location: "Schweiz",
  intro:
    "Ich baue moderne Web-Apps mit Fokus auf saubere UI, gute UX und nachvollziehbare Architektur.",
  about:
    "Kurz etwas Persönliches: Was dich antreibt, wie du arbeitest, worauf du Wert legst. (Platzhalter)",
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "HTML/CSS/SCSS",
    "REST/GraphQL",
    "Git",
  ],
  projects: [
    {
      title: "Projekt 1 (Platzhalter)",
      description:
        "Kurze Beschreibung: Problem, Lösung, Impact. Später durch echtes Projekt ersetzen.",
      tech: ["Next.js", "TypeScript", "SCSS"],
    },
    {
      title: "Projekt 2 (Platzhalter)",
      description:
        "Noch ein Platzhalter. Perfekt, um später deinen KI-Chatbot oder ein Tool zu zeigen.",
      tech: ["React", "API", "UI"],
    },
  ] as Project[],
  contact: {
    email: "sabicdin@gmail.com", 
    github: "https://github.com/DinSab",
    linkedin: "https://www.linkedin.com/in/din-sabic/",
    instagram: "https://www.instagram.com/din.sg05/",
  },
};