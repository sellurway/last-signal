# FEDEMIC AI

A responsive AI creative workspace built with React + Vite.

## Included
- AI image generation through Pollinations' image endpoint (bring your own permitted API key)
- AI writing and chat through Pollinations' OpenAI-compatible text endpoint
- Text-to-speech through Pollinations audio API, with browser speech synthesis fallback
- Music Studio prompt builder with a link to the free Hugging Face MusicGen demo
- Local prompt history, downloads, responsive navigation and settings

## Run locally
```bash
npm install
npm run dev
```

## AI provider setup
Open Settings and add a Pollinations key that is explicitly authorized for browser use. Do not paste a server-only secret key into a public website. The app keeps the entered key in memory for the current tab only. Provider availability, model access and free quotas can change; check https://gen.pollinations.ai/ for current requirements.

Music generation currently opens the hosted MusicGen demo rather than pretending an unavailable API has generated a track. The user can copy their prompt and continue there.

## Deploy
Import this repository into Vercel and use the Vite framework preset. No environment variables are required for the static frontend.
