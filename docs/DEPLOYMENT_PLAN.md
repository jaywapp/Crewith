# Crewith Deployment Plan

## Deployment Targets

| Component | MVP target | Later option |
|---|---|---|
| Admin web | Firebase Hosting or Vercel | Cloud Run if server-side requirements grow |
| API | Cloud Run | Firebase Functions for smaller callable endpoints |
| Database | Local JSON for development | Cloud Firestore |
| Auth | Development OTP for local MVP | Firebase Auth phone authentication |
| Push | Log-only reminder send | Firebase Cloud Messaging |
| Files | Profile image URL input | Firebase Storage |

## Recommended Production Shape

Use Cloud Run for the NestJS API and Firebase Hosting for the admin web.

Reasons:

- The current API is already a NestJS HTTP server.
- Cloud Run keeps the migration simple while Firebase Auth, Firestore, Storage, and FCM are added.
- Firebase Hosting can route admin web traffic cleanly and keep environment-specific config separate.
- Moving selected server logic to Cloud Functions can happen later for scheduled reminders and cleanup jobs.

## Environments

| Environment | Purpose |
|---|---|
| local | Developer machine, JSON persistence, development OTP |
| staging | Firebase/Cloud Run integration test, real Auth optional |
| production | Real clubs, real Auth, FCM, backup and monitoring enabled |

## Required Environment Variables

```text
PORT=
ADMIN_WEB_ORIGIN=
API_BASE_URL=
CREWITH_DATA_FILE=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
FCM_SENDER_ID=
NAVER_MAP_CLIENT_ID=
NAVER_MAP_CLIENT_SECRET=
```

## Admin Web Deployment Steps

1. Build with `npm run build -w @crewith/admin-web`.
2. Set `API_BASE_URL` to the deployed API URL.
3. Deploy to Firebase Hosting or Vercel.
4. Verify routes:
   - `/`
   - `/members`
   - `/fees`
   - `/events`
   - `/notices`
   - `/join`
   - `/reminders`

## API Deployment Steps

1. Build with `npm run build -w @crewith/api`.
2. Deploy the NestJS app to Cloud Run.
3. Set environment variables.
4. Enable CORS for the admin web origin.
5. Verify:
   - `GET /api/v1/health`
   - `GET /api/v1/clubs/{clubId}/admin/overview` with owner/operator auth
   - Member app overview endpoint

## Mobile App Deployment Steps

1. Configure `CREWITH_API_BASE_URL` for the target API.
2. Run `flutter test`.
3. Build Android debug/internal release.
4. Verify phone auth, member overview, event response, notice read, join request, and invite acceptance.
5. Prepare Play Console internal test track.

## Rollback

- Admin web: redeploy previous hosting version.
- API: roll back to previous Cloud Run revision.
- Firestore: keep export schedule before production launch.
- FCM: disable reminder jobs if duplicate or incorrect sends are detected.

## Monitoring

- Cloud Run request latency and error rate.
- API 4xx/5xx counts by route.
- Firestore read/write volume.
- FCM send success/failure.
- Admin web route error logs.
