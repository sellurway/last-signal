# FEDEMIC AI

A responsive AI creative workspace built with React, Vite and Vercel serverless API routes.

## Creative studios
- **AI chat and writer** — NVIDIA NIM chat completions.
- **Image generation** — NVIDIA FLUX.1 Schnell.
- **Image editing** — NVIDIA FLUX.1 Kontext.
- **Website generator** — creates standalone responsive HTML websites.
- **Text to voice** — NVIDIA Magpie speech synthesis.
- **Music Studio** — lyrics and spoken vocal takes, with an optional collapsible browser-based beat sequencer.

## NVIDIA environment variables

Set the existing NVIDIA API key in Vercel as `Nvidiakey`. The server also recognises `navidiakey`, `FEDEMIC`, and `fedemic`. Keep all secrets server-side; never place them in frontend code.

Open **Settings → Test NVIDIA connection** to check whether the deployed Vercel function can read the key and whether NVIDIA accepts it. The check reports the environment-variable name and API status without revealing the secret.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Import this repository into Vercel and use the Vite framework preset. The `api/` directory contains the serverless API routes.
