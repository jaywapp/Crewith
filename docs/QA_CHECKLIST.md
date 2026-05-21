# Crewith MVP QA Checklist

## Admin Web

- Dashboard metrics render from API data.
- Sidebar routes open successfully:
  - `/`
  - `/members`
  - `/fees`
  - `/events`
  - `/notices`
  - `/join`
  - `/reminders`
- Member creation works with name, phone number, and role.
- Member role can be changed between owner, operator, and member.
- Member status can be changed between active, dormant, and left.
- Member delete action changes the member status to removed.
- Fee item creation works for recurring and one-time fees.
- Fee payment status can be changed to paid, unpaid, and exempt.
- Event creation works with date, location, response deadline, and visibility.
- Event response can be changed between attending and not attending.
- Attendance can be changed between present, late, and absent.
- Companion count can be saved.
- Notice creation works with all members and operators only visibility.
- Notice read status can be saved per member.
- Notice reaction can be toggled.
- Notice comment can be created.
- Join request can be approved or rejected.
- Invite link can be created with 7, 30, or 90 day expiry.
- Reminder target groups render for fee, event, and notice reminders.
- Reminder send action creates a notification log.
- Admin APIs return 403 without an owner/operator role.

## Member App

- Phone auth screen renders.
- Development OTP `123456` can enter the app.
- Home tab renders club name, next event, unpaid fee count, and unread notice count.
- Events tab renders event details and attendance response controls.
- Event response updates locally and through the API when reachable.
- Notices tab renders visible notices only.
- Operators-only notices are hidden from regular members.
- Notice read action updates locally and through the API when reachable.
- Fees tab renders fee amount, due date, and status.
- More tab renders profile editing, join request, and invite code flows.
- Profile name update reflects in the app.
- Public club join request can be submitted.
- Private club invite code can be accepted.

## API

- `GET /api/v1/health` returns `ok`.
- Admin overview requires owner/operator role.
- Member app overview returns only data visible to the member role.
- Fee dashboard metrics are recalculated from payment records.
- Event attendance metrics are recalculated from response and attendance records.
- Notice read metrics respect notice visibility.
- Removed members are hidden from normal member lists.
- Reminder targets are derived from unpaid fees, event no-response, and unread notices.
- JSON persistence works across API restarts in local development.

## Release Gate

- `npm run test -w @crewith/api` passes.
- `npm run build -w @crewith/admin-web` passes.
- `flutter test` passes.
- Admin web routes return HTTP 200.
- API health endpoint returns HTTP 200.
- No hard-coded production secrets exist in the repository.
- Environment variables are documented in `.env.example`.
