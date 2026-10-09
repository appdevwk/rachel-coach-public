const fs = require("node:fs");
const path = require("node:path");
const files = require("./source-bundle.json");
for (const [name, text] of Object.entries(files)) {
  if (!/^(site|api|netlify|test|database)\//.test(name) || name.split("/").includes("..")) throw new Error("Unsafe source path");
  fs.mkdirSync(path.dirname(name), { recursive: true });
  fs.writeFileSync(name, typeof text === 'string' ? text : Buffer.from(text.base64, 'base64'));
}
