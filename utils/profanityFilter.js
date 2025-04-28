// utils/profanityFilter.js
import Filter from 'bad-words';

const filter = new Filter();

// OPTIONAL: customize it if needed
filter.removeWords('hell', 'ass'); // ⬅️ if you want to allow words
filter.addWords('noob', 'scrub');  // ⬅️ add your own custom bad words

export function containsProfanity(text = '') {
  if (!text) return false;
  return filter.isProfane(text);
}

export function cleanProfanity(text = '') {
  if (!text) return text;
  return filter.clean(text); // Replaces bad words with ***
}
