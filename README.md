# Rachel Coach Rebuild

Private recovery of the Rachel web app from appdevwk/rachel-assignment-coach, source commit 70b48ccf34b4b38e7520f2656e08690ae1eae842.

## Free hosting target

Netlify Free. Hosting is free within its current credit allowance; WorkOS, Stripe, LiveKit and model inference have independent terms and usage costs.

Run `npm ci` and `npm test`. Netlify deploy uses `netlify.toml`; public files are in `site`, API handlers in `api`, and a serverless adapter in `netlify/functions/api.js`. Set environment variables using `.env.example` in the provider's secret settings, never commit secret values. Register the actual deployed callback URL in WorkOS.

## Repairs

Voice always requires a verified WorkOS member; the legacy bypass cannot open it. Rooms are generated server-side per call, token TTL is ten minutes, and LiveKit requires a URL. Short cookie secrets fail configuration. Checkout return URLs use the configured site origin. Embedded Stripe Checkout uses embedded mode. A URL parameter no longer claims verified payment. Request parsing rejects invalid JSON and excessive bodies. Vercel-only analytics removed. Frontend/API separated so server code is not statically published.

## Release status: NO PASS

Five local regression tests pass. No deployed replacement exists yet. Production sign-in, actual checkout and subscription entitlements, bookings, daily calls, server persistence and voice-agent conversation remain unverified. No webhook-backed subscription entitlement implementation was recovered. Do not treat local tests as full release acceptance or expose paid functionality before these gates pass.

`source-bundle.json` contains the source tree excluding dependencies and credentials. It is included for upload recovery; run `node extract.js` before deployment if source directories are not already present.

Bulk GitHub upload failed. Source is stored as plain JSON text and reconstructed by extract.js. Avatar currently references the original public production asset.
