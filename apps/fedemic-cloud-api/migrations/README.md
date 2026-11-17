# D1 migrations

The five Fedemic Cloud application tables have already been created manually in the existing D1 database named `fedemic-cloud`. Keep them.

Better Auth uses its own user, session, account, and verification tables. The Worker now exposes a one-time, protected migration endpoint at:

`POST /__admin/migrate-auth`

The endpoint uses Better Auth's official `getMigrations(auth.options)` helper for the built-in D1/Kysely adapter. It must be protected by the Cloudflare Worker secret `MIGRATION_TOKEN`. Never put this token in GitHub, frontend code, or a `VITE_*` variable.

## One-time production setup

1. In Cloudflare, open the `fedemic-cloud-api` Worker settings and add a secret named `MIGRATION_TOKEN`.
2. Generate a unique, high-entropy token (at least 32 random bytes). Do not reuse `BETTER_AUTH_SECRET`.
3. Wait for the Worker version containing this endpoint to deploy.
4. Send a POST request to `https://<your-worker-host>/__admin/migrate-auth` with the header `Authorization: Bearer <your-MIGRATION_TOKEN>`.
5. Confirm the response says `"success": true`.
6. Remove the `MIGRATION_TOKEN` secret after successful migration. The endpoint will then return 503 and cannot be used again unless a new token is configured.

The migration helper creates or updates Better Auth's required tables. It does not drop or replace the five Fedemic Cloud application tables. Do not run unrelated SQL or manually delete existing tables.

## Verification

After migration, test the Better Auth endpoints:

- `GET /api/auth/ok` (or Better Auth's documented health endpoint for the installed version)
- A registration request through the Better Auth client using `/api/auth/sign-up/email`
- A login request using `/api/auth/sign-in/email`

Do not claim registration/login is working until a real test account can register and sign in successfully.
