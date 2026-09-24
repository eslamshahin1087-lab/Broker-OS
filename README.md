# Broker OS

Broker OS is a React + Vite + Firebase workspace for insurance brokers. The current architecture keeps existing top-level Firestore collections while enforcing tenant isolation through `organizationId`.

## Current architecture

```
Auth
  ↓
users/{uid}
  ├── organizationId
  └── role

organization-scoped collections
  ├── clients
  ├── leads
  ├── opportunities
  └── policies
```

The current business flow is:

```
LEAD → OPPORTUNITY → CLIENT → POLICY → COMMISSION → RENEWAL
```

When an opportunity is moved to **won**, the policy creation and opportunity update are performed in one Firestore transaction.

## Security

`firestore.rules` is the authorization boundary. Reads/writes for operational collections are restricted to the organization stored in the signed-in user's `users/{uid}` profile.

Do not deploy Firestore in test mode.

## Main routes

- `/` — Command Center / Dashboard
- `/clients` — Clients + Client 360
- `/leads` — Leads pipeline
- `/opportunities` — Opportunities
- `/policies` — Policies + renewals
- `/finance` — Financial dashboard
- `/quotes` — Quotes and quote-to-policy conversion
- `/insurers` — Insurer directory
- `/products` — Insurer products

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

A GitHub Actions workflow is included at `.github/workflows/ci.yml` to run dependency installation and the production build on pushes to the main/foundation branches and pull requests.

## Next architectural layers

The next planned layers are:

1. Organization membership and role-based permissions.
2. Quotes / insurers / products.
3. Renewals, claims, documents, payments and tasks.
4. Audit logs and notifications.
5. Reporting and broker performance analytics.
