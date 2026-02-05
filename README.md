<div align="center">

# Portfolio

Modern personal portfolio built with Next.js, TypeScript and SCSS. Clean UI, fast performance, and a simple content model to keep your projects and profile easy to update.

</div>

## Overview

This app showcases skills, projects, and contact info with a responsive layout. Content lives in a single TypeScript file for quick edits, and styles use modular SCSS with a small variables layer. An API route (`/api/chat`) is scaffolded for a future chatbot integration.

## Features

- Responsive layout with `Navbar`, `Section`, `ProjectCard`, and `Footer` components
- Centralized content config in `src/content/portfolio.ts`
- SCSS modules with shared `variables.scss` and `mixins.scss`
- App Router structure under `src/app` (Next.js 16)
- Chat API stub at `/api/chat` ready for LLM integration
- ESLint + TypeScript for quality and DX

## Tech Stack

- Next.js 16, React 19
- TypeScript 5
- SCSS (Sass)
- Tailwind CSS 4 (postcss plugin included; optional)
- ESLint 9

## Project Structure

```
src/
	app/
		layout.tsx        # App shell (metadata, layout)
		page.tsx          # Home page
		api/
			chat/route.ts   # POST /api/chat (stub)
	components/         # UI components (Navbar, Footer, etc.)
	content/
		portfolio.ts      # Profile, skills, projects, contact
	styles/
		variables.scss    # Theme colors, spacing, typography
		mixins.scss       # Common mixins
		components/*.scss # Component-specific styles
public/               # Static assets
```

## Getting Started

Prerequisites: Node.js 18+ and npm.

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Scripts

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run start` – run production build locally
- `npm run lint` – run ESLint

## Content & Customization

Update your profile, skills, projects, and contact info in:

- `src/content/portfolio.ts` – edit `firstName`, `role`, `location`, `intro`, `about`, `skills`, `projects`, `contact`

Adjust global theme and component styles:

- `src/styles/variables.scss` – colors (`$bg`, `$text`), spacing, etc.
- `src/styles/components/*.scss` – per-component styles
- `src/app/globals.scss` – base resets and global styles

Tailwind v4 is available via PostCSS if you prefer utility classes. SCSS modules are the default in this project.

## API: Chat Stub

`POST /api/chat`

- Request body: `{ "message": string }`
- Response: `{ "reply": string }` (placeholder)

Example:

```bash
curl -X POST http://localhost:3000/api/chat \
	-H "Content-Type: application/json" \
	-d '{"message":"Hallo!"}'
```

This is a stub meant to be replaced with an LLM integration (OpenAI, local, RAG, etc.).

## Deployment

Any Node-compatible host works. Typical options:

- Vercel: zero-config Next.js deployments
- Docker/VM: `npm run build` then `npm run start`

Environment variables: none required yet. Add as you integrate services (e.g., for the chat route).

## Roadmap Ideas

- Replace chat stub with a real model
- Add project screenshots and live links
- Light/Dark theme toggle via CSS variables
- Unit tests for components

## License

Personal portfolio project. Use and adapt for your own profile.
