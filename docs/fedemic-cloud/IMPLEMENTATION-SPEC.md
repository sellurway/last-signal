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

- Separate Fedemic Cloud app; do not replace the existing Fedemic AI workspace.
- Responsive dashboard shell and navigation.
- Create, list, open and delete website projects in demo mode.
- Cloudflare Worker API project prepared separately from the frontend.
- Cloudflare D1 database named `fedemic-cloud` and application tables created.
- Demo mode clearly identified as browser-local only.

Acceptance: frontend builds independently; dashboard works in demo mode; Worker source is prepared for deployment. Authentication is not considered live until Better Auth tables, registration, login, session checks and ownership checks are tested.

### Phase 2 — Accounts and builder

- Better Auth email/password authentication on Cloudflare Workers.
- Cloudflare D1 as the database for authentication and customer data.
- Server-verified identity and project ownership on every private API action.
- Structured page schema and component registry.
- Drag/drop canvas, inspector, page management, undo/redo and autosave.
- AI produces validated page schema, not arbitrary privileged code.

### Phase 3 — Static hosting engine

- Queue-backed, isolated, ephemeral build workers.
- Static artifact storage, immutable deployment IDs and atomic production promotion.
- Platform subdomains, CDN delivery, logs, quotas and abuse controls.
- R2/object storage is optional and is postponed until a genuinely free/affordable path is confirmed.

### Phase 4 — GitHub deployments

- GitHub App installation with least-privilege repository permissions.
- Branch selection, signed webhook verification, build configuration and environment secrets.
- Previews, logs and rollback. Customer code never runs inside the dashboard/API process.

### Phase 5 — Custom domains

- Customer adds a domain they control.
- DNS ownership challenge, routing and managed TLS.
- Registrar integration is separate; the customer remains the registrant and renewal/transfer terms are explicit.

### Phase 6 — Monetization and scale

- Payment provider and webhook-verified entitlements.
- $10 lifetime builder entitlement with published fair-use limits.
- Paid storage, bandwidth, build minutes, AI credits and team features.
- Usage metering, cost alerts, refunds, support and abuse operations.

## Technical architecture

### Frontend

- React + Vite.
- Separate app directory: `apps/fedemic-cloud/`.
- Public API URL only in frontend environment variables.
- UI state in React; durable customer data must be stored in the backend.

### Backend and data

- Cloudflare Worker API: `apps/fedemic-cloud-api/`.
- Worker name: `fedemic-cloud-api`.
- Cloudflare D1 database: `fedemic-cloud`, bound to the Worker as `DB`.
- Better Auth handles registration, login, sessions and password security.
- Better Auth's required tables are separate from the five existing application tables and must be generated from the installed Better Auth version before applying a migration.
- The existing D1 application tables are retained: `cloud_profiles`, `cloud_projects`, `website_pages`, `cloud_subscriptions`, and `cloud_usage_events`.
- Every private API operation must derive the user from a verified Better Auth session. Never trust a browser-supplied owner ID.
- Never expose Cloudflare secrets, GitHub installation tokens, AI keys or payment secrets to the browser.

### Hosting plane

- Cloudflare for DNS, CDN, edge routing and static delivery where plan limits and pricing fit.
- R2 or equivalent object storage for immutable build artifacts, when affordable.
- Queue-backed build orchestration and isolated build workers.
- Customer code must never execute inside the dashboard/API process.
- Static-site hosting is distinct from future server-side runtime support.

### Integrations

- GitHub App for repository installation and webhooks.
- AI provider abstraction with server-side keys, quotas and validated structured output.
- Payment provider with signed webhook verification.
- Registrar API only after custom-domain connection is stable.

## Core data model

Existing D1 application tables:

- `cloud_profiles`: user profile and account metadata.
- `cloud_projects`: owner, name, slug, framework, type and status.
- `website_pages`: project page slug and validated JSON page schema.
- `cloud_subscriptions`: subscription and entitlement records.
- `cloud_usage_events`: metered usage events.

Better Auth separately manages its user, session, account and verification tables. Future phases may add GitHub installations, deployments, domains, audit events and daily usage summaries.

Public website delivery must use a separate read-only publication path, never customer write privileges.

## Security and reliability

- Better Auth session verification and server-side authorization.
- Least-privilege GitHub App permissions and token rotation.
- Secrets stored as Cloudflare Worker secrets, never committed to Git.
- Webhook signature verification and replay protection.
- Build isolation, resource quotas, egress restrictions and artifact scanning.
- Rate limits, upload limits, abuse reporting and account suspension.
- Audit logs, backups, export and account deletion.
- Per-customer usage metering and platform-wide cost alerts.

## Lifetime offer guardrails

The $10 lifetime purchase grants lifetime access to explicitly listed builder features, not unlimited infrastructure. Free hosting is quota-limited under transparent published terms. AI usage, storage, bandwidth, build minutes, domain registration and renewals have separate limits or charges. Never sell unlimited lifetime compute or imply a connected domain registration is included.

## Environment variables and secrets

Frontend public value:

- `VITE_FEDEMIC_CLOUD_API_URL`: public URL of the Cloudflare Worker API.

Cloudflare Worker secrets/configuration:

- `BETTER_AUTH_SECRET`: already stored as a Cloudflare Worker Secret; never copy it into GitHub or chat.
- `BETTER_AUTH_URL`: Worker API base URL, configured when the Worker URL is confirmed.
- `BETTER_AUTH_TRUSTED_ORIGINS`: exact Fedemic Cloud frontend origin, configured when its deployment URL is known.
- Future server-only values: GitHub App credentials, AI provider keys and payment secrets.

Never commit real credentials or put server secrets in `VITE_` variables.

## Deployment strategy

Keep Fedemic Cloud isolated from the existing Fedemic AI application. Deploy the API Worker from its own root directory and deploy the frontend separately. Use preview builds, reviewed D1 migrations and integration tests. No production claim until authentication, ownership checks, deployments, domain verification, billing webhooks and abuse controls are tested.

## Phase 1 exit checklist

- [ ] Cloud app builds independently.
- [ ] Dashboard is responsive.
- [ ] Project create/list/open/delete works in demo mode.
- [ ] Cloudflare Worker source is connected to the existing Worker.
- [ ] Better Auth schema is generated and applied to the existing D1 database.
- [ ] Registration, login, logout and session checks are tested.
- [ ] Private project APIs enforce verified ownership.
- [ ] Existing Fedemic AI app remains unchanged.
