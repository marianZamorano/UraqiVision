// Inventario de tecnologías y evaluación preliminar de compatibilidad con Vercel.
// Solo lee manifiestos; no ejecuta código del proyecto ni instala dependencias.
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { readJson, readText, rel, walkFiles, finding } from './common.mjs';

const FRAMEWORKS = {
  next: { name: 'Next.js', kind: 'fullstack', vercel: 'native' },
  nuxt: { name: 'Nuxt', kind: 'fullstack', vercel: 'native' },
  '@sveltejs/kit': { name: 'SvelteKit', kind: 'fullstack', vercel: 'native' },
  astro: { name: 'Astro', kind: 'frontend', vercel: 'native' },
  '@remix-run/node': { name: 'Remix', kind: 'fullstack', vercel: 'native' },
  '@react-router/dev': { name: 'React Router', kind: 'fullstack', vercel: 'native' },
  '@tanstack/react-start': { name: 'TanStack Start', kind: 'fullstack', vercel: 'native' },
  vite: { name: 'Vite', kind: 'frontend', vercel: 'native' },
  'react-scripts': { name: 'Create React App', kind: 'frontend', vercel: 'native' },
  '@angular/core': { name: 'Angular', kind: 'frontend', vercel: 'native' },
  vue: { name: 'Vue', kind: 'frontend', vercel: 'native' },
  react: { name: 'React', kind: 'library', vercel: 'needs-bundler' },
  '@nestjs/core': { name: 'NestJS', kind: 'backend', vercel: 'zero-config-entrypoint' },
  express: { name: 'Express', kind: 'backend', vercel: 'zero-config-entrypoint' },
  fastify: { name: 'Fastify', kind: 'backend', vercel: 'zero-config-entrypoint' },
  hono: { name: 'Hono', kind: 'backend', vercel: 'zero-config-entrypoint' },
  koa: { name: 'Koa', kind: 'backend', vercel: 'zero-config-entrypoint' },
  nitropack: { name: 'Nitro', kind: 'backend', vercel: 'native' },
};

const SIGNALS = {
  database: ['pg', 'postgres', 'mysql2', 'mongodb', 'mongoose', '@prisma/client', 'drizzle-orm', 'typeorm', 'sequelize', 'knex', '@neondatabase/serverless', '@supabase/supabase-js', 'better-sqlite3', 'sqlite3', '@libsql/client', '@planetscale/database'],
  cache: ['redis', 'ioredis', '@upstash/redis', '@vercel/kv'],
  queue: ['bull', 'bullmq', 'agenda', 'bee-queue', 'amqplib', 'kafkajs', '@vercel/queue', 'node-cron', 'cron'],
  realtime: ['socket.io', 'ws', '@nestjs/websockets', 'pusher'],
  upload: ['multer', 'formidable', 'busboy', '@vercel/blob', '@aws-sdk/client-s3'],
  auth: ['next-auth', '@auth/core', 'passport', '@clerk/nextjs', 'jsonwebtoken', '@nestjs/jwt', 'better-auth'],
  test: ['jest', 'vitest', 'mocha', '@playwright/test', 'cypress', 'supertest'],
  lint: ['eslint', 'prettier', '@biomejs/biome', 'typescript'],
};

const ENTRYPOINTS = ['src/main', 'src/app', 'src/index', 'src/server', 'app', 'index', 'server'];
const ENTRY_EXT = ['js', 'mjs', 'cjs', 'ts', 'cts', 'mts'];

function packageManager(dir) {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun';
  if (existsSync(join(dir, 'package-lock.json'))) return 'npm';
  return null;
}

function findEntrypoint(dir) {
  for (const base of ENTRYPOINTS) for (const ext of ENTRY_EXT) if (existsSync(join(dir, `${base}.${ext}`))) return `${base}.${ext}`;
  return null;
}

function analyzePackage(root, pkgFile) {
  const dir = dirname(pkgFile);
  const pkg = readJson(pkgFile).value ?? {};
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}), ...(pkg.peerDependencies ?? {}) };
  const names = Object.keys(deps);
  const frameworks = names.filter((n) => FRAMEWORKS[n]).map((n) => ({ id: n, version: deps[n], ...FRAMEWORKS[n] }));
  const signals = Object.fromEntries(Object.entries(SIGNALS).map(([k, list]) => [k, names.filter((n) => list.includes(n))]));
  return {
    path: rel(root, dir),
    name: pkg.name ?? null,
    private: pkg.private ?? false,
    packageManager: packageManager(dir) ?? (pkg.packageManager ? String(pkg.packageManager).split('@')[0] : null),
    lockfile: packageManager(dir) !== null,
    engines: pkg.engines ?? null,
    workspaces: pkg.workspaces ?? null,
    scripts: Object.keys(pkg.scripts ?? {}),
    frameworks,
    signals,
    entrypoint: findEntrypoint(dir),
    hasNodeModules: existsSync(join(dir, 'node_modules')),
  };
}

