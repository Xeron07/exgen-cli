import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateReadme(options: ResolvedOptions): Promise<void> {
  const readmeContent = generateReadmeContent(options);

  await fs.writeFile(
    path.join(options.projectPath, "README.md"),
    readmeContent.trim()
  );
}

function generateReadmeContent(options: ResolvedOptions): string {
  const { projectName, isTypescript } = options;

  let content = `# ${projectName}

A modern Express.js application built with ${isTypescript ? "TypeScript" : "JavaScript"}.

## Features

`;

  // Add feature list based on options
  const features: string[] = [];

  if (isTypescript) features.push("✅ TypeScript support");
  if (options.mongodb) features.push("🗄️ MongoDB integration");
  if (options.postgres) features.push("🐘 PostgreSQL support");
  if (options.redis) features.push("🔴 Redis caching");
  if (options.auth) features.push("🔐 JWT Authentication");
  if (options.swagger) features.push("📝 Swagger API documentation");
  if (options.test) features.push("🧪 Testing with Jest");
  if (options.docker) features.push("🐳 Docker support");
  if (options.elk) features.push("📊 ELK Stack logging");
  if (!options.noView)
    features.push(
      `🎨 ${options.view?.toUpperCase() || "Template"} view engine`
    );
  if (options.css)
    features.push(`💅 ${options.css?.toUpperCase() || "CSS"} styling`);

  content += features.map((feature) => `- ${feature}`).join("\n") + "\n\n";

  // Prerequisites
  content += `## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
`;

  if (options.mongodb)
    content += `- MongoDB
`;
  if (options.postgres)
    content += `- PostgreSQL
`;
  if (options.redis)
    content += `- Redis
`;
  if (options.docker)
    content += `- Docker (optional)
`;

  // Installation
  content += `
## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ${projectName}
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit the \`.env\` file with your configuration.

`;

  // Database setup
  if (options.mongodb || options.postgres) {
    content += `## Database Setup

`;

    if (options.mongodb) {
      content += `### MongoDB
1. Make sure MongoDB is running
2. Update the \`MONGODB_URI\` in your \`.env\` file

`;
    }

    if (options.postgres) {
      content += `### PostgreSQL
1. Create a database
2. Update the database configuration in your \`.env\` file
3. Run migrations (if any):
\`\`\`bash
npm run migrate
\`\`\`

`;
    }
  }

  // Usage
  content += `## Usage

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm start
\`\`\`

The application will be available at \`http://localhost:3000\`

`;

  // Testing
  if (options.test) {
    content += `## Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

Run tests with coverage:
\`\`\`bash
npm run test:coverage
\`\`\`

Run tests in watch mode:
\`\`\`bash
npm run test:watch
\`\`\`

`;
  }

  // Docker
  if (options.docker) {
    content += `## Docker

### Development
\`\`\`bash
docker-compose -f docker-compose.dev.yml up
\`\`\`

### Production
\`\`\`bash
docker-compose up -d
\`\`\`

Build the image:
\`\`\`bash
docker build -t ${projectName} .
\`\`\`

`;
  }

  // API Documentation
  if (options.swagger) {
    content += `## API Documentation

When the server is running, you can access the API documentation at:
\`http://localhost:3000/api-docs\`

`;
  }

  // Project Structure
  content += `## Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── api/
│   │   ├── routes/          # Route definitions
│   │   └── middleware/      # Custom middleware
│   ├── config/              # Configuration files
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
`;

  if (!options.noView) {
    content += `├── views/                   # Template files
`;
  }

  if (options.test) {
    content += `├── tests/
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
`;
  }

  content += `├── public/                  # Static files
│   ├── stylesheets/
│   ├── javascripts/
│   └── images/
├── bin/                     # Executable scripts
└── package.json
\`\`\`

`;

  // Environment Variables
  content += `## Environment Variables

Create a \`.env\` file in the root directory with the following variables:

\`\`\`env
NODE_ENV=development
PORT=3000
`;

  if (options.mongodb) {
    content += `
# MongoDB
MONGODB_URI=mongodb://localhost:27017/${projectName}
`;
  }

  if (options.postgres) {
    content += `
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${projectName}
DB_USER=postgres
DB_PASSWORD=password
`;
  }

  if (options.redis) {
    content += `
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
`;
  }

  if (options.auth) {
    content += `
# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
`;
  }

  if (options.swagger) {
    content += `
# API
API_URL=http://localhost:3000
`;
  }

  content += `\`\`\`

`;

  // Available Scripts
  content += `## Available Scripts

- \`npm start\` - Start the production server
- \`npm run dev\` - Start the development server with hot reload
`;

  if (isTypescript) {
    content += `- \`npm run build\` - Build the TypeScript code
- \`npm run type-check\` - Run TypeScript type checking
`;
  }

  if (options.test) {
    content += `- \`npm test\` - Run tests
- \`npm run test:watch\` - Run tests in watch mode
- \`npm run test:coverage\` - Run tests with coverage report
`;
  }

  content += `- \`npm run lint\` - Run ESLint
- \`npm run format\` - Format code with Prettier

`;

  // Contributing
  content += `## Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

`;

  // License
  content += `## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

`;

  // Support
  content += `## Support

If you have any questions or need help getting started, please:

1. Check the [documentation](#api-documentation)
2. Search through [existing issues](../../issues)
3. Create a [new issue](../../issues/new) if needed

---

Built with ❤️ using Express.js${isTypescript ? " and TypeScript" : ""}
`;

  return content;
}
