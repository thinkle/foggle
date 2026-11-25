# Foggle word lists

**Spoiler warning:** `answerList.txt` is the plaintext answer list. Don't open it
if you want to keep playing. Everything else here is safe to read.

## Files

| File                     | What it is                                                                                                                                                              | Spoilers? |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `allTheWords.txt`        | Every word accepted as a guess.                                                                                                                                         | No        |
| `answerList.txt`         | The pool of possible answers, sorted alphabetically. This is the file you edit.                                                                                         | **Yes**   |
| `answerList.encoded.txt` | The actual schedule: one obfuscated answer per day, starting 2025-01-05 (`magicNumber.ts`). This is what the app ships.                                                 | Obscured  |
| `rejected.txt`           | Words that were reviewed and deliberately left out (or removed). They're never proposed again, so each review session only looks at new words.                          | No        |
| `build-wordlist.ts`      | Rebuilds the schedule from `answerList.txt`. Days up to today plus a 14-day buffer are frozen; everything after that is reshuffled.                                     | —         |
| `tools/wordlist.py`      | Workbench for reviewing and growing the list without reading all of it.                                                                                                 | —         |

## How the schedule stays stable

`npm run build-wordlist` decodes the existing schedule, keeps days `0..today+14`
exactly as they are, and appends a fresh shuffle of every other word in
`answerList.txt`. So past puzzles never change, and future ones stay unknown,
even to you. The buffer means a build deployed a few days late (or played in
a time zone ahead of yours) doesn't change a day someone already played.

Because the future gets reshuffled, puzzle numbers for "unlimited" games past the
frozen window change after a rebuild. Shared links use a hash of the word, so
those still work.

## Growing the list (with an AI or by hand)

Setup, once:

```bash
python3 -m venv .venv && .venv/bin/pip install -r src/wordlists/tools/requirements.txt
```

Then:

```bash
W=".venv/bin/python src/wordlists/tools/wordlist.py"
$W report                                     # spoiler-free health check
$W candidates --min 3.5 --max 4 --limit 400   # unreviewed non-answers, most common first
$W accept picks.txt                           # adds to answerList.txt, prints no words
$W reject rest.txt                            # adds to rejected.txt
npm run build-wordlist && npx vitest run
```

Frequencies are on the [wordfreq](https://github.com/rspeer/wordfreq) Zipf scale:
about 5+ is very common, 4 is an everyday word, 3 is known but uncommon, and below 2 is rare.

`candidates` only lists words that are **not** answers yet, so they aren't
spoilers, and an AI can review them in batches of a few hundred. The
`rejected.txt` ledger keeps the next session from reviewing the same words
again. The usual criteria: base forms rather than plurals or past tenses,
American spelling, no proper nouns, brands, abbreviations, slang or
profanity, and a word a typical adult would recognise.

To prune obscure **upcoming** answers, `$W weak --max 2.3` lists them. That
list is a spoiler, so leave it to the AI. `$W remove FILE` then drops them
(it won't touch played or frozen days) and logs them in `rejected.txt`.
