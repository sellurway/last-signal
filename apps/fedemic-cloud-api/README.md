# Fedemic Cloud API

Cloudflare Worker API for Fedemic Cloud. This is separate from the React frontend and from the existing Fedemic AI application.

## Cloudflare resources already created

- Worker: `fedemic-cloud-api`
- D1 database: `fedemic-cloud`
- Worker D1 binding: `DB`
- Worker secret: `BETTER_AUTH_SECRET`

The secret value must remain in Cloudflare. Never put it in GitHub, source files, frontend variables or chat.

## Source layout

- `src/index.ts`: Worker entry point, D1 health check and Better Auth route.
- `wrangler.jsonc`: Worker deployment settings and D1 binding.
- `migrations/`: reserved for reviewed D1 migrations.

## Important before connecting GitHub Builds

Replace the placeholder `database_id` in `wrangler.jsonc` with the ID of the existing D1 database named `fedemic-cloud`. Do not create a second database. Keep the binding name exactly `DB`.

The existing Worker secret `BETTER_AUTH_SECRET` must be available to this Worker after Git-based deployment. It is not stored in this repository.

## Local commands

```bash
npm install
npm run typecheck
npm run dev
```

Deploy only after the D1 database ID has been filled in and the existing Cloudflare Worker settings have been checked:

```bash
npm run deploy
```

## Authentication status

This source prepares Better Auth with email/password and Cloudflare D1. Authentication is not live until the Better Auth database schema has been generated and applied to the existing D1 database, and registration/login/session tests pass.

Do not apply the retired Supabase SQL file. Do not delete or recreate the five existing Fedemic Cloud application tables. Better Auth's own tables are a separate migration and will be added in a later guided step.

The frontend origin will be added to `BETTER_AUTH_TRUSTED_ORIGINS` after the Fedemic Cloud frontend has a real deployment URL. Do not use the SellUrWay or Fedemic AI website as the trusted origin.
