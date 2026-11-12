# Fedemic Cloud app scaffold

This directory contains the separate Fedemic Cloud product surface. It is isolated from the existing Fedemic AI creative workspace at the repository root.

## Run

```bash
cd apps/fedemic-cloud
npm install
npm run dev
```

## Current status

Phase 1 dashboard prototype. Project CRUD is stored in browser localStorage when Supabase is not configured. This is demo persistence only, not production authentication or multi-user storage.

To enable the Supabase client, copy .env.example to .env.local and set the public project URL and anon key. Apply supabase/migrations/0001_fedemic_cloud.sql to a dedicated Supabase project. Real authentication and database wiring are still required before production use.

Never place a Supabase service-role key in Vite environment variables.
