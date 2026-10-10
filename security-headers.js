const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
module.exports = function securityHeaders(directory) {
  const hashes = new Set();
  for (const filename of fs.readdirSync(directory).filter(f => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(directory, filename), 'utf8');
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      if (!/\bsrc\s*=/i.test(match[1])) hashes.add("'sha256-" + crypto.createHash('sha256').update(match[2]).digest('base64') + "'");
    }
  }
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net " + [...hashes].sort().join(' ') + "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' wss: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
  };
};
