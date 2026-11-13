#!/usr/bin/env node
// Hook de git prepare-commit-msg: en ramas tipo/N-descripcion (feat/12-deslizador), agrega "Refs #N" al
// mensaje si todavía no cita ningún issue. Así cada commit queda enlazado a su issue sin escribirlo a mano.
// Argumentos de git: <archivo del mensaje> [origen] [sha]. No actúa en merges ni squash.
import fs from 'node:fs';
import { currentBranch, issueFromBranch, ISSUE_REF, EXEMPT_MESSAGE } from './lib/git.mjs';

const [file, source] = process.argv.slice(2);
if (!file || source === 'merge' || source === 'squash') process.exit(0);

const issue = issueFromBranch(currentBranch());
if (!issue) process.exit(0);

const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);
const firstComment = lines.findIndex((l) => l === '#' || l.startsWith('# '));
const body = (firstComment < 0 ? lines : lines.slice(0, firstComment)).join('\n').trim();
if (!body || EXEMPT_MESSAGE.test(body) || ISSUE_REF.test(body)) process.exit(0);

const rest = firstComment < 0 ? '' : `\n${lines.slice(firstComment).join('\n')}`;
fs.writeFileSync(file, `${body}\n\nRefs #${issue}\n${rest}`);
