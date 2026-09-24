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
- User roles are stored in `users/{uid}`.
- Existing operational collections are organization-scoped.
- Document metadata is kept in Firestore while the actual file stays in the external document provider referenced by its HTTPS URL.
- Document links must use HTTPS.
- Document deletion is restricted to owner/admin/operations at the rules layer.
- Audit entries are immutable.

Do not deploy Firestore in test mode.

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

## Platform Admin

Platform administration is separate from the per-organization `admin` role.

- `/platform-admin` is available only to users listed in `platformAdmins/{uid}`.
- Platform Admin can review all users, suspend/activate accounts, change roles, inspect organization summaries, manage global feature flags, update platform settings, and review platform audit logs.
- Feature flags control both the navigation and route access for wired application modules.
- Adding a feature flag does not create new application code automatically; a new module must first be wired to that flag.

### Bootstrap the first Platform Admin

The `platformAdmins` collection is intentionally **not writable from the application**.

After deploying the new Firestore Rules, open:

`Firebase Console → Firestore Database → Data → platformAdmins`

Create a document whose ID is the Firebase Auth **UID** of the account that should own the platform.

The document can contain a simple field such as:

```
enabled: true
```

Then sign out and sign in again in Broker OS. The **إدارة المنصة** button and `/platform-admin` route will become available.

## Firebase deploy

The repository now pins Firebase project `broker-os-7df4b` through `.firebaserc`.

```bash
npm run build
firebase deploy --project broker-os-7df4b --only hosting,firestore:rules
```

Broker OS intentionally stays compatible with the Firebase Spark no-cost plan. Cloud Storage is not used; the Documents screen stores only secure HTTPS links to external files.

## Next architectural layers

1. Tasks and notifications.
2. Role-level write restrictions across the legacy CRM mutations.
3. Policy/client mutation audit coverage.
4. Reporting and broker performance analytics.
5. Search/indexing and dashboard aggregation to reduce realtime listener load.
