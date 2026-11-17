// Generates yomitan-settings.json (Yomitan "Backup > Import Settings" format).
//
//   node yomitan/build-settings.mjs [path-to-installed-yomitan-extension-dir]
//
// If the Yomitan extension folder is given (or found in the default Chrome profile),
// the result is run through Yomitan's own JSON schema so every default is filled in
// exactly like the importer would do.

import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Dictionaries, in priority order (titles must match index.json "title" exactly).
// See dictionaries/README.md for download links.
// ---------------------------------------------------------------------------
const JITENDEX = 'Jitendex.org [2026-10-03]';
const dictionaries = [
    JITENDEX,                     // JA-EN (main)
    'JMnedict [2026-11-15]',      // names
    'KANJIDIC [2026-319]',        // kanji
    'Kanjium Pitch Accents',      // pitch accent
    'JPDBv2㋕',                   // frequency (anime / LN / VN corpus)
    'Jiten',                      // frequency (jiten.moe)
    'BCCWJ',                      // frequency (general written Japanese)
].map((name) => ({
    name,
    alias: name,
    enabled: true,
    allowSecondarySearches: false,
    definitionsCollapsible: 'not-collapsible',
    partsOfSpeechFilter: true,
    useDeinflections: true,
}));

// ---------------------------------------------------------------------------
// Lapis note type field mapping (from https://github.com/donkuri/lapis README)
// ---------------------------------------------------------------------------
const lapisFields = {
    Expression: '{expression}',
    ExpressionFurigana: '{furigana-plain}',
    ExpressionReading: '{reading}',
    ExpressionAudio: '{audio}',
    SelectionText: '{popup-selection-text}',
    MainDefinition: '{glossary-first}', // Jitendex is first, so this is the Jitendex entry
    DefinitionPicture: '',
    Sentence: '{cloze-prefix}<b>{cloze-body}</b>{cloze-suffix}',
    SentenceFurigana: '', // must stay empty (Lapis README)
    SentenceAudio: '',    // filled by asbplayer
    Picture: '',          // filled by asbplayer
    Glossary: '{glossary}',
    Hint: '',
    IsWordAndSentenceCard: '',
    IsClickCard: '',
    IsSentenceCard: '',
    IsAudioCard: '',
    PitchPosition: '{pitch-accent-positions}',
    PitchCategories: '{pitch-accent-categories}',
    Frequency: '{frequencies}',
    FreqSort: '{frequency-harmonic-rank}',
    MiscInfo: '{document-title}', // asbplayer overwrites with "<episode> (<timestamp>)"
};

const profileOptions = {
    general: {
        language: 'ja',
        showGuide: false,
        popupTheme: 'dark',
        popupOuterTheme: 'dark',
        popupWidth: 500,
        popupHeight: 350,
        resultOutputMode: 'group',
        mainDictionary: JITENDEX,
        sortFrequencyDictionary: 'JPDBv2㋕',
        sortFrequencyDictionaryOrder: 'ascending', // rank-based: lower = more common
        frequencyDisplayMode: 'split-tags-grouped',
        showPitchAccentGraph: true,
        showPitchAccentDownstepNotation: true,
        showPitchAccentPositionNotation: true,
        termDisplayMode: 'ruby',
        // Local API used by asbplayer to split subtitles into words for Anki-knowledge colouring.
        // Needs the yomitan-api native host (see README) and the "nativeMessaging" permission,
        // which Chrome only grants when you flip this switch by hand in Yomitan's settings.
        enableYomitanApi: true,
        yomitanApiServer: 'http://127.0.0.1:19633',
    },
    scanning: {
        // Default: hold Shift and hover (works great on asbplayer subtitles)
        enablePopupSearch: true,  // scan inside the popup (useful for monolingual dicts later)
        popupNestingMaxDepth: 3,
        scanResolution: 'character',
    },
    translation: {
        searchResolution: 'letter',
    },
    audio: {
        enabled: true,
        volume: 100,
        autoPlay: false,
        enableDefaultAudioSources: true, // JapanesePod101 / Jisho / etc.
    },
    dictionaries,
    anki: {
        enable: true,
        server: 'http://127.0.0.1:8765',
        tags: ['yomitan'],
        checkForDuplicates: true,
        duplicateScope: 'collection',
        duplicateScopeCheckAllModels: false,
        duplicateBehavior: 'new',
        suspendNewCards: false,
        displayTagsAndFlags: 'non-standard',
        noteGuiMode: 'browse',
        fieldTemplates: null,
        screenshot: {format: 'jpeg', quality: 92},
        cardFormats: [
            {
                name: 'Lapis',
                icon: 'big-circle',
                type: 'term',
                deck: 'Mining',
                model: 'Lapis',
                fields: Object.fromEntries(Object.entries(lapisFields).map(([k, v]) => [k, {value: v, overwriteMode: 'coalesce'}])),
            },
        ],
    },
};

const OPTIONS_VERSION = 77; // Yomitan 26.9.x options schema version

let options = {
    version: OPTIONS_VERSION,
    profileCurrent: 0,
    profiles: [{name: 'Default', conditionGroups: [], options: profileOptions}],
    global: {database: {prefixWildcardsSupported: false}},
};

// Optional: validate & fill defaults with the installed Yomitan's own schema code.
const extDir = process.argv[2] ?? findYomitan();
if (extDir) {
    const {JsonSchema} = await import(pathToFileURL(path.join(extDir, 'js/data/json-schema.js')).href);
    const schema = JSON.parse(fs.readFileSync(path.join(extDir, 'data/schemas/options-schema.json'), 'utf8'));
    const js = new JsonSchema(schema);
    options = js.getValidValueOrDefault(options);
    js.validate(options); // throws if anything is invalid
    console.log('Validated against', extDir);
}

const backup = {version: 0, date: new Date().toISOString(), options};
const out = path.join(here, 'yomitan-settings.json');
fs.writeFileSync(out, JSON.stringify(backup, null, 2) + '\n');
console.log('Wrote', out);

function findYomitan() {
    const base = path.join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/User Data/Default/Extensions/likgccmbimhjbgkjambclfkhldnlhbnn');
    if (!fs.existsSync(base)) { return null; }
    const versions = fs.readdirSync(base).sort();
    return versions.length ? path.join(base, versions[versions.length - 1]) : null;
}
