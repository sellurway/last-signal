# FEDEMIC AI

A responsive AI creative workspace built with React + Vite.

## Creative studios
- **Image generator** — create images from text prompts with Pollinations.
- **Website generator** — turn a business brief into a standalone responsive HTML website, preview it in the app, copy the source or download the HTML.
- **AI chat** — brainstorm, plan and ask questions.
- **AI writer** — create polished copy and content.
- **Text to voice** — generate MP3 speech, with browser speech synthesis fallback.
- **Music generator** — generate original music tracks with the Pollinations audio endpoint.

## Workspace themes
Midnight, Cloud, Ocean and Sunset themes can be selected from the overview.

## Run locally
```bash
npm install
npm run dev
```

## Provider setup
Open **Settings** and add a Pollinations key authorized for browser use. Create/manage keys at https://enter.pollinations.ai/keys.

The app keeps the entered key in React memory for the current browser tab only; it is not stored in local storage or committed to GitHub. This is suitable for a personal prototype, not a public multi-user production service. Before a public launch, move provider calls behind a secure backend or implement an approved OAuth flow. Never put server-only secrets in client-side code.

Provider availability, model access, quotas and charges can change. Free, unlimited generation is not guaranteed. Browser speech synthesis can be used without a provider key, but MP3 generation requires provider access.

## Deploy
Import this repository into Vercel and use the Vite framework preset.
