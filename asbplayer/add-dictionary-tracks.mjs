// Adds the "dictionaryTracks" section (word colouring from Anki knowledge) to asbplayer-settings.json.
//   node asbplayer/add-dictionary-tracks.mjs
// Edit DECKS / WORD_FIELDS / SENTENCE_FIELDS below if your Anki decks change.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DECKS = ['Mining', 'Kaishi 1.5k'];
const WORD_FIELDS = ['Expression', 'Word'];   // Lapis / Mining-JP use Expression, Kaishi uses Word
const SENTENCE_FIELDS = ['Sentence'];          // all three note types

// Index = TokenStatus: 0 uncollected, 1 unknown (new card), 2 learning, 3 graduated, 4 young, 5 mature
const STATUS = [
    {display: true, color: '#FF0000', alpha: 'FF'}, // not in Anki at all  -> red
    {display: true, color: '#FFA500', alpha: 'FF'}, // in Anki, never studied -> orange
    {display: true, color: '#3399FF', alpha: 'FF'}, // learning              -> blue
    {display: true, color: '#3399FF', alpha: 'FF'}, // just graduated        -> blue
    {display: true, color: '#3399FF', alpha: 'FF'}, // young (< 21 days)     -> blue
    {display: true, color: '#00FF00', alpha: 'FF'}, // mature (>= 21 days)   -> green
];

const off = () => ({reading: false, frequency: false, gloss: false, pitchAccent: false});
const triggers = () => ({onStatuses: Array.from({length: 6}, () => ({enabled: false})), onStates: [{enabled: false}]});
const feature = () => ({...triggers(), rules: {minWords: 0, maxWords: 0, minFrequency: 0, maxFrequency: 0}});
const annotationTarget = (freqSize) => ({
    color: {onHoverEnabled: false, size: 1},
    reading: {onHoverEnabled: false, size: 0.5},
    frequency: {onHoverEnabled: false, size: freqSize},
    gloss: {onHoverEnabled: true, size: 0.5},
    pitchAccent: {onHoverEnabled: true, size: 0.1},
});

function track(enabled) {
    return {
        dictionaryColorizeSubtitles: enabled,
        dictionaryAutoGenerateStatistics: false,
        dictionaryColorizeOnHoverOnly: false,
        dictionaryHighlightOnHover: true,
        dictionaryTokenMatchStrategy: 'ANY_FORM_COLLECTED',
        dictionaryMatchAcrossScripts: true,
        dictionaryTokenMatchStrategyPriority: 'EXACT',
        dictionaryYomitanUrl: 'http://127.0.0.1:19633',
        dictionaryYomitanParser: 'scanning-parser',
        dictionaryYomitanScanLength: 16,
        dictionaryTokenReadingAnnotation: 'NEVER',
        dictionaryDisplayIgnoredTokenReadings: false,
        dictionaryTokenFrequencyAnnotation: 'NEVER',
        dictionaryAnkiDecks: enabled ? DECKS : [],
        dictionaryAnkiWordFields: enabled ? WORD_FIELDS : [],
        dictionaryAnkiSentenceFields: enabled ? SENTENCE_FIELDS : [],
        dictionaryAnkiSentenceTokenMatchStrategy: 'EXACT_FORM_COLLECTED',
        dictionaryAnkiMatureCutoff: 21,
        dictionaryAnkiTreatSuspended: 'NORMAL',
        dictionaryWaniKaniApiToken: '',
        dictionaryTokenStyling: 'UNDERLINE',
        dictionaryTokenStylingThickness: 3,
        dictionaryColorizeFullyKnownTokens: enabled, // mature words are coloured (green)
        dictionaryTokenStatusColors: STATUS.map((s) => s.color),
        dictionaryTokenStatusConfig: enabled ? STATUS : STATUS.map((s, i) => ({...s, display: i < 5})),
        dictionaryTokenAnnotationConfig: {
            colorizeEnabled: enabled,
            video: annotationTarget(0.3),
            subtitlePlayer: annotationTarget(0.5),
            onStatuses: Array.from({length: 6}, off),
            onStates: [off()],
        },
        dictionaryPlaybackConfig: {
            selectOnPause: triggers(),
            autoPause: feature(),
            condensed: feature(),
            fastForward: {...feature(), rateByComprehension: {enabled: false, minimumPercent: 60}},
            repeat: feature(),
            wordVisibility: {...feature(), hideWordsIndividuallyUntilThreshold: true, wholeSubtitleMatchThreshold: 1},
        },
    };
}

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'asbplayer-settings.json');
const settings = JSON.parse(fs.readFileSync(file, 'utf8'));
settings.dictionaryTracks = [track(true), track(false), track(false)];
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
console.log('Updated', file);
