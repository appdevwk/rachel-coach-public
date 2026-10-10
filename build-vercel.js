// Produce explicit Build Output API functions so build-time extraction never
// depends on Vercel's pre-build api directory discovery. No provider calls.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const output = path.join(root, '.vercel', 'output');
if (fs.existsSync(path.join(root, 'source-bundle.json'))) require('./extract.js');
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
if (!fs.existsSync(path.join(root, 'site', 'index.html'))) throw new Error('Missing extracted site/index.html');
if (!fs.existsSync(path.join(root, 'node_modules'))) throw new Error('Install locked dependencies with npm ci first');
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
fs.cpSync(path.join(root, 'site'), path.join(output, 'static'), {recursive: true});
// Copy complete source/dependencies inside each function's mount. Hardlinks
// save local space while retaining actual files in every independent bundle.
function copyTree(source, destination) {
  fs.mkdirSync(destination, {recursive: true});
  for (const item of fs.readdirSync(source, {withFileTypes: true})) {
    const from = path.join(source, item.name), to = path.join(destination, item.name);
    if (item.isDirectory()) copyTree(from, to);
    else if (item.isSymbolicLink()) {
      const resolved = fs.realpathSync(from);
      if (!resolved.startsWith(root + path.sep)) throw new Error('External symlink in function inputs');
      if (fs.statSync(resolved).isDirectory()) copyTree(resolved, to);
      else fs.copyFileSync(resolved, to);
    } else {
      try { fs.linkSync(from, to); } catch { fs.copyFileSync(from, to); }
    }
  }
}
function handlers(directory, prefix = '') {
  const results = [];
  for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
    const relative = path.posix.join(prefix, item.name);
    if (item.isDirectory()) results.push(...handlers(path.join(directory, item.name), relative));
    else if (item.name.endsWith('.js') && !item.name.startsWith('_')) results.push(relative);
  }
  return results.sort();
}
const routes = handlers(path.join(root, 'api'));
for (const relative of routes) {
  const mount = path.join(output, 'functions', 'api', relative.replace(/\.js$/, '.func'));
  copyTree(path.join(root, 'api'), path.join(mount, 'api'));
  if (fs.existsSync(path.join(root, 'worker'))) copyTree(path.join(root, 'worker'), path.join(mount, 'worker'));
  copyTree(path.join(root, 'node_modules'), path.join(mount, 'node_modules'));
  fs.copyFileSync(path.join(root, 'package.json'), path.join(mount, 'package.json'));
  const webhook = relative === 'billing/webhook.js';
  if (webhook) {
    // Stripe needs the untouched request stream, before any automatic parser.
    fs.writeFileSync(path.join(mount, 'webhook-entry.js'), "const handler=require('./api/billing/webhook');\nmodule.exports=(req,res)=>{res.status=function(code){this.statusCode=code;return this;};res.json=function(value){this.setHeader('Content-Type','application/json; charset=utf-8');this.end(JSON.stringify(value));return this;};return handler(req,res);};\n");
  }
  fs.writeFileSync(path.join(mount, '.vc-config.json'), JSON.stringify({
    runtime: 'nodejs24.x', handler: webhook ? 'webhook-entry.js' : 'api/' + relative, launcherType: 'Nodejs',
    shouldAddHelpers: !webhook, maxDuration: 60,
  }, null, 2) + '\n');
}
const outputRoutes = [];
outputRoutes.push({src: '/(.*)', headers: require('./security-headers')(path.join(output, 'static')), continue: true});
for (const group of config.headers || []) {
  outputRoutes.push({src: group.source, headers: Object.fromEntries(group.headers.map(h => [h.key, h.value])), continue: true});
}
for (const rewrite of config.rewrites || []) outputRoutes.push({src: '^' + rewrite.source + '$', dest: rewrite.destination});
outputRoutes.push({src: '^/$', dest: '/index.html'});
outputRoutes.push({handle: 'filesystem'});
fs.writeFileSync(path.join(output, 'config.json'), JSON.stringify({version: 3, routes: outputRoutes}, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'build-manifest.json'), JSON.stringify({
  format: 'Vercel Build Output API v3', runtime: 'nodejs24.x',
  functions: routes.map(r => '/api/' + r.replace(/\.js$/, '')),
  note: 'Build packaging only; provider deployment, credentials and business flows unverified.',
}, null, 2) + '\n');
console.log('Packaged ' + routes.length + ' explicit API functions and static site; no provider requests.');
