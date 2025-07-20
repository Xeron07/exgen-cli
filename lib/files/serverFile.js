const path = require("path");
const { writeFile } = require("../fsHelpers");

function createServerFile(root, useTS) {
  const content = `
const app = require("./src/app");
const http = require("http");

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(\`🚀 Central server running at http://localhost:\${PORT}\`);
});
  `;
  writeFile(path.join(root, useTS ? "server.ts" : "server.js"), content);
}
module.exports = { createServerFile };