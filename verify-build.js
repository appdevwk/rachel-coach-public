// Verify packaging completeness and raw-body adapter without external requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const output = path.join(__dirname, '.vercel/output');
const manifest = JSON.parse(fs.readFileSync(path.join(output, 'build-manifest.json')));
const config = JSON.parse(fs.readFileSync(path.join(output, 'config.json')));
assert.equal(config.version, 3);
const csp = config.routes.find(r => r.headers?.['Content-Security-Policy'])?.headers['Content-Security-Policy'];
assert.ok(csp && !csp.split(';').find(x=>x.trim().startsWith('script-src')).includes("'unsafe-inline'"));
for (const filename of fs.readdirSync(path.join(output,'static')).filter(f=>f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(output,'static',filename),'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (!/\bsrc\s*=/i.test(match[1])) assert.ok(csp.includes("'sha256-"+crypto.createHash('sha256').update(match[2]).digest('base64')+"'"), 'Inline script hash absent: '+filename);
  }
}
assert.ok(fs.existsSync(path.join(output, 'static/index.html')));
assert.ok(!fs.existsSync(path.join(output, 'static/livekit.v2.js')), 'Retired credential-bearing asset must not ship');
for (const route of manifest.functions) {
  const mount = path.join(output, 'functions', route + '.func');
  const settings = JSON.parse(fs.readFileSync(path.join(mount, '.vc-config.json')));
  assert.equal(settings.runtime, 'nodejs24.x');
  assert.equal(typeof require(path.join(mount, settings.handler)), 'function', route);
  assert.ok(fs.existsSync(path.join(mount, 'node_modules/stripe/package.json')));
}
for (const route of ['/api/entry', '/api/onboarding/status', '/api/auth/status', '/api/billing/webhook', '/api/billing/portal', '/api/member', '/api/livekit/token']) {
  assert.ok(manifest.functions.includes(route), 'Required route absent: ' + route);
}
const webhookMount = path.join(output, 'functions/api/billing/webhook.func');
const settings = JSON.parse(fs.readFileSync(path.join(webhookMount, '.vc-config.json')));
assert.equal(settings.shouldAddHelpers, false, 'Webhook runtime must not parse body');
const original = require.resolve(path.join(webhookMount, 'api/billing/webhook.js'));
const saved = require.cache[original];
let received;
require.cache[original] = {exports: (req,res) => {received=req;return res.status(200).json({ok:true});}};
const wrapperPath = path.join(webhookMount, 'webhook-entry.js');
delete require.cache[require.resolve(wrapperPath)];
const wrapper = require(wrapperPath);
const request = {method:'POST',headers:{},rawBody:Buffer.from('unaltered bytes')};
let body;
const response = {setHeader(){},end(value){body=value;}};
wrapper(request,response);
assert.strictEqual(received,request);
assert.equal(received.rawBody.toString(),'unaltered bytes');
assert.equal(response.statusCode,200);
assert.deepEqual(JSON.parse(body),{ok:true});
require.cache[original]=saved;
delete require.cache[require.resolve(wrapperPath)];
const actualWrapper = require(wrapperPath);
const billing = require(path.join(webhookMount,'api/_billing.js'));
const originalWebhook = billing.webhook;
let seenBody;
billing.webhook=async req=>{seenBody=Buffer.from(req.rawBody);return {ok:true};};
(async()=>{
  const server=http.createServer(actualWrapper);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const bytes=Buffer.from('{ "unaltered": true, "spacing": "  " }\n');
    const status=await new Promise((resolve,reject)=>{
      const req=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/billing/webhook',method:'POST',headers:{'Content-Type':'application/json','Stripe-Signature':'offline-test','Content-Length':bytes.length}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
      req.on('error',reject);req.end(bytes);
    });
    assert.equal(status,200);assert.deepEqual(seenBody,bytes,'HTTP webhook bytes changed before signature verification');
  } finally {billing.webhook=originalWebhook;await new Promise(resolve=>server.close(resolve));}
  console.log('PASS: '+manifest.functions.length+' function mounts/imports, required routes, static index, retired asset exclusion, exact CSP hashes, and real loopback HTTP webhook byte preservation. External integrations remain unverified.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
