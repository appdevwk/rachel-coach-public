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

Welcome emails are separate transactional messages sent after verified email authentication. Hostinger SMTP is the default provider: set `RACHEL_EMAIL_PROVIDER=hostinger`, `HOSTINGER_SMTP_USER` to the full existing mailbox address, `HOSTINGER_SMTP_PASSWORD` to its mailbox password (not your hPanel password), and `RACHEL_EMAIL_FROM` to that same address. SMTP uses `smtp.hostinger.com:465` with validated TLS. Keep secrets server-side. First apply `database/welcome-email.sql` to an explicitly selected database, verify mailbox eligibility, expiry and renewal settings in hPanel, then set `RACHEL_ENABLE_WELCOME_EMAIL=true` only for an authorized delivery test. Do not claim or purchase a trial/upgrade automatically. Current Hostinger free trials allow 100 outgoing messages per rolling 24 hours; legacy free eligibility depends on the account. App caps are 90 first attempts per rolling 24 hours and 2000 per calendar month; other mailbox traffic shares Hostinger's limit.

The per-user outbox reserves each SMTP attempt durably before sending. SMTP has no provider idempotency, so an uncertain/failed attempt requires manual review and is not automatically retried. A stable Message-ID is diagnostic only, not deduplication assurance. Accepted means SMTP server accepted the recipient, not inbox delivery. Resend remains available only when explicitly selected with `RACHEL_EMAIL_PROVIDER=resend`; its existing idempotency and 23-hour retry policy are retained. No provider fallback is automatic. Real PostgreSQL concurrency and actual inbox delivery still require verification. No mailbox or credentials were created by this change.

The welcome email explains orientation, buy-box goals, the deal calculator, and Day 1. Account creation does not activate a paid plan. Automated calls are not promised. No promotional mailing list is created.

Current production chat was switched to `openrouter/free` and redeployed, but a live request still fails because no free endpoint matches the existing zero-data-retention policy. Do not remove this policy silently or fall back to paid models. Authentication is HTTP 503 with `configured:false`; no active WorkOS or email credentials are available. This candidate remains NO PASS until actual signup, welcome inbox delivery and coaching acceptance succeed.