export function detectStack(root) {
  const files = walkFiles(root);
  const has = (re) => files.some((f) => re.test(rel(root, f)));
  const packages = files.filter((f) => /(?:^|[\\/])package\.json$/.test(f) && rel(root, f).split('/').length <= 4).map((f) => analyzePackage(root, f));
  const python = files.filter((f) => /(?:^|[\\/])(?:requirements\.txt|pyproject\.toml)$/.test(f)).map((f) => {
    const t = (readText(f) ?? '').toLowerCase();
    return { path: rel(root, dirname(f)), frameworks: ['fastapi', 'flask', 'django'].filter((n) => t.includes(n)) };
  });
  return {
    root,
    packages,
    python,
    go: has(/(?:^|\/)go\.mod$/),
    monorepo: packages.some((p) => p.workspaces) || has(/(?:^|\/)(?:turbo\.json|pnpm-workspace\.yaml|nx\.json|lerna\.json)$/),
    docker: has(/(?:^|\/)(?:Dockerfile|Containerfile)(?:\.[\w-]+)?$/),
    compose: has(/(?:^|\/)(?:docker-)?compose(?:\.[\w-]+)?\.ya?ml$/),
    ci: { githubActions: has(/^\.github\/workflows\/.+\.ya?ml$/), gitlab: has(/^\.gitlab-ci\.ya?ml$/) },
    iac: { terraform: has(/\.tf$/), kubernetes: has(/(?:k8s|kubernetes|manifests|helm|charts)\/.+\.ya?ml$/), pulumi: has(/Pulumi\.ya?ml$/) },
    vercel: { json: has(/(?:^|\/)vercel\.json$/), ts: has(/(?:^|\/)vercel\.ts$/), linked: existsSync(join(root, '.vercel', 'project.json')) },
    orm: { prisma: has(/schema\.prisma$/), drizzle: has(/drizzle\.config\.[cm]?[jt]s$/) },
    envExamples: files.map((f) => rel(root, f)).filter((r) => /(?:^|\/)\.env\.(?:example|sample|template)$/.test(r)),
    nodeVersionFile: has(/(?:^|\/)\.(?:nvmrc|node-version)$/),
  };
}

/** Recomendaciones de compatibilidad con Vercel basadas en señales. No sustituye a "vercel build". */
export function vercelCompatibility(stack) {
  const findings = [];
  const components = [];
  for (const p of stack.packages) {
    for (const fw of p.frameworks.filter((f) => f.kind !== 'library')) {
      const c = { package: p.path, framework: fw.name, kind: fw.kind, strategy: null };
      if (fw.vercel === 'native') c.strategy = 'Vercel (detección de framework, zero-config)';
      if (fw.vercel === 'zero-config-entrypoint') {
        c.strategy = 'Vercel Function única (Fluid Compute)';
        if (!p.entrypoint) findings.push(finding('high', 'compat/no-entrypoint', `${fw.name} en "${p.path}" sin entrypoint reconocido (${ENTRYPOINTS.map((e) => e + '.ts').join(', ')}).`, { file: p.path }));
      }
      components.push(c);
    }
    if (p.frameworks.length === 1 && p.frameworks[0].id === 'react') {
      findings.push(finding('high', 'compat/no-bundler', `"${p.path}" usa React sin bundler/framework (Vite, Next...): no hay artefacto desplegable.`, { file: p.path }));
    }
    const s = p.signals;
    if (s.database.some((d) => /sqlite/.test(d))) findings.push(finding('high', 'compat/sqlite', `SQLite en "${p.path}": el sistema de archivos de Functions es efímero. Usa Postgres gestionado (p. ej. Neon Free).`, { file: p.path }));
    if (s.database.length && !s.database.some((d) => /neon|supabase|planetscale|libsql/.test(d))) {
      findings.push(finding('medium', 'compat/db-pooling', `"${p.path}" usa ${s.database.join(', ')}: en Functions usa la URL con pooler y reutiliza el pool entre invocaciones (attachDatabasePool de @vercel/functions).`, { file: p.path }));
    }
    if (s.queue.some((q) => /bull|agenda|bee-queue|amqplib|kafkajs/.test(q))) findings.push(finding('high', 'compat/worker', `"${p.path}" usa workers persistentes (${s.queue.join(', ')}): requieren un proceso continuo. Alternativas: Vercel Queues/Workflow o un worker externo.`, { file: p.path }));
    if (s.queue.some((q) => /^(?:node-)?cron$/.test(q))) findings.push(finding('medium', 'compat/in-process-cron', `"${p.path}" programa tareas en proceso: usa Vercel Cron Jobs (en Hobby: 1/día, ±59 min).`, { file: p.path }));
    if (s.upload.some((u) => /multer|formidable|busboy/.test(u))) findings.push(finding('medium', 'compat/uploads', `"${p.path}" procesa uploads: el body está limitado a 4,5 MB y el disco es efímero. Usa subida directa a Blob/S3.`, { file: p.path }));
    if (s.realtime.length) findings.push(finding('info', 'compat/websockets', `"${p.path}" usa ${s.realtime.join(', ')}: Vercel Functions soportan WebSockets con Fluid Compute; valida duración máxima (300 s en Hobby).`, { file: p.path }));
    if (!p.lockfile) findings.push(finding('medium', 'repro/no-lockfile', `"${p.path}" sin lockfile: build no reproducible.`, { file: p.path }));
    if (!p.engines?.node && !stack.nodeVersionFile) findings.push(finding('low', 'repro/node-version', `"${p.path}" no fija la versión de Node (engines.node o .nvmrc).`, { file: p.path }));
  }
  if (!components.length) findings.push(finding('high', 'compat/nothing-deployable', 'No se detectó ningún framework desplegable.'));
  if (stack.monorepo) findings.push(finding('info', 'compat/monorepo', 'Monorepo: configura Root Directory por proyecto en Vercel o usa Vercel Services.'));
  return { components, findings };
}
