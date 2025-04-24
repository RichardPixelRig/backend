// pc-builder-backend/utils/profanityFilter.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Required for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profanityDir = path.join(__dirname, '../profanity');

const badWords = new Set();

fs.readdirSync(profanityDir).forEach((file) => {
  const fullPath = path.join(profanityDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const words = content.split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean);
  words.forEach((word) => badWords.add(word));
});

export function containsProfanity(text = '') {
  const clean = text.toLowerCase().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, '');
  return clean.split(/\s+/).some((word) => badWords.has(word));
}
