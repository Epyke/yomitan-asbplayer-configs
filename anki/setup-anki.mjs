// Creates the "Lapis" note type and the "Mining" deck through AnkiConnect.
// Safe to re-run: if the note type already exists, its templates/CSS are updated in place.
//
//   1. Anki must be running with AnkiConnect installed (add-on code 2055492159)
//   2. node anki/setup-anki.mjs

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'lapis');
const MODEL = 'Lapis';
const DECK = 'Mining';

async function ac(action, params = {}) {
    const res = await fetch('http://127.0.0.1:8765', {method: 'POST', body: JSON.stringify({action, version: 6, params})});
    const {result, error} = await res.json();
    if (error) { throw new Error(`${action}: ${error}`); }
    return result;
}

const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const fields = [...read('anki_fields.yaml').matchAll(/- name: (\S+)/g)].map((m) => m[1]);
const css = read('styling.css');
const template = {Front: read('front.html'), Back: read('back.html')};

await ac('createDeck', {deck: DECK});

if ((await ac('modelNames')).includes(MODEL)) {
    await ac('updateModelTemplates', {model: {name: MODEL, templates: {Mining: template}}});
    await ac('updateModelStyling', {model: {name: MODEL, css}});
    console.log(`Updated existing "${MODEL}" note type templates and styling.`);
} else {
    await ac('createModel', {modelName: MODEL, inOrderFields: fields, isCloze: false, css, cardTemplates: [{Name: 'Mining', ...template}]});
    console.log(`Created "${MODEL}" note type with ${fields.length} fields.`);
}
console.log(`Deck "${DECK}" ready.`);
