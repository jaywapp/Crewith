# Crewith Firebase Architecture

## Purpose

Crewith MVP starts with a NestJS API and local JSON persistence, but the production target is Firebase-backed infrastructure. This document defines the Firebase shape so the current API can be moved without changing the product model.

## Firebase Services

| Area | Firebase service | Usage |
|---|---|---|
| Auth | Firebase Authentication | Phone OTP login for members and operators. MVP uses SMS phone auth; PASS can be added later as an identity verification step. |
| Database | Cloud Firestore | Clubs, memberships, fees, events, notices, reads, reactions, join requests, invite links, notification logs. |
| Server logic | Cloud Functions for Firebase | Role-protected writes, recurring fee generation, reminder targeting, FCM dispatch, invite acceptance, data cleanup. |
| Hosting | Firebase Hosting | Admin web static/SSR deployment through Next.js adapter or Cloud Run-linked hosting if SSR requirements grow. |
| Push | Firebase Cloud Messaging | App push notifications for fee reminders, unread notices, event reminders, join request updates. |
| Files | Firebase Storage | Member profile images. |

## Collection Model

Use club-scoped subcollections for operational data.

```text
users/{userId}
clubs/{clubId}
clubs/{clubId}/members/{memberId}
clubs/{clubId}/joinRequests/{requestId}
clubs/{clubId}/inviteLinks/{inviteId}
clubs/{clubId}/fees/{feeId}
clubs/{clubId}/fees/{feeId}/payments/{memberId}
clubs/{clubId}/events/{eventId}
clubs/{clubId}/events/{eventId}/responses/{memberId}
clubs/{clubId}/events/{eventId}/attendance/{memberId}
clubs/{clubId}/notices/{noticeId}
clubs/{clubId}/notices/{noticeId}/reads/{memberId}
clubs/{clubId}/notices/{noticeId}/comments/{commentId}
clubs/{clubId}/notices/{noticeId}/reactions/{memberId}
clubs/{clubId}/notificationLogs/{notificationId}
users/{userId}/devices/{deviceId}
```

## Role Rules

Roles live on `clubs/{clubId}/members/{memberId}.role`.

| Role | Access |
|---|---|
| owner | Full club administration, role changes, subscription settings. |
| operator | Member, fee, event, notice, join request, invite, reminder management. Cannot transfer owner. |
| member | Own profile, own event response, visible notices/events, own fee status read. |

The current development API uses `x-crewith-role` to simulate this boundary. Production should replace that with Firebase Auth ID tokens plus a server-side role lookup.

## Security Rules Direction

Firestore rules should allow simple reads but keep complex writes behind Cloud Functions.

- Members can read their visible club data.
- Operators and owners can read full club admin data.
- Members can write only their own event response, notice read/reaction, profile fields, join request, and invite acceptance.
- Operator writes for fees, attendance, notices, invites, and join reviews should go through callable HTTPS Functions or the NestJS API using Firebase Admin SDK.
- `operators_only` events and notices must be hidden from regular members at both query and API serialization layers.

## Cloud Functions

Required functions for MVP production:

| Function | Trigger | Responsibility |
|---|---|---|
| `generateRecurringFees` | Scheduled | Create fee items from club fee settings by due date and interval. |
| `sendFeeReminders` | Scheduled/manual | Find unpaid members after club grace period and send FCM. |
| `sendNoticeUnreadReminders` | Scheduled/manual | Find unread notice targets and send FCM. |
| `sendEventReminders` | Scheduled/manual | Find no-response event members before deadline and send FCM. |
| `cleanupMemberPersonalData` | Scheduled | Remove personal profile fields 30 days after left/removed while preserving fee and attendance history. |
| `acceptInviteLink` | HTTPS callable/API | Validate token, expiry, disabled state, then create membership. |

## Migration Plan

1. Keep NestJS API contracts stable.
2. Replace `mvp.store.ts` with a repository interface.
3. Add `JsonMvpRepository` for local development.
4. Add `FirestoreMvpRepository` using Firebase Admin SDK.
5. Move role checks from `x-crewith-role` to Firebase ID token verification.
6. Move reminder send from log-only behavior to FCM dispatch.
7. Deploy admin web and API with environment-specific Firebase project IDs.

## Environment Variables

```text
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
FCM_SENDER_ID=
ADMIN_WEB_ORIGIN=
```

Local development can continue without these variables by using the JSON repository.
