# Foggle word lists

**About spoilers:** reading these files won't spoil the game. `answerList.txt`
is the *pool* of possible answers, sorted alphabetically, and it holds
10,000+ words for roughly 30 years of daily puzzles. Seeing a word there
only tells you it might come up some day. The real spoiler is the
*schedule*, which word falls on which day. That only exists in
`answerList.encoded.txt`, obfuscated and shuffled, and every rebuild
reshuffles the future. So you can review and edit the answer list in the
open and still enjoy playing.

## Files

| File                     | What it is                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `allTheWords.txt`        | Every word accepted as a guess.                                                                                                                |
| `answerList.txt`         | The pool of possible answers, sorted alphabetically. This is the file you edit, and it's safe to read.                                         |
| `answerList.encoded.txt` | The actual schedule: one obfuscated answer per day, starting 2025-01-05 (`magicNumber.ts`). This is what the app ships. Don't decode it.       |
| `rejected.txt`           | Words that were reviewed and deliberately left out (or removed). They're never proposed again, so each review session only looks at new words. |
| `build-wordlist.ts`      | Rebuilds the schedule from `answerList.txt`. Days up to today plus a 14-day buffer are frozen; everything after that is reshuffled.             |
| `tools/wordlist.py`      | Workbench for reviewing and growing the list without reading all of it.                                                                        |

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

There are three tiers, from strictest to loosest:

| Tier | Reason starts with | Answer? | Shown in analysis? | Guessable? | Examples |
| --- | --- | --- | --- | --- | --- |
| Worst slurs | `blocked` | No | No | No | most ethnic slurs |
| Curse words, some slurs | `offensive` | No | No | Yes | *asshole*, *fuck*, *shit* |
| Uncomfortable | `sensitive` | No | Yes | Yes | *penis*, *sphincter*, *noose*, *ass*, *bitch* |

- **Guesses are liberal.** If someone wants to type *asshole*, fine. The
  worst slurs are `blocked`; they're taken out of `allTheWords.txt`,
  `add-valid` refuses them, and a test fails if one comes back.
- **Which slurs are `blocked` and which are `offensive` was decided case by
  case, deliberately.** Don't move a slur between tiers without asking the
  maintainer.
- **The analysis tab hides only words that are just a curse word or a slur**
  (`offensive`, plus `blocked` and the older `fine as a guess, not as an
  answer`). A word with an ordinary meaning is fine to show, so "you were
  down to *penis* and *pens*" is OK, and so is *ass* or *bitch*. *Asshole*
  isn't. The analysis tab uses `displayableWords` in `src/lib/words.ts`.
- **The answer of the day is the strictest.** Anything that would be an
  awkward puzzle answer (anatomy, sex, grim topics) gets `sensitive`: never
  the answer, but still typeable and showable.

## Growing the list (with an AI or by hand)

Setup, once:

```bash
python3 -m venv .venv && .venv/bin/pip install -r src/wordlists/tools/requirements.txt
.venv/bin/python -c "import wn; wn.download('oewn:2024')"   # WordNet, only for `spray`
```

Then:

```bash
W=".venv/bin/python src/wordlists/tools/wordlist.py"
$W report                                     # health check: integrity, runway, distributions
$W candidates --min 3.5 --max 4 --limit 400   # unreviewed non-answers, most common first
$W accept picks.txt                           # adds to answerList.txt
$W reject rest.txt                            # adds to rejected.txt
npm run build-wordlist && npx vitest run
```

Frequencies are on the [wordfreq](https://github.com/rspeer/wordfreq) Zipf scale:
about 5+ is very common, 4 is an everyday word, 3 is known but uncommon, and below 2 is rare.

`candidates` only lists words that are **not** answers yet, so an AI can
review them in batches of a few hundred without wading through the whole pool. The
`rejected.txt` ledger keeps the next session from reviewing the same words
again. The usual criteria: base forms rather than plurals or past tenses,
American spelling, no proper nouns, brands, abbreviations, slang or
profanity, and a word a typical adult would recognise. Irregular plurals
that don't end in s (*geese*, *criteria*, *cherubim*) and plural-only words
(*scissors*, *pajamas*) are welcome, but *knives*/*indices* style plurals aren't.
An -ly adverb isn't an inflection: *obviously* and *really* belong, and the
only question is whether it's common enough (*superbly*, at Zipf 3.0, is about
where they stop sounding natural). Mild words like *virgin* or *drunk* are fine; vulgar words and slurs aren't.

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
fashion, and more), so it's easy to see what's been covered. "Store walks"
work well: picture walking the aisles of a craft store, hardware store,
grocery (including the international aisle), toy store, furniture store, auto
parts store or pet store and name everything you see (`crafts.txt`,
`hardware.txt`, `grocery.txt`, `international.txt`, `toys.txt`,
`furniture.txt`, `cars.txt`, `pets.txt`). A college course catalog
(`courses.txt`) works the same way.

A walk often turns up familiar words that aren't valid guesses yet (*udon*,
*frisbee*, *backsplash*). `check` lists them as invalid. Run compounds
through `compound` first, then `add-valid` the real words and `accept` them.
Brands, fragments (*sippy*, *tikka*) and compounds still written as two
words in print (*lightbulb*, *firepit*) can be valid guesses without being
answers. Log those with `reject --reason "two words in print (valid guess,
not an answer)"` or similar. A mildly uncomfortable word that's fine to show
in the analysis tab (*noose*) gets a reason starting with `sensitive`,
not `offensive`.

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

For the big picture, `categories` lists all 45 WordNet categories (`noun.food`,
`verb.motion`, `adj.all`...) with how many words in each are answers, rejected
or still unreviewed, sorted from least covered to most:

```bash
$W categories            # e.g. "noun.food  346 answers ... 96%"  vs  "adj.all  1253 answers ... 33%"
```

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

To prune obscure **upcoming** answers, `$W weak --max 2.3` lists them.
`$W remove FILE` then drops them
(it won't touch played or frozen days) and logs them in `rejected.txt`.
