import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Filter = require('bad-words');

const filter = new Filter();

// OPTIONAL: customize
filter.removeWords('hell', 'ass'); // optional allow list
filter.addWords('noob', 'scrub');  // optional blocklist

export function containsProfanity(text = '') {
  if (!text) return false;
  return filter.isProfane(text);
}

export function cleanProfanity(text = '') {
  if (!text) return text;
  return filter.clean(text); // Replaces bad words with ***
}
