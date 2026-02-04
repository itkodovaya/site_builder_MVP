# Configurator Service

This service handles the anonymous site creation flow, configuration management, and preview generation for the Site Builder MVP.

## Features

- **Anonymous Drafts**: Create temporary site configs without registration.
- **TTL Storage**: Drafts automatically expire after 24 hours (Redis).
- **Preview Generation**: Server-side HTML rendering of site configurations.
- **Migration**: Commit endpoint to migrate drafts to permanent storage upon user registration.
- **Asset Management**: S3-compatible storage for logo uploads.

## Architecture

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Database**: PostgreSQL (Permanent sites), Redis (Temporary drafts)
- **Storage**: MinIO / S3
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for dependencies)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## API Documentation

See [API.md](./API.md) for detailed endpoint documentation.

## Running with Docker

```bash
# Build image
docker build -t configurator-service .

# Run container
docker run -p 3000:3000 --env-file .env configurator-service
```
