# 🚀 EXGEN CLI - Express API Generator

EXGEN is a powerful, modern, and extensible CLI tool to generate clean, production-ready Express.js applications. It extends the official `express-generator` with advanced options like TypeScript, MongoDB, PostgreSQL, Docker, Swagger, ELK logging, and more.

---

## ✨ Features

- ✅ Clean Express.js project structure
- 🧠 Interactive mode (like `yarn init`)
- 🛠️ TypeScript, Jest, MongoDB, PostgreSQL support
- 🔧 Flags inspired by `express-generator` (view, git, css, no-view)
- 🐳 Docker support
- 📘 Swagger OpenAPI integration
- 📊 ELK-ready logging folders
- 💼 Production-grade project bootstrapping
- 🧩 Can upgrade existing projects (via `--docker`, `--swagger`)

---

## 📦 Installation

```bash
# Local install and dev
npm install

# Link globally to use anywhere
npm link
```

---

## 🚀 Usage

```bash
# Basic
exgen my-app

# Interactive mode (no args)
exgen

# With flags
exgen my-api --ts --test --mongo --pg --view=ejs --git --css=css

# Production-ready
exgen my-prod-api --prod

# Lightweight
exgen my-light-api --light

# Minimal production (no Docker/Swagger)
exgen my-min-api --min

# Enhance existing project with Docker or Swagger
cd my-app
exgen --docker
exgen --swagger
```

---

## 🔧 Flags

| Flag         | Description                                           |
|--------------|-------------------------------------------------------|
| `--ts`       | Enable TypeScript                                     |
| `--test`     | Include Jest + Supertest                              |
| `--mongo`    | Add MongoDB (Mongoose)                                |
| `--pg`       | Add PostgreSQL (Sequelize)                            |
| `--elk`      | Add ELK logging folder                                |
| `--git`      | Create `.gitignore`                                   |
| `--view`     | View engine (`ejs`, `pug`, `none`)                    |
| `--css`      | CSS engine (`css`, `scss`, `less`)                    |
| `--docker`   | Add Docker support                                    |
| `--swagger`  | Add Swagger + OpenAPI spec                            |
| `--light`    | All minimal useful defaults (TS, Git, Tests, Views)   |
| `--prod`     | Full production setup (TS, Git, ELK, Docker, Swagger) |
| `--min`      | Like `--prod` but without Docker and Swagger          |

---

## 🧪 Testing

```bash
npm test
```

Test files are located in `/tests`.

---

## 📘 Interactive Prompts

If you run `exgen` with no flags, it will ask for:
- Project name
- Description
- Author
- Version
- Feature toggles (TS, Mongo, PG, Docker, etc.)

---

## 🐳 Docker Support

`--docker` adds:
- `Dockerfile`
- `.dockerignore`
- Optional `docker-compose.yml`

---

## 📘 Swagger Support

`--swagger` adds:
- `swagger.json`
- `swagger-ui-express` integration route

---

## 📂 Example Folder Structure

```
my-app/
├── app.js / app.ts
├── bin/www
├── routes/
├── views/
├── public/
├── swagger.json
├── Dockerfile
├── .gitignore
├── package.json
└── ...
```

---

## 📤 Publish to NPM

1. Update `package.json`:
```json
"bin": {
  "exgen": "./bin/exgen.js"
}
```

2. Make CLI executable:
```bash
chmod +x bin/exgen.js
```

3. Login and publish:
```bash
npm login
npm publish
```

---

## 🧬 GitHub Actions CI (Optional)

Use `.github/workflows/ci.yml` to:
- Run tests
- Publish to NPM on tag push
- Enforce quality

---

## 👨‍💻 Contributing

PRs, issues, and suggestions are welcome!

---

## 🪪 License

MIT © [Xeron07](mailto:ni.xeron07@gmail.com)