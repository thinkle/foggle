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

## Rejected words and blocked guesses

Each line of `rejected.txt` is a word, a tab and a reason (`inflected form`,
`proper noun or brand`, `british spelling`, `offensive`, `obscure or niche`...).
Pass `--reason` to `reject`/`remove` to record one.

The standard is looser for guesses than for answers. Words that might make
someone uncomfortable can still be typed; they just never become the answer.
The worst slurs are tagged `blocked: ...` and are also taken out of
`allTheWords.txt`, so they aren't accepted as guesses at all. `add-valid`
refuses them, and a test fails if one comes back.

## Growing the list (with an AI or by hand)

Setup, once:

```bash
python3 -m venv .venv && .venv/bin/pip install -r src/wordlists/tools/requirements.txt
.venv/bin/python -c "import wn; wn.download('oewn:2024')"   # WordNet, only for `spray`
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
profanity, and a word a typical adult would recognise. Irregular plurals
that don't end in s (*geese*, *criteria*, *cherubim*) and plural-only words
(*scissors*, *pajamas*) are welcome, but *knives*/*indices* style plurals aren't.
Mild words like *virgin* or *drunk* are fine; vulgar words and slurs aren't.

### Domain brainstorms

Frequency sweeps miss everyday concrete nouns (*trivet*, *joist*, *downspout*
are rare in text but everyone knows them). So also brainstorm by domain, like
room by room through a house or "pretty common medical words". Put the words
in a file and run:

```bash
$W check domain.txt --new-out new.txt   # splits into new / already answers / rejected / invalid, with Zipf
```

Then `accept` the good ones from `new.txt`. Brainstorms done so far live in
`domains/` (house, cooking, bikes, sports, outdoors, zoo, painting, poetry,
fashion), so it's easy to see what's been covered.

### Category sprays

Somewhere between the two: take a frequency band and group the unreviewed
words by WordNet category, which turns up the "mortise and tenon" words that
are well known but rare in text:

```bash
$W spray --min 2.5 --max 3.5 --category noun.food noun.animal noun.artifact
```

Categories include `noun.artifact`, `noun.food`, `noun.animal`, `noun.plant`,
`noun.body`, `noun.substance` and `noun.object`.

### Finding gaps

The most useful question is "what whole areas are missing?" `gaps` files every
reasonably common noun under its WordNet parent and grandparent concept, then
ranks the concepts by how little of them the answer list covers:

```bash
$W gaps --limit 60                  # e.g. "0% covered, 8 missing  guard: lookout sentinel bouncer sentry..."
$W family "musical instrument"      # every word under one concept: missing / rejected / answers
```

A thin concept is a prompt for a domain brainstorm (that's how `domains/music.txt` happened).

### Compounds

A closed compound counts as a word once the closed spelling wins in print:

```bash
$W compound words.txt   # Google Books Ngram: countertop vs counter top vs counter-top
```

It reports the closed spelling's share for the latest year (60% or more means
it's a word; 40 to 60% is contested). It can't tell a noun from a verb phrase,
so *breakaway* and *dugout* lose to *break away* and *dug out*; use judgment
there. Google rate-limits the endpoint, so the command waits between lookups.

### Before a PR

Before opening a PR, `$W review --out changes.md` lists every added and removed
answer compared with `main`, so you can check what went in.

To prune obscure **upcoming** answers, `$W weak --max 2.3` lists them. That
list is a spoiler, so leave it to the AI. `$W remove FILE` then drops them
(it won't touch played or frozen days) and logs them in `rejected.txt`.
