# Broker OS — UI and Firebase rules patch

## Files
- `index.html` — updated app HTML (header/icon styling, subscription pending flow).
- `firestore.rules` — Firestore security rules.
- `storage.rules` — Firebase Storage rules starter.
- `firebase.json` — Firebase CLI rules/index configuration.
- `firestore.indexes.json` — composite index for checking a user's pending subscription request.

## Subscription fix
The subscription request now opens a temporary tab synchronously from the click (reducing popup-blocker failures), saves/deduplicates the request, and **always** synchronizes `users/{uid}.subscriptionStatus = "pending"` even if a pending request already exists. It only navigates to WhatsApp after Firestore writes succeed. The subscription page shows the requested Arabic pending-payment message and a refresh action.

## Important setup
1. Back up your current HTML, then replace the deployed app HTML with `index.html`.
2. Review the rules against every collection and upload path used by your deployment before publishing. The wildcard Firestore rule is organization-scoped, but your app must write `orgId` on each business document. Creation also expects `createdBy == request.auth.uid`; if a particular app collection does not populate `createdBy`, update the app to do so or make a narrowly scoped rule for that collection.
3. The admin dashboard must use a trusted Firebase Admin SDK custom claim `admin: true` for administrators. Never let a browser/client write this claim. If the existing Admin UI relies only on a `role` field in a Firestore document, migrate it to custom claims or adapt the rules carefully after verifying the admin provisioning process.
4. Deploy from the directory containing these files:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
5. If your actual Storage paths differ from `organizations/{orgId}/...` or `users/{uid}/...`, adapt `storage.rules` to those exact paths. These rules intentionally deny unmatched paths.
6. Test with Firebase Emulator Suite and the app's real account types before production. Rules are security-sensitive; do not deploy unreviewed rules to a live project.

## Admin custom claim example (trusted server only)
Use Firebase Admin SDK in a trusted Node.js environment, never in frontend code:
```js
await admin.auth().setCustomUserClaims(uid, { admin: true });
```

## Note
The HTML contains the Firebase web config. Firebase web API keys identify the project but are not admin credentials. Security must be enforced by Firebase Security Rules and trusted backend code.
