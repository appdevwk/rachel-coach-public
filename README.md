# Rachel Coach: repaired development candidate

Release gate: **NO PASS — live configuration and integration verification required**.

Run `npm ci` then `npm test`. Source is reconstructed deterministically from `source-bundle.json`; do not hand-edit extracted files without regenerating the bundle. Both Netlify and Vercel configurations are included. The site is static; authenticated APIs remain server-only.

Repairs include OAuth state/PKCE, same-origin mutations, authenticated mapped hosted Checkout with durable attempt idempotency, signed raw-body webhook processing/deduplication, server-reconciled paid access, billing portal, request quotas, member orientation/progress/daily-time preferences in PostgreSQL, and free-only bounded chat with no automatic retry. Avatar bytes are included. Placeholder testimonials and unsupported instant-access claims removed. Old browser credential-signing script removed; the corresponding existing credential still requires owner rotation.

Stripe is test mode by default, and test/live records are isolated. Read `database/BILLING-SETUP.md`; apply `database/billing.sql` and `database/member.sql` only to an explicitly selected isolated preview database. No schema migration was performed by this repair.

Chat requires `RACHEL_ENABLE_CHAT=true` and OpenRouter configuration. It accepts only the free-model router/specific free variants, imposes zero price ceilings and no paid fallback. Zero price routing may find no available ZDR-compatible provider; that fails safely. Account upgrade/recharge settings still require verification outside source.

Voice is disabled by default. Enable only after a bounded agent worker is actually verified: token expiry does not end an active room. `RACHEL_ENABLE_VOICE=true` plus `RACHEL_BOUNDED_VOICE_WORKER=verified` are administrative configuration, not evidence of worker testing. Daily five-minute preferences are saved; outbound delivery is **not enabled** or claimed implemented.

Missing production prerequisites: WorkOS credentials/registered callback and cookie secret, matching isolated durable database/schema, Stripe test products/webhook/portal configuration, real voice/avatar/dispatch and daily delivery worker, phone/browser tests, account free-plan/no-upgrade/no-recharge evidence, observability/load/rollback. No production deployment or paid provider request occurred in this repair. Do not enable checkout/paid voice in production before full acceptance passes.

## Signup-first and welcome-email repair (2026-10-09)

The root checks the authenticated session server-side: visitors go to `signup.html`; signed-in members go to `/app`. Signup requests AuthKit's sign-up screen and retains existing OAuth state/PKCE. The successful callback shows `welcome.html`. Signup clearly reports when authentication is unavailable.

Welcome emails are separate transactional messages sent after verified email authentication. Configure a verified Resend sender with `RESEND_API_KEY`, `RACHEL_EMAIL_FROM` (plain email address), and `RACHEL_ENABLE_WELCOME_EMAIL=true`. First apply `database/welcome-email.sql` to an explicitly selected database. Never enable against an absent schema. The per-user outbox, PostgreSQL locking and provider idempotency prevent duplicate sign-in emails. Provider acceptance is recorded; inbox delivery still needs an actual verified test. Transient attempts retry on a later verified sign-in within 23 hours; older uncertain attempts require review. There is no background retry scheduler. Application caps are 90 first attempts/day and 2000/month, independent of any other sender account use. Verify the sender account stays on a free plan with no automatic upgrade before enabling. No sender account or credentials were created by this change.

The welcome email explains orientation, buy-box goals, the deal calculator, and Day 1. Account creation does not activate a paid plan. Automated calls are not promised. No promotional mailing list is created.

Current production chat was switched to `openrouter/free` and redeployed, but a live request still fails because no free endpoint matches the existing zero-data-retention policy. Do not remove this policy silently or fall back to paid models. Authentication is HTTP 503 with `configured:false`; no active WorkOS or email credentials are available. This candidate remains NO PASS until actual signup, welcome inbox delivery and coaching acceptance succeed.
