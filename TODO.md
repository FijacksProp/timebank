# Time Bank MVP - 2 Day Build TODO (Django First)

## Goal
Ship a zero-cost, judge-ready MVP in 48 hours with a premium UI and one complete product loop:
`Signup -> Profile -> Match -> Request Session -> Complete Session -> Credits Update -> Review`

## Product Constraints
- Zero paid services.
- Keep scope strict; no bonus features unless core loop is done.
- Prioritize reliability + polish over feature count.

## Django-First Stack
- Backend: Django 5 + Django REST Framework
- Database: SQLite for fastest start (switchable to Postgres/Supabase later)
- Frontend: Django templates + Tailwind CSS + HTMX (or vanilla JS)
- Auth: Django auth (session-based)
- Validation: Django forms + DRF serializers
- Time handling: Python `zoneinfo` + Django timezone utilities
- Hosting: Render/Railway/Fly free tier or local demo

## Core Features (Must Ship)
- Auth: sign up, sign in, sign out
- Profile: name, bio, timezone, languages, skills offered, skills wanted, level
- Matching: deterministic compatibility score + reasons
- Session flow: request, accept/decline, scheduled time, status transitions
- Credit system: starting credits + earn/spend on completion
- Reviews: both sides rate after completed session

## Non-Goals (Do Not Build in 48h)
- Real-time chat
- Calendar API integrations
- Paid AI integrations
- Group sessions
- Gamification
- Community feed
- Full moderation back office

## UI/UX Bar (High Priority)
- Premium visual direction: clean, modern, intentional spacing
- Mobile-first responsive with strong desktop layout
- Design tokens for color/spacing/radius/shadow in one place
- Strong typography hierarchy and readable body text
- Polished states: loading, empty, error, hover, focus
- Accessibility baseline: keyboard focus and contrast-safe colors

## Architecture
- `config/` Django project settings, urls, wsgi/asgi
- `apps/accounts/` auth + profile + onboarding
- `apps/skills/` skill catalog + profile skill links
- `apps/matching/` score engine + match feed
- `apps/sessions_app/` session lifecycle + credit transactions
- `apps/reviews/` post-session ratings
- `templates/` shared layouts + page templates
- `static/` CSS, JS, images

## Information Architecture
- `/` Landing
- `/auth/signup` + `/auth/login`
- `/onboarding`
- `/dashboard`
- `/matches`
- `/sessions`
- `/sessions/<id>`
- `/profiles/<id>`

## Data Model (MVP)
- `accounts.User` (Django default user)
- `accounts.Profile`
  - `user (one-to-one)`, `full_name`, `bio`, `timezone`, `languages`, `avatar_url`, `created_at`
- `skills.Skill`
  - `name`, `category`
- `skills.ProfileSkillOffered`
  - `profile`, `skill`, `level`, `years`
- `skills.ProfileSkillWanted`
  - `profile`, `skill`, `target_level`
- `sessions_app.CreditLedger`
  - `profile`, `delta`, `reason`, `session`, `created_at`
- `sessions_app.Session`
  - `teacher`, `learner`, `skill`, `scheduled_at`, `duration_min`, `status`, `meeting_link`, `created_at`
  - statuses: `requested | accepted | declined | completed | cancelled`
- `reviews.Review`
  - `session`, `reviewer`, `reviewee`, `rating`, `comment`, `created_at`

## Matching Formula (No AI)
Compatibility score (0-100):
- Reciprocal skill fit: 40
- Timezone overlap: 20
- Level compatibility: 15
- Language overlap: 15
- Rating confidence: 10

Output:
- numeric score
- 3-5 readable match reasons

## Execution Plan (48 Hours)

## Day 1 - Backend Core + Primary Screens
- [ ] Initialize Django project + apps + base templates
- [ ] Configure static files + Tailwind pipeline or CDN utility setup
- [ ] Build auth routes and onboarding flow
- [ ] Implement profile + skills models and migrations
- [ ] Add seed command for 20-30 common skills
- [ ] Build matching engine service function
- [ ] Build `/matches` UI with score + reasons + request CTA

## Day 2 - Transactions + Polish + Demo Readiness
- [ ] Implement session request lifecycle and views
- [ ] Implement credit ledger updates on completion
- [ ] Implement reviews and average rating display
- [ ] Build dashboard cards (credits, upcoming, completed)
- [ ] Add empty/loading/error states
- [ ] Full responsive polish pass (mobile/tablet/desktop)
- [ ] Seed demo users + sessions data
- [ ] End-to-end test with 2 accounts
- [ ] Prep demo narrative and screenshots

## API/Service Checklist
- [ ] `create_profile(...)`
- [ ] `upsert_offered_skills(...)`
- [ ] `upsert_wanted_skills(...)`
- [ ] `compute_matches_for_user(...)`
- [ ] `request_session(...)`
- [ ] `respond_to_session_request(...)`
- [ ] `mark_session_completed(...)`
- [ ] `create_review(...)`
- [ ] `get_credit_balance(...)`

## Quality Gates (Must Pass)
- [ ] Auth-protected routes redirect correctly
- [ ] Credits never go below zero
- [ ] Session cannot be completed twice
- [ ] Review allowed only for completed sessions
- [ ] Core flow works on 390px and 1440px widths
- [ ] No blocker errors in Django runserver logs

## Demo Assets
- [ ] 2 demo users with reciprocal skills
- [ ] 1 pending request
- [ ] 1 accepted upcoming session
- [ ] 1 completed session (credits changed)
- [ ] 1 review pair

## Stretch (Only If Core Is Done)
- [ ] Suggested time-slot assistant
- [ ] iCal export
- [ ] Verification badges
- [ ] Animated compatibility meter

## Working Rules
- Build vertical slices, not disconnected pages.
- Every feature must be immediately demo-able.
- If blocked >20 minutes, simplify and continue.
- Keep commits small and descriptive.

## Definition of Done
- Core loop runs end-to-end locally and in deployed environment.
- UI looks polished and intentional across breakpoints.
- Demo can be delivered without dead flows.
