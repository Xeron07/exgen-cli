const fs = require("fs");
function mkdirp(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function writeFile(p, content) {
  fs.writeFileSync(p, content.trimStart());
}
module.exports = { mkdirp, writeFile };