const fs = require("node:fs");
const path = require("node:path");
const files = require("./source-bundle.json");
// Validate the complete bundle before replacing its generated source trees.
// Otherwise files removed in newer candidates survive extraction and ship.
for (const name of Object.keys(files)) {
  if (!/^(site|api|netlify|test|database)\//.test(name) || name.split("/").includes("..") || name.includes('\\')) throw new Error("Unsafe source path");
}
for (const directory of ['site', 'api', 'netlify', 'test', 'database']) {
  fs.rmSync(path.join(__dirname, directory), {recursive: true, force: true});
}
for (const [name, text] of Object.entries(files)) {
  if (!/^(site|api|netlify|test|database)\//.test(name) || name.split("/").includes("..")) throw new Error("Unsafe source path");
  const destination = path.join(__dirname, name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, typeof text === 'string' ? text : Buffer.from(text.base64, 'base64'));
}
