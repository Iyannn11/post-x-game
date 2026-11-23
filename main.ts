// Post-X entry: "the agent builds a game from one prompt" (Node 22, stdlib only).
// The entry is the X post itself. This program hands in the two files the gate
// needs: the posted video (video.mp4) and POST.json naming the post. Both are
// copied to the output directory and verified byte-identical — if either file
// is missing from /output the judge gate fails (a post with no file scores 0),
// so this program fails loudly instead of silently handing in half an entry.
//
// Grader layout: the repo is mounted READ-ONLY at MAKEFUN_BOT_DIR and the
// grader gives a separate writable MAKEFUN_OUTPUT_DIR. Sources are read from
// MAKEFUN_BOT_DIR (falling back to this file's own directory) and the output
// goes to MAKEFUN_OUTPUT_DIR (falling back to <botDir>/output) — NEVER write
// under MAKEFUN_BOT_DIR/output.
//
// POST.json may hold the placeholder {"url": ""} at build time: the program
// only checks that it parses and carries a "url" string. The URL itself is
// checked at submit time, once the video is posted and the real address is in.
//
// Local test:
//   rm -rf /tmp/postx-out && MAKEFUN_BOT_DIR=$PWD MAKEFUN_OUTPUT_DIR=/tmp/postx-out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const botDir = process.env.MAKEFUN_BOT_DIR ?? here;
const out = process.env.MAKEFUN_OUTPUT_DIR ?? join(botDir, 'output');

const FILES = ['video.mp4', 'POST.json'];

for (const name of FILES) {
  const src = join(botDir, name);
  if (!existsSync(src)) throw new Error(name + ' not found under bot dir: ' + src);
  if (statSync(src).size === 0) throw new Error(name + ' is empty: ' + src);
}

// The video must be a real MP4, not just a non-empty file: a corrupt or
// misnamed file would still copy byte-identically, so check its magic.
const videoHead = readFileSync(join(botDir, 'video.mp4')).subarray(0, 12);
if (videoHead.length < 12 || videoHead.subarray(4, 8).toString('latin1') !== 'ftyp') {
  throw new Error('video.mp4 does not start with an MP4 ftyp box');
}

mkdirSync(out, { recursive: true });
for (const name of FILES) {
  const src = join(botDir, name);
  const dst = join(out, name);
  copyFileSync(src, dst);
  // Byte-identical verification: same size and same bytes.
  const a = readFileSync(src);
  const b = readFileSync(dst);
  if (a.length !== b.length || !Buffer.from(a).equals(b)) {
    throw new Error(name + ' copy differs from source: ' + dst);
  }
  console.error(`copied ${name}: ${a.length} bytes, verified identical`);
}

// POST.json must parse and carry a "url" string. An empty url is the build-time
// placeholder (the real address goes in before submit); a non-empty one must
// name an X post, or the gate will refuse the entry.
const post = JSON.parse(readFileSync(join(botDir, 'POST.json'), 'utf8'));
if (typeof post !== 'object' || post === null || typeof post.url !== 'string') {
  throw new Error('POST.json must be an object with a "url" string');
}
if (post.url === '') {
  console.error('note: POST.json still holds the placeholder url; fill in the real post address before submit');
} else if (!/^https:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+$/.test(post.url)) {
  throw new Error('POST.json url does not look like an X post address: ' + post.url);
}
