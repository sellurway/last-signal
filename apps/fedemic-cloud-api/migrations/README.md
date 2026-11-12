# D1 migrations

The five Fedemic Cloud application tables have already been created manually in the existing D1 database named `fedemic-cloud`. Keep them.

Better Auth also needs its own user, session, account and verification tables. Those tables must be generated from the exact Better Auth version installed in this Worker. They are intentionally not hand-written here.

Before applying the Better Auth migration:

1. Install dependencies in this API directory.
2. Generate the Better Auth schema using the installed version and its Cloudflare D1-compatible configuration.
3. Review the generated SQL.
4. Confirm it only creates/updates Better Auth tables and does not drop or replace the existing application tables.
5. Apply it to the existing `fedemic-cloud` D1 database.

Do not run an unreviewed migration against production data.
