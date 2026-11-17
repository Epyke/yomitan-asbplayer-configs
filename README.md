# Japanese immersion setup — Chrome + asbplayer + Yomitan + Anki (Lapis)

My backup of a sentence-mining setup built on the most widely used community tools:

| Piece | What | Why |
|---|---|---|
| **Yomitan** 26.9.x | Pop-up dictionary (hold **Shift** + hover) | Standard tool; settings in `yomitan/` |
| **asbplayer** 1.23.x | Subtitles on any video + audio/screenshot capture | Standard tool; settings in `asbplayer/` |
| **Anki** 26.9 + **AnkiConnect** | SRS + the bridge the extensions talk to | `anki/ankiconnect-config.json` |
| **[Lapis](https://github.com/donkuri/lapis)** 1.7.0 | Card template | The most popular modern Japanese mining note (successor of JP Mining Note, recommended by TheMoeWay / Kuri's guide) |
| Dictionaries | Jitendex, JMnedict, KANJIDIC, Kanjium pitch, JPDB v2.2 / Jiten / BCCWJ frequency | Yomitan's own "recommended" Japanese set + a pitch dictionary (needed by Lapis) |

## Mining workflow

1. Open a video (Netflix, YouTube, local file at <https://app.asbplayer.dev>, …) and load Japanese subtitles in asbplayer (drag the `.srt/.ass` onto the video).
2. Hold **Shift** and hover an unknown word in the subtitle → Yomitan popup.
3. Click the **➕ (Lapis)** button in the popup → a card is created in deck **Mining** with word, reading, audio, definition, pitch, frequency and the sentence.
4. Press **Ctrl+Shift+U** (asbplayer "Update last card") → asbplayer adds the **sentence audio**, a **screenshot** and the episode/timestamp to that card.

Other asbplayer shortcuts: `Ctrl+Shift+X` mine via asbplayer dialog · `←/→` previous/next subtitle · `↑` replay current line · `Shift+P` auto-pause at end of each line · `Ctrl+Shift+←/→` sync subtitles · `` ` `` side panel.

## Restore on a new PC

1. **Install** Chrome, then [Yomitan](https://chromewebstore.google.com/detail/yomitan/likgccmbimhjbgkjambclfkhldnlhbnn) and [asbplayer](https://chromewebstore.google.com/detail/asbplayer-language-learnin/hkledmpjpaehamkiehglnbelcpdflcab) from the Chrome Web Store.
2. **Anki**: install Anki → *Tools > Add-ons > Get Add-ons* → code `2055492159` (AnkiConnect) → *Config* → paste `anki/ankiconnect-config.json` → restart Anki.
3. **Card template**: with Anki open, run `node anki/setup-anki.mjs` (creates note type `Lapis` + deck `Mining`). Alternative: *File > Import* `anki/lapis/Lapis-1.7.0.apkg`.
4. **Dictionaries first**: `powershell -ExecutionPolicy Bypass -File dictionaries\download.ps1`, then Yomitan settings → *Dictionaries* → *Configure installed and enabled dictionaries…* → **Import** → select all 7 zips in `dictionaries/` (order by filename).
   (The zips are git-ignored, so they only exist locally after running the script.)
5. **Then Yomitan settings**: Yomitan settings → *Backup* → **Import Settings** → `yomitan/yomitan-settings.json`.
   The file lists the dictionaries by exact title, which sets their priority order. On import, dictionaries that aren't installed are dropped from the list, and installed dictionaries the file doesn't name get added **disabled**. So import the dictionaries first, and re-import the settings whenever you add a dictionary.
   If you get newer dictionary versions, their titles change (e.g. `Jitendex.org [2026-10-03]`): edit the names at the top of `yomitan/build-settings.mjs` and run `node yomitan/build-settings.mjs` to regenerate the settings file.
   **Check it worked:** Anki section shows card format *Lapis* → deck *Mining*, model *Lapis*; popup theme is *Dark*; Jitendex is first in the dictionary list.
6. **asbplayer settings**: click the asbplayer icon → *Settings* → *Misc* → **Import settings** → `asbplayer/asbplayer-settings.json`.
7. Test: Yomitan settings → *Anki* → the status should say *Connected*; hover a word and click ➕.

## Yomitan → Lapis field mapping

| Lapis field | Yomitan marker |
|---|---|
| Expression | `{expression}` |
| ExpressionFurigana | `{furigana-plain}` |
| ExpressionReading | `{reading}` |
| ExpressionAudio | `{audio}` |
| SelectionText | `{popup-selection-text}` |
| MainDefinition | `{glossary-first}` (Jitendex, first priority) |
| Sentence | `{cloze-prefix}<b>{cloze-body}</b>{cloze-suffix}` |
| Glossary | `{glossary}` |
| PitchPosition | `{pitch-accent-positions}` |
| PitchCategories | `{pitch-accent-categories}` |
| Frequency | `{frequencies}` |
| FreqSort | `{frequency-harmonic-rank}` |
| MiscInfo | `{document-title}` (asbplayer overwrites with episode + timestamp) |
| SentenceFurigana, Hint, DefinitionPicture, Is*Card | *(empty)* |
| SentenceAudio, Picture | *(empty — filled by asbplayer)* |

Lapis card types are selected per-note by typing anything (e.g. `x`) into one of the `Is…Card` fields:
- *(all empty)* → vocab card (word on front)
- `IsSentenceCard` → sentence card · `IsWordAndSentenceCard` → word + sentence · `IsClickCard` → hover to reveal sentence · `IsAudioCard` → audio card

## asbplayer → Lapis field mapping

Sentence → `Sentence` · Definition → `MainDefinition` · Word → `Expression` · Audio → `SentenceAudio` · Image → `Picture` · Source → `MiscInfo`. Audio padding 100 ms / 500 ms, MP3, screenshots ≤1280px wide. Subtitles: 40px Noto Sans JP, bold, soft shadow, 40% dark background.

## Optional extras (popular, not installed here)

- **AJT Japanese** (arbyste fork, add-on `200813220`) — auto-generates `SentenceFurigana`; see Lapis' [AJT setup](https://github.com/donkuri/lapis/blob/main/docs/anki_setup.md).
- **Local Audio Server for Yomichan** — offline, higher-quality word audio.
- Monolingual dictionaries from [MarvNC's collection](https://github.com/MarvNC/yomitan-dictionaries) when you're ready.
- Anki: enable **FSRS** in deck options.

## Files

```
anki/ankiconnect-config.json   AnkiConnect config (CORS for Yomitan + asbplayer)
anki/setup-anki.mjs            creates/updates Lapis note type + Mining deck via AnkiConnect
anki/lapis/                    Lapis 1.7.0 templates, CSS, fields, .apkg
yomitan/yomitan-settings.json  Yomitan backup file (import this)
yomitan/build-settings.mjs     source of the Yomitan settings (edit + regenerate)
asbplayer/asbplayer-settings.json  asbplayer settings (import this)
dictionaries/download.ps1      downloads the dictionary zips (zips are git-ignored)
```
