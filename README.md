# Rachel Coach: repaired development candidate

Release gate: **NO PASS — live configuration and integration verification required**.

Run `npm ci` then `npm test`. Source is reconstructed deterministically from `source-bundle.json`; do not hand-edit extracted files without regenerating the bundle. Both Netlify and Vercel configurations are included. The site is static; authenticated APIs remain server-only.

Repairs include OAuth state/PKCE, same-origin mutations, authenticated mapped hosted Checkout with durable attempt idempotency, signed raw-body webhook processing/deduplication, server-reconciled paid access, billing portal, request quotas, member orientation/progress/daily-time preferences in PostgreSQL, and free-only bounded chat with no automatic retry. Avatar bytes are included. Placeholder testimonials and unsupported instant-access claims removed. Old browser credential-signing script removed; the corresponding existing credential still requires owner rotation.

Stripe is test mode by default, and test/live records are isolated. Read `database/BILLING-SETUP.md`; apply `database/billing.sql` and `database/member.sql` only to an explicitly selected isolated preview database. No schema migration was performed by this repair.

Chat requires `RACHEL_ENABLE_CHAT=true` and OpenRouter configuration. It accepts only the free-model router/specific free variants, imposes zero price ceilings and no paid fallback. Zero price routing may find no available ZDR-compatible provider; that fails safely. Account upgrade/recharge settings still require verification outside source.

Voice is disabled by default. Enable only after a bounded agent worker is actually verified: token expiry does not end an active room. `RACHEL_ENABLE_VOICE=true` plus `RACHEL_BOUNDED_VOICE_WORKER=verified` are administrative configuration, not evidence of worker testing. Daily five-minute preferences are saved; outbound delivery is **not enabled** or claimed implemented.

Missing production prerequisites: WorkOS credentials/registered callback and cookie secret, matching isolated durable database/schema, Stripe test products/webhook/portal configuration, real voice/avatar/dispatch and daily delivery worker, phone/browser tests, account free-plan/no-upgrade/no-recharge evidence, observability/load/rollback. No production deployment or paid provider request occurred in this repair. Do not enable checkout/paid voice in production before full acceptance passes.
