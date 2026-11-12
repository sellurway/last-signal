# Fedemic Cloud — Product & Implementation Specification

**Positioning:** Build it. Deploy it. Own it.  
**Market:** Worldwide from day one.  
**Business model:** $10 one-time lifetime builder access, limited free hosting, optional paid resource upgrades.  
**Status:** Phase 1 foundation in progress.

## Product
Fedemic Cloud is one platform for creators and developers. Customers create websites with AI, visually edit them, import code from GitHub, deploy projects, connect custom domains they own, and manage hosting from one account.

## Product surfaces
1. Marketing site and pricing.
2. Authentication and account settings.
3. Project dashboard.
4. AI website generator.
5. Drag-and-drop visual editor.
6. Templates and reusable sections.
7. GitHub import and automated deployments.
8. Hosting, build logs, previews and rollbacks.
9. Custom domain and DNS management.
10. Usage, analytics, billing and admin console.

## Phased delivery and acceptance criteria

### Phase 1 — Foundation (current)
- Isolated Fedemic Cloud application surface; do not replace the existing Fedemic AI creative workspace.
- Responsive dashboard shell and navigation.
- Create, list, open and delete website projects.
- Local demo persistence for prototype use.
- PostgreSQL schema with row-level security for real accounts and projects.
- Environment configuration and clear production integration boundaries.

Acceptance: the isolated app installs and builds; dashboard works in demo mode; project CRUD persists in the current browser; database migration is reviewed. Demo mode is not production authentication or multi-user storage.

### Phase 2 — Accounts and builder
- Supabase Auth (email/password and OAuth).
- Server-verified identity and project ownership.
- Structured page schema and component registry.
- Drag/drop canvas, inspector, page management, undo/redo and autosave.
- AI produces validated page schema, not arbitrary privileged code.

### Phase 3 — Static hosting engine
- Queue-backed, isolated, ephemeral build workers.
- Static artifact storage, immutable deployment IDs and atomic production promotion.
- Platform subdomains, CDN delivery, logs, quotas and abuse controls.

### Phase 4 — GitHub deployments
- GitHub App installation with least-privilege repository permissions.
- Branch selection, signed webhook verification, build configuration and environment secrets.
- Previews, logs and rollback. Customer code never runs inside the dashboard/API process.

### Phase 5 — Custom domains
- Customer adds a domain they control.
- DNS ownership challenge, routing and managed TLS.
- Registrar integration is separate; the customer is registrant and renewal/transfer terms are explicit.

### Phase 6 — Monetization and scale
- Payment provider and webhook-verified entitlements.
- $10 lifetime builder entitlement with published fair-use limits.
- Paid storage, bandwidth, build minutes, AI credits and team features.
- Usage metering, cost alerts, refunds, support and abuse operations.

## Technical architecture

### Frontend
- React + TypeScript + Vite.
- Feature-oriented structure: app shell, projects, builder, integrations, domains and billing.
- UI state in React; durable customer data in the backend.
- Shared component schema for AI-generated and manually edited pages.

### Backend and data
- PostgreSQL as source of truth; Supabase Auth and Postgres are proposed for the MVP.
- Row-level security on every customer-owned table.
- Server-side API/worker layer for secrets, GitHub webhooks, billing, build orchestration and deployment promotion.
- Never expose service-role keys, GitHub installation tokens, AI keys or payment secrets to the browser.

### Hosting plane
- Cloudflare for DNS, CDN, edge routing and static delivery where plan limits and pricing fit.
- R2 or equivalent object storage for immutable build artifacts.
- Queue-backed build orchestration and isolated build workers.
- Customer code must never execute inside the dashboard/API process.
- Static-site hosting is distinct from future server-side runtime support.

### Integrations
- GitHub App for repository installation and webhooks.
- AI provider abstraction with server-side keys, quotas and validated structured output.
- Payment provider with signed webhook verification.
- Registrar API only after custom-domain connection is stable.

## Core data model
- profiles: user profile and account metadata.
- projects: owner, name, slug, framework, type and status.
- website_pages: project page slug and validated JSON page schema.
- github_installations: GitHub App installation reference (never raw browser token).
- deployments: commit, build status, immutable artifact reference and URL.
- domains: hostname, project, verification and TLS state.
- usage_daily: storage, bandwidth, build minutes and AI credits.
- entitlements and subscriptions: lifetime access and paid plans.
- audit_events: security-sensitive account and project actions.

All customer-owned rows require RLS based on auth.uid(). Public website delivery uses a separate read-only publication path, never customer write privileges.

## Security and reliability
- RLS and server-side authorization; never trust browser-supplied owner IDs.
- Least-privilege GitHub App permissions and token rotation.
- Secrets encrypted at rest and decrypted only in trusted server execution.
- Webhook signature verification and replay protection.
- Build isolation, resource quotas, egress restrictions and artifact scanning.
- Rate limits, upload limits, abuse reporting and account suspension.
- Audit logs, backups, export and account deletion.
- Per-customer usage metering and platform-wide cost alerts.

## Lifetime offer guardrails
The $10 lifetime purchase grants lifetime access to explicitly listed builder features, not unlimited infrastructure. Free hosting is quota-limited under transparent published terms. AI usage, storage, bandwidth, build minutes, domain registration and renewals have separate limits or charges. Never sell unlimited lifetime compute or imply a connected domain registration is included.

## Environment variables
Frontend public values: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.  
Server-only later-phase values: SUPABASE_SERVICE_ROLE_KEY, GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET, AI_PROVIDER_API_KEY, PAYMENT_SECRET_KEY, PAYMENT_WEBHOOK_SECRET, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and R2_BUCKET.

Never commit real credentials or put server secrets in VITE_ variables.

## Deployment strategy
Keep Fedemic Cloud isolated from the existing Fedemic AI application. Deploy Cloud from its own root directory or preferably a dedicated repository before public launch. Use preview builds, migrations and integration tests. No production claim until authentication, RLS, deployments, domain verification, billing webhooks and abuse controls are tested.

## Phase 1 exit checklist
- [ ] Cloud app builds independently.
- [ ] Dashboard is responsive.
- [ ] Project create/list/open/delete works in demo mode.
- [ ] Supabase schema and RLS migration reviewed.
- [ ] Dedicated Supabase project configured.
- [ ] Real account and database integration tested.
- [ ] Existing Fedemic AI app remains unchanged.
