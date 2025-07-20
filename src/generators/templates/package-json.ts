import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generatePackageJson(
  options: ResolvedOptions
): Promise<void> {
  const packageJson = {
    name: options.projectName,
    version: "1.0.0",
    private: true,
    description: `Express application ${options.projectName}`,
    main: options.isTypescript ? "dist/app.js" : "src/app.js",
    scripts: {
      start: options.isTypescript ? "node dist/app.js" : "node src/app.js",
      dev: options.isTypescript ? "tsx watch src/app.ts" : "nodemon src/app.js",
      ...(options.isTypescript && {
        build: "tsc",
        "type-check": "tsc --noEmit",
      }),
      ...(options.test && {
        test: "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
      }),
    },
    keywords: ["express", "nodejs", "api"],
    author: "",
    license: "ISC",
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      helmet: "^7.0.0",
      "express-rate-limit": "^6.7.0",
      dotenv: "^16.0.3",
      ...(options.view && options.view === "ejs" && { ejs: "^3.1.9" }),
      ...(options.view && options.view === "pug" && { pug: "^3.0.2" }),
      ...(options.view &&
        options.view === "hbs" && {
          "express-handlebars": "^7.0.7",
        }),
      ...(options.mongodb && {
        mongoose: "^7.3.0",
      }),
      ...(options.postgres && {
        sequelize: "^6.32.0",
        pg: "^8.11.0",
      }),
      ...(options.redis && {
        ioredis: "^5.3.2",
      }),
      ...(options.auth && {
        jsonwebtoken: "^9.0.0",
        bcryptjs: "^2.4.3",
        "express-validator": "^7.0.1",
      }),
      ...(options.swagger && {
        "swagger-jsdoc": "^6.2.8",
        "swagger-ui-express": "^4.6.3",
      }),
      ...(options.css &&
        options.css === "sass" && {
          "node-sass": "^9.0.0",
        }),
      ...(options.css &&
        options.css === "less" && {
          less: "^4.1.3",
        }),
      ...(options.css &&
        options.css === "stylus" && {
          stylus: "^0.60.0",
        }),
      ...(options.elk && {
        winston: "^3.10.0",
        "winston-elasticsearch": "^0.17.4",
      }),
    },
    devDependencies: {
      nodemon: "^2.0.22",
      ...(options.isTypescript && {
        typescript: "^5.1.3",
        tsx: "^3.12.7",
        "@types/node": "^20.3.1",
        "@types/express": "^4.17.17",
        "@types/cors": "^2.8.13",
        "@types/bcryptjs": "^2.4.2",
        "@types/jsonwebtoken": "^9.0.2",
      }),
      ...(options.test && {
        jest: "^29.5.0",
        supertest: "^6.3.3",
        ...(options.isTypescript && {
          "@types/jest": "^29.5.2",
          "@types/supertest": "^2.0.12",
          "ts-jest": "^29.1.0",
        }),
      }),
    },
  };

  await fs.writeFile(
    path.join(options.projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}
