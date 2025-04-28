import leoProfanity from 'leo-profanity';

// Optionally load multiple languages
leoProfanity.loadDictionary('en'); // English only

export function containsProfanity(text = '') {
  return leoProfanity.check(text);
}

export function cleanProfanity(text = '') {
  return leoProfanity.clean(text);
}
