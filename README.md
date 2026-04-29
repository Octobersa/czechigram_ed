# Czechigram

Czechigram is a multi-tenant Next.js app used for tester training. Each student gets an isolated MySQL schema (`student_<slug>`), can use their own app instance, and trainers can toggle intentional bugs for exercises.

## Tech stack

- Next.js 15 (App Router)
- Prisma + MySQL
- MinIO (S3-compatible object storage)
- Playwright (E2E/API/helper checks with native test tags)

## Environment

Copy `example.env` to `.env.local` and fill real values:

```bash
cp example.env .env.local
# PowerShell
Copy-Item example.env .env.local
```

Required variables:

- `DATABASE_URL` (without schema suffix, e.g. `mysql://root:root@localhost:3306`)
- `SHADOW_DATABASE_URL` (e.g. `mysql://root:root@localhost:3306/shadow_db`)
- `JWT_SECRET`
- `MINIO_API_URL`
- `MINIO_BUCKET_NAME`
- `MINIO_ACCESS_KEY_ID`
- `MINIO_SECRET_KEY`
- `API_STUDENT_MANAGEMENT_TOKEN`

> Security note: values in examples are placeholders only. You must override secrets/tokens/passwords for any shared, staging, or production environment.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a Docker env file from template and replace `CHANGE_ME` values:

```bash
cp docker/compose.env.example .env.docker
# PowerShell
Copy-Item docker/compose.env.example .env.docker
```

3. Start infrastructure (MySQL + MinIO):

```bash
docker compose --env-file .env.docker up -d mysql minio minio-init
```

4. Run the app:

```bash
npm run dev
```

5. Open:

- App: `http://localhost:3000`
- MinIO console: `http://localhost:9001`

## Automated tests

Run all Playwright tests:

```bash
npm run test:e2e
```

Tag-based runs (Playwright `tag` metadata):

- `npm run test:e2e:smoke` (`@smoke`)
- `npm run test:e2e:api` (`@api`)
- `npm run test:e2e:unit` (`@unit`)
- `npm run test:e2e:lifecycle` (`@lifecycle`)
- `npm run test:e2e:regression` (`@regression`)

Runner variants:

- `npm run test:e2e:headed`
- `npm run test:e2e:ui` (Playwright UI mode)

Test organization:

- UI journeys are implemented with Playwright page objects in `tests/e2e/pages`.
- API and helper-level checks stay request/helper focused in spec files, including lifecycle scenarios (`@lifecycle`) for likes, reports, moderation, bio updates, and owner-only deletion.

## CI on pull requests

GitHub Actions workflow `.github/workflows/pr-tests.yml` runs on every pull request and executes:

1. `npm run lint`
2. `npm run build`
3. `npm run test:e2e`

CI uses a MySQL service container and prepares `shadow_db` before tests.
Workflow tokens/secrets used by tests are generated per run and are not reused outside CI.

## Dockerized app run

This repo now includes Docker assets for full local stack run:

```bash
docker compose --env-file .env.docker up -d --build
```

Services:

- App: `http://localhost:3010`
- MySQL: `localhost:3306`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

Secrets/tokens/passwords come from `.env.docker`.
You must replace all template `CHANGE_ME` values before running the stack.
