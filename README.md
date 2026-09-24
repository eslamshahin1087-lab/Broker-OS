# Broker OS

Broker OS is a React + Vite + Firebase workspace for insurance brokers. The current architecture keeps the existing top-level Firestore collections while enforcing tenant isolation through `organizationId`.

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
  ├── policies
  ├── insurers
  ├── products
  ├── quotes
  ├── claims
  ├── payments
  ├── auditLogs
  └── documents

Storage
  └── organizations/{organizationId}/documents/{documentId}/{fileName}
```

The commercial and operational flow is:

```
LEAD → OPPORTUNITY → CLIENT → QUOTE → POLICY
                         ↓
                  CLAIMS / PAYMENTS
                         ↓
                 RENEWALS / AUDIT
                         ↓
                    DOCUMENTS
```

When an opportunity is moved to **won**, the policy creation and opportunity update are performed in one Firestore transaction. Accepting a quote can also create its policy in the same transaction.

## Security

- `firestore.rules` is the authorization boundary for Firestore data.
- `storage.rules` isolates uploaded files by `organizationId`.
- User roles are stored in `users/{uid}`.
- Existing operational collections are organization-scoped.
- Document metadata is kept in Firestore while files live in Firebase Storage.
- Document uploads are limited to 15 MB and a controlled set of document/image formats.
- Document deletion is restricted to owner/admin/operations at the rules layer.
- Audit entries are immutable.

Do not deploy Firestore or Storage in test mode.

## Main routes

- `/` — Command Center / Dashboard
- `/clients` — Clients + Client 360
- `/leads` — Leads pipeline
- `/opportunities` — Opportunities
- `/quotes` — Quotes and quote-to-policy conversion
- `/policies` — Policies + renewals
- `/renewals` — Renewal follow-up queue
- `/claims` — Claims
- `/payments` — Payments
- `/documents` — Secure document vault
- `/finance` — Financial dashboard
- `/insurers` — Insurer directory
- `/products` — Insurer products
- `/team` — Team + roles
- `/audit` — Audit log

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

## Firebase deploy

The repository now pins Firebase project `broker-os-7df4b` through `.firebaserc`.

```bash
npm run build
firebase deploy --only hosting,firestore:rules,storage
```

Before the first Storage deployment, make sure Firebase Storage is enabled for the project.

## Next architectural layers

1. Tasks and notifications.
2. Role-level write restrictions across the legacy CRM mutations.
3. Policy/client mutation audit coverage.
4. Reporting and broker performance analytics.
5. Search/indexing and dashboard aggregation to reduce realtime listener load.
