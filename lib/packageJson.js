const path = require("path");
const { writeFile } = require("./fsHelpers");

function initPackageJson(root, name, args, flags) {
  const pkg = {
    name,
    version: "1.0.0",
    description: args.description || "Express API project",
    main: flags.useTS ? "server.ts" : "server.js",
    scripts: {
      start: flags.useTS ? "tsc && node dist/server.js" : "node server.js",
      dev: flags.useTS ? "ts-node-dev server.ts" : "nodemon server.js",
      test: "jest",
      seed: "node scripts/seedData.js"
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      dotenv: "^16.3.1",
      morgan: "^1.10.0"
    },
    devDependencies: {
      nodemon: "^3.0.1"
    },
    keywords: ["express", "api"],
    author: args.author || "",
    license: args.license || "MIT",
    engines: { node: ">=16.0.0" }
  };

  if (flags.withTests) {
    pkg.devDependencies.jest = "^29.6.2";
    pkg.devDependencies.supertest = "^6.3.3";
  }

  if (flags.useTS) {
    pkg.devDependencies["@types/node"] = "^20.5.0";
  }

  if (flags.useMongo) {
    pkg.dependencies.mongoose = "^7.5.0";
  }

  if (flags.usePostgres) {
    pkg.dependencies.sequelize = "^6.32.1";
    pkg.dependencies.pg = "^8.11.1";
  }

  if (flags.withELK) {
    pkg.dependencies["@elastic/elasticsearch"] = "^8.13.0";
  }

  writeFile(path.join(root, "package.json"), JSON.stringify(pkg, null, 2));
}
module.exports = { initPackageJson };