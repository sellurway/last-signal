# FEDEMIC AI

A responsive AI creative workspace built with React + Vite.

GitHub Actions runs a production build check on every push and pull request.

## Included
- AI image generation through Pollinations
- AI writing and chat through Pollinations' OpenAI-compatible API
- Text-to-speech through Pollinations, with browser speech synthesis fallback
- Music generation through Pollinations audio generation
- Text-to-video and image-to-video through Hugging Face Inference Providers (Wan 2.2 TI2V)
- MP4 preview and download, prompt history, responsive navigation and settings

## Run locally
```bash
npm install
npm run dev
```

## Provider setup
Open **Settings** inside the app:
- Add a Pollinations key authorized for browser use for image, text, voice and music.
- Add a Hugging Face user access token with **Inference Providers** permission for video generation. Create one at https://huggingface.co/settings/tokens.

The app keeps entered tokens in React memory for the current browser tab only. They are not saved to local storage or committed to GitHub. This is suitable for a personal prototype, not a public multi-user production service: before a public launch, move provider calls behind a secure backend or implement an appropriate OAuth flow. Never put a server-only secret in client-side code.

Hugging Face provides limited monthly free inference credits for free accounts; the allowance can change and video provider requests may consume credits or require billing. Free, unlimited AI video generation is not guaranteed. See https://huggingface.co/docs/inference-providers/pricing.

## Deploy
Import this repository into Vercel and use the Vite framework preset. No build-time environment variables are required for the static frontend. Users enter their own provider credentials in Settings.
