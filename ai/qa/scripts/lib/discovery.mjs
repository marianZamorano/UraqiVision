// Descubrimiento de stack y artefactos de testing a partir de archivos (solo lectura).
// Devuelve evidencias (rutas) para que la skill distinga lo implementado de lo planificado.
import fs from 'node:fs';
import path from 'node:path';
import { walk, toPosixRelative, isSecretFile } from './paths.mjs';

const MANIFESTS = {
  'package.json': 'node', 'pom.xml': 'java-maven', 'build.gradle': 'java-gradle', 'build.gradle.kts': 'kotlin-gradle',
  'requirements.txt': 'python', 'pyproject.toml': 'python', 'Pipfile': 'python', 'go.mod': 'go', 'Cargo.toml': 'rust',
  'Gemfile': 'ruby', 'composer.json': 'php',
};
const LOCKFILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'poetry.lock', 'Pipfile.lock', 'go.sum', 'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'gradle.lockfile'];

const ARTIFACT_RULES = [
  { kind: 'test-config', re: /(^|\/)(jest|vitest|playwright|cypress|karma|wdio|nightwatch|mocha|ava)\.config\.[cm]?[jt]s$|(^|\/)\.mocharc\.|(^|\/)(pytest\.ini|tox\.ini|conftest\.py|testng\.xml|karate-config\.js|phpunit\.xml(\.dist)?)$/i },
  { kind: 'test-file', re: /\.(test|spec|e2e-spec|cy)\.[cm]?[jt]sx?$|(^|\/)test_[^/]+\.py$|_test\.(py|go)$|(Test|Tests|IT)\.(java|kt|cs)$/ },
  { kind: 'bdd-feature', re: /\.feature$/i },
  { kind: 'api-contract', re: /(^|\/)(openapi|swagger)[^/]*\.(json|ya?ml)$|\.openapi\.(json|ya?ml)$/i },
  { kind: 'postman-collection', re: /\.postman_collection\.json$|(^|\/)collections?\/[^/]+\.json$/i },
  { kind: 'postman-environment', re: /\.postman_environment\.json$/i },
  { kind: 'graphql-schema', re: /\.(graphql|gql)$/i },
  { kind: 'grpc-proto', re: /\.proto$/i },
  { kind: 'performance-script', re: /\.jmx$|(^|\/)(k6|load|perf|performance)[^/]*\/[^/]+\.[jt]s$|(^|\/)artillery[^/]*\.ya?ml$|(^|\/)locustfile\.py$|\.gatling\./i },
  { kind: 'ci-pipeline', re: /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$|(^|\/)\.gitlab-ci\.yml$|(^|\/)Jenkinsfile$|(^|\/)azure-pipelines\.ya?ml$|(^|\/)\.circleci\/config\.yml$|(^|\/)bitbucket-pipelines\.yml$|(^|\/)\.drone\.yml$/i },
  { kind: 'container', re: /(^|\/)(Dockerfile|docker-compose[^/]*\.ya?ml|compose\.ya?ml)$/i },
  { kind: 'db-migration', re: /(^|\/)(migrations?|db\/migrate|flyway|liquibase)\/|(^|\/)schema\.prisma$|\.sql$/i },
  { kind: 'env-template', re: /(^|\/)\.env\.(example|sample|template)$/i },
  { kind: 'coverage-report', re: /(^|\/)coverage-summary\.json$|(^|\/)lcov\.info$|(^|\/)jacoco\.xml$|(^|\/)cobertura[^/]*\.xml$/i },
  { kind: 'test-report', re: /(^|\/)(junit|test-results?|surefire-reports)[^/]*\.xml$|(^|\/)TEST-[^/]+\.xml$/i },
  { kind: 'fixtures-mocks', re: /(^|\/)(fixtures?|__mocks__|mocks?|testdata|test-data|seeds?)\//i },
  { kind: 'agent-config', re: /(^|\/)(\.claude\/settings(\.local)?\.json|\.mcp\.json|opencode\.json|CLAUDE\.md|AGENTS\.md)$/i },
];

// Dependencias npm → categoría tecnológica.
const NPM_SIGNALS = {
  framework: ['@nestjs/core', 'express', 'fastify', 'koa', 'hapi', '@hapi/hapi', 'next', 'nuxt', 'react', 'vue', '@angular/core', 'svelte', '@remix-run/react'],
  database: ['pg', 'mysql2', 'mysql', 'sqlite3', 'better-sqlite3', 'mongodb', 'mongoose', 'typeorm', '@prisma/client', 'prisma', 'sequelize', 'knex', 'drizzle-orm', 'redis', 'ioredis', '@mikro-orm/core'],
  messaging: ['kafkajs', 'amqplib', 'bullmq', 'bull', '@nestjs/microservices', '@nestjs/bull', 'nats', 'mqtt', '@aws-sdk/client-sqs', '@google-cloud/pubsub', 'socket.io', 'ws'],
  api: ['@nestjs/swagger', 'swagger-ui-express', 'graphql', '@apollo/server', '@nestjs/graphql', '@grpc/grpc-js', 'class-validator', 'zod', 'joi'],
  auth: ['passport', '@nestjs/passport', 'jsonwebtoken', '@nestjs/jwt', 'bcrypt', 'argon2', 'next-auth', '@auth/core', 'helmet', '@nestjs/throttler', 'express-rate-limit'],
  testing: ['jest', 'vitest', 'mocha', 'ava', 'supertest', '@playwright/test', 'playwright', 'cypress', 'webdriverio', 'selenium-webdriver', '@testing-library/react', 'nock', 'msw', 'pactum', '@pact-foundation/pact', 'testcontainers', 'k6', 'artillery', 'newman', 'axe-core', '@axe-core/playwright'],
  quality: ['eslint', 'prettier', 'typescript', 'husky', 'lint-staged', 'c8', 'nyc'],
};

function readJsonSafe(file) {
  try {
    const st = fs.statSync(file);
    if (st.size > 2 * 1024 * 1024) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @returns {{root:string, manifests:object[], lockfiles:string[], technologies:object, artifacts:object, scripts:object[], limits:object}}
 */
export function discover(root, { maxFiles = 5000 } = {}) {
  const files = walk(root, { maxFiles });
  const rel = files.map((f) => toPosixRelative(root, f));
  const manifests = [];
  const lockfiles = [];
  const artifacts = {};
  const technologies = {};
  const scripts = [];

  const addTech = (category, name, evidence, status) => {
    technologies[category] ??= [];
    const existing = technologies[category].find((t) => t.name === name);
    if (existing) existing.evidence.push(evidence);
    else technologies[category].push({ name, status, evidence: [evidence] });
  };

  rel.forEach((r, i) => {
    const base = path.posix.basename(r);
    if (MANIFESTS[base]) manifests.push({ path: r, ecosystem: MANIFESTS[base] });
    if (/\.(csproj|fsproj|sln)$/i.test(base)) manifests.push({ path: r, ecosystem: 'dotnet' });
    if (LOCKFILES.includes(base)) lockfiles.push(r);
    if (isSecretFile(r)) return; // nunca se clasifican ni leen archivos de secretos
    for (const rule of ARTIFACT_RULES) {
      if (rule.re.test(r)) {
        artifacts[rule.kind] ??= [];
        if (artifacts[rule.kind].length < 200) artifacts[rule.kind].push(r);
      }
    }
    if (base === 'package.json') {
      const pkg = readJsonSafe(files[i]);
      if (!pkg) return;
      const deps = { ...pkg.dependencies, ...pkg.peerDependencies };
      const dev = pkg.devDependencies ?? {};
      for (const [category, names] of Object.entries(NPM_SIGNALS)) {
        for (const n of names) {
          if (deps[n]) addTech(category, n, `${r} (dependencies: ${deps[n]})`, 'declared-dependency');
          else if (dev[n]) addTech(category, n, `${r} (devDependencies: ${dev[n]})`, 'declared-dev-dependency');
        }
      }
      for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) scripts.push({ manifest: r, name, command: String(cmd) });
    }
  });

  return {
    root: root.replace(/\\/g, '/'),
    manifests,
    lockfiles,
    technologies,
    artifacts,
    scripts,
    limits: { filesScanned: files.length, truncated: files.length >= maxFiles, note: 'Las dependencias declaradas no prueban uso real: confirmar en el código fuente.' },
  };
}
