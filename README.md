# FEDEMIC AI

A responsive AI creative workspace built with React, Vite and Vercel serverless API routes.

## Creative studios
- **AI chat and writer** — NVIDIA NIM chat completions.
- **Image generation** — NVIDIA FLUX.1 Schnell.
- **Image editing** — NVIDIA FLUX.1 Kontext.
- **Website generator** — creates standalone responsive HTML websites.
- **Text to voice** — NVIDIA Magpie speech synthesis.
- **Music Studio** — browser-based beat sequencer, NVIDIA-assisted lyric writing and Magpie spoken vocal takes.
- **Video Studio** — NVIDIA WAN 2.2 through a separately deployed, OpenAI-compatible NVIDIA NIM video endpoint.

## NVIDIA environment variables

Set the existing NVIDIA API key in Vercel as `Nvidiakey`. The server also recognises `navidiakey`, `FEDEMIC`, and `fedemic`. Keep all secrets server-side; never place them in frontend code.

Open **Settings → Test NVIDIA connection** to check whether the deployed Vercel function can read the key and whether NVIDIA accepts it. The check reports the environment-variable name and API status without revealing the secret.

## Video generation setup

NVIDIA WAN 2.2 is a self-hosted NIM model; a normal NVIDIA API key does not provide a hosted WAN 2.2 GPU server. To activate Video Studio:

1. Deploy NVIDIA WAN 2.2 NIM on a compatible GPU server (NVIDIA documents 80 GB minimum GPU memory).
2. Configure the NIM's OpenAI-compatible `/v1/videos/generations` endpoint.
3. Add the full HTTPS endpoint in Vercel as `NVIDIA_VIDEO_API_URL`.
4. Redeploy the Vercel project.

Video Studio creates four-second 832×480 clips and supports optional image-to-video input. The Vercel function has a 60-second execution ceiling in this project; long-running video inference may require an asynchronous job service or a deployment plan/platform that supports longer execution.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Import this repository into Vercel and use the Vite framework preset. The `api/` directory contains the serverless API routes.
