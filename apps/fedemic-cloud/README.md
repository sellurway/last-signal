# Fedemic Cloud frontend

This is the separate Fedemic Cloud dashboard. It does not replace or modify the Fedemic AI application at the repository root.

## Run locally

```bash
cd apps/fedemic-cloud
npm install
npm run dev
```

## Current status

The Phase 1 dashboard is a browser-only prototype. Project create/list/open/delete currently uses localStorage. It is not yet connected to real accounts or shared cloud storage.

## Backend

The API is a separate Cloudflare Worker in `apps/fedemic-cloud-api/`. It uses the existing Cloudflare D1 database named `fedemic-cloud` and Better Auth for email/password authentication.

Do not add Supabase credentials here. Do not put server secrets in any `VITE_` variable. The frontend will be connected to the Worker after the API is deployed and its allowed frontend origin is configured.

The existing `supabase/migrations/0001_fedemic_cloud.sql` file is a retired draft and must not be applied. The five existing Cloudflare D1 application tables are retained. Better Auth's own authentication tables will be generated and added separately in a later setup step.
