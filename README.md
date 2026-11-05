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


## Multi-provider free LLM catalogue

Fedemic includes a curated server-routed selection of OpenAI-compatible providers from https://github.com/open-free-llm-api/awesome-freellm-apis. The top-bar model selector applies to AI chat, writing, website generation and AI-written song lyrics.

Configure any providers you want in Vercel Project Settings -> Environment Variables, then redeploy:

| Provider | Environment variable | API key signup |
| --- | --- | --- |
| NVIDIA NIM | `FEDEMIC` (existing `fedemic` / `navidiakey` aliases work) | https://build.nvidia.com/ |
| Groq | `GROQ_API_KEY` | https://console.groq.com/keys |
| Cerebras | `CEREBRAS_API_KEY` | https://cloud.cerebras.ai/ |
| Mistral AI | `MISTRAL_API_KEY` | https://console.mistral.ai/ |
| DeepSeek | `DEEPSEEK_API_KEY` | https://platform.deepseek.com/ |
| OpenRouter | `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| LLM7.io | `LLM7_API_KEY` | https://llm7.io/ |
| ModelScope | `MODELSCOPE_API_KEY` | https://modelscope.cn/ |
| Chutes.ai | `CHUTES_API_KEY` | https://chutes.ai/ |

The `/api/models` endpoint reports configured providers without exposing secret values. `/api/ai` validates model IDs against a server-side allowlist and routes requests to the selected provider. Keys are never stored in localStorage or browser code. Each provider may require its own account/key and has its own changing rate limits and free quotas. NVIDIA remains the default. Image understanding stays on NVIDIA vision; image generation and speech retain their dedicated NVIDIA routes.
