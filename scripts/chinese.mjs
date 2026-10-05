import { readFileSync } from 'node:fs';

// Build-time conversion keeps the original Traditional copy authoritative.
// OpenCC phrase matches take priority over individual character alternatives.
const root = { next: new Map() };
for (const file of ['TSCharacters.txt', 'TSPhrases.txt']) {
  const dictionary = readFileSync(new URL(`./vendor/opencc/${file}`, import.meta.url), 'utf8');
  for (const line of dictionary.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const [source, alternatives] = line.split('\t');
    if (!source || !alternatives) continue;
    let node = root;
    for (const character of source) {
      if (!node.next.has(character)) node.next.set(character, { next: new Map() });
      node = node.next.get(character);
    }
    node.value = alternatives.split(' ')[0];
  }
}

export function toSimplified(value) {
  const characters = [...String(value ?? '')];
  const output = [];
  for (let index = 0; index < characters.length;) {
    let node = root, end = index + 1, replacement = characters[index];
    for (let cursor = index; cursor < characters.length; cursor++) {
      node = node.next.get(characters[cursor]);
      if (!node) break;
      if (node.value !== undefined) {
        end = cursor + 1;
        replacement = node.value;
      }
    }
    output.push(replacement);
    index = end;
  }
  return output.join('');
}
