# Express.js TypeScript Server

A minimal Express.js server built with TypeScript in strict mode, using pnpm as the package manager.

## Features

- TypeScript with strict mode enabled
- Express.js server with basic error handling
- ESLint configuration with TypeScript support
- Prettier for code formatting
- **Security middlewares**: Helmet for security headers
- **CORS support**: Configurable cross-origin resource sharing
- **Body parsing**: JSON and URL-encoded body parsing with size limits
- Health check endpoint
- Basic API endpoints (GET and POST)

## Prerequisites

- Node.js (v18 or higher)
- pnpm

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

- **Start development server with hot reload:**
  ```bash
  pnpm dev
  ```

- **Build the project:**
  ```bash
  pnpm build
  ```

- **Start production server:**
  ```bash
  pnpm start
  ```

## Code Quality

- **Lint code:**
  ```bash
  pnpm lint
  ```

- **Fix linting issues:**
  ```bash
  pnpm lint:fix
  ```

- **Format code:**
  ```bash
  pnpm format
  ```

- **Type checking:**
  ```bash
  pnpm type-check
  ```

## Available Endpoints

- `GET /health` - Health check endpoint
- `GET /api/hello` - Basic API endpoint
- `POST /api/test` - Test endpoint for body parsing

## Middlewares Implemented

### Security
- **Helmet**: Sets various HTTP headers for security (XSS protection, content security policy, etc.)

### CORS
- **CORS**: Configurable cross-origin resource sharing
  - Default origin: `*` (configurable via `CORS_ORIGIN` environment variable)
  - Supported methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
  - Allowed headers: Content-Type, Authorization
  - Credentials: enabled

### Body Parsing
- **JSON parsing**: With 10MB size limit
- **URL-encoded parsing**: Extended mode with 10MB size limit

## Environment Variables

- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - CORS origin (default: *)

## Project Structure

```
├── src/
│   └── index.ts          # Main server file
├── dist/                 # Build output (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration (flat config)
├── .prettierrc           # Prettier configuration
└── README.md             # This file
```

## Scripts

- `dev` - Start development server with hot reload
- `build` - Build TypeScript to JavaScript
- `start` - Start production server
- `lint` - Run ESLint
- `lint:fix` - Fix ESLint issues automatically
- `format` - Format code with Prettier
- `type-check` - Run TypeScript type checking
