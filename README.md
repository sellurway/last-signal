# FEDEMIC AI

A responsive AI creative workspace built with React + Vite.

## Creative studios
- **Image generator** — create images with the configured image provider.
- **Website generator** — turn a business brief into a standalone responsive HTML website.
- **AI chat** — brainstorm, plan and ask questions.
- **AI writer** — create polished copy and content.
- **Text to voice** — generate speech through NVIDIA Magpie.
- **Music studio** — generate complete original songs and instrumentals with ACE-Step 1.5, write lyrics, preview and download MP3 tracks.

## ACE-Step 1.5 music backend

Fedemic calls the ACE-Step asynchronous REST API through the same-origin Vercel function at `/api/music`. The model itself is **not hosted on Vercel**: deploy the official ACE-Step 1.5 API server on a machine or GPU hosting service, then configure these Vercel environment variables:

- `ACESTEP_API_URL` — base URL of the running ACE-Step API server, no trailing slash.
- `ACESTEP_API_KEY` — optional but strongly recommended; must match `ACESTEP_API_KEY` configured on the ACE-Step server.

The server must expose `POST /release_task`, `POST /query_result`, and `GET /v1/audio`. The Vercel function keeps the ACE-Step API key server-side and proxies audio downloads. Do not put the API key in browser code.

Official model repository and setup: https://github.com/ACE-Step/ACE-Step-1.5

Quick start on a supported GPU host:

```bash
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5
uv sync
uv run acestep-api
```

The API listens on port 8001 by default. Configure your GPU host's HTTPS ingress to forward to that port and enable API-key authentication before exposing it publicly. ACE-Step model weights and GPU inference require compute; the model is open-source, but hosted inference is not automatically free or unlimited.

## Existing NVIDIA provider

The app continues to use the existing `FEDEMIC`, `fedemic`, or `navidiakey` environment variable for its NVIDIA chat, image and speech routes. ACE-Step uses separate `ACESTEP_API_URL` and optional `ACESTEP_API_KEY` settings.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Import this repository into Vercel and use the Vite framework preset. Add the ACE-Step environment variables in Vercel Project Settings, then redeploy.
