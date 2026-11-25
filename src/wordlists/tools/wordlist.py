#!/usr/bin/env python3
"""Foggle word-list workbench.

Designed so that a human can maintain the answer list without spoilers, and an
AI can review it in small batches without reading the whole list.

  python src/wordlists/tools/wordlist.py report
      Spoiler-free health check: integrity, frozen-history check, runway,
      length + frequency distributions. Prints no answer words.

  python src/wordlists/tools/wordlist.py candidates [--min 4] [--max 99] [--limit 300]
      Words that are valid guesses, NOT answers, and NOT already rejected,
      sorted most-common first. These are not spoilers (they aren't answers yet).
      Inflected-looking forms (plurals, -ed, -ing, -ly...) are hidden unless
      --inflected is given.

  python src/wordlists/tools/wordlist.py accept FILE      # append to answerList.txt
  python src/wordlists/tools/wordlist.py reject FILE      # append to rejected.txt

  python src/wordlists/tools/wordlist.py weak [--max 2.5]
      SPOILERS: upcoming answers that look obscure, for AI review.
  python src/wordlists/tools/wordlist.py remove FILE
      Remove words from the upcoming list (refuses to touch already-played days)
      and record them in rejected.txt so they are never proposed again.

After accept/remove, run `npm run build-wordlist` to reshuffle the *future*
portion of the schedule (history up to today is frozen by that script).

Word frequencies come from the `wordfreq` package (zipf scale: 7 = "the",
~4 = common everyday word, ~3 = known but uncommon, <2 = rare).
"""

import argparse
import collections
import datetime
import re
import subprocess
import sys
from pathlib import Path

try:
	from wordfreq import zipf_frequency
except ImportError:  # pragma: no cover
	sys.exit('Needs wordfreq:  pip install -r src/wordlists/tools/requirements.txt')

HERE = Path(__file__).resolve().parent
LISTS = HERE.parent
ANSWERS = LISTS / 'answerList.txt'
ENCODED = LISTS / 'answerList.encoded.txt'
ALL_WORDS = LISTS / 'allTheWords.txt'
REJECTED = LISTS / 'rejected.txt'
MAGIC_DATE = datetime.date(2025, 1, 5)  # keep in sync with magicNumber.ts
FREEZE_BUFFER_DAYS = 14  # keep in sync with build-wordlist.ts

PMIN, PMAX = 32, 126


def z(word: str) -> float:
	return zipf_frequency(word, 'en')


# --- mirrors src/lib/encoder.ts ------------------------------------------------
def decode_clue(cipher: str) -> str:
	base = ord(cipher[-1]) - PMIN + 1
	out = []
	for i, ch in enumerate(cipher[:-1]):
		code = ord(ch) - (base + (17 - (i % 17)))
		if code < PMIN:
			code = PMAX - (PMIN - code - 1)
		out.append(chr(code))
	return re.sub('[A-Z]', '', ''.join(out))


def read_words(path: Path) -> list[str]:
	if not path.exists():
		return []
	# first token only: rejected.txt lines may carry a reason after a tab
	return [l.split()[0] for l in path.read_text().split('\n') if l.strip()]


def read_rejected() -> dict[str, str]:
	"""rejected.txt: one word per line, optionally followed by a tab and a reason."""
	out = {}
	if REJECTED.exists():
		for l in REJECTED.read_text().split('\n'):
			if l.strip():
				word, _, reason = l.strip().partition('\t')
				out[word.strip()] = reason.strip()
	return out


def write_rejected(entries: dict[str, str]) -> None:
	REJECTED.write_text(''.join(f'{w}\t{r}\n' if r else f'{w}\n' for w, r in sorted(entries.items())))


def add_rejected(words, reason: str = '') -> list[str]:
	entries = read_rejected()
	new = [w for w in dict.fromkeys(words) if w not in entries]
	for w in new:
		entries[w] = reason
	write_rejected(entries)
	return new


def schedule(text: str | None = None) -> list[str]:
	text = ENCODED.read_text() if text is None else text
	return [decode_clue(l) for l in text.split('\n') if l]


def day_index(d: datetime.date | None = None) -> int:
	return ((d or datetime.date.today()) - MAGIC_DATE).days


def base_forms(w: str) -> list[str]:
	out = []
	if w.endswith('ies'):
		out.append(w[:-3] + 'y')
	if w.endswith('es'):
		out.append(w[:-2])
	if w.endswith('s') and not w.endswith('ss'):
		out.append(w[:-1])
	if w.endswith('ed'):
		out += [w[:-2], w[:-1], w[:-3]]
	if w.endswith('ing'):
		out += [w[:-3], w[:-3] + 'e', w[:-4]]
	if w.endswith('ly'):
		out += [w[:-2], w[:-3] + 'e', w[:-3] + 'y' if w.endswith('ily') else w[:-2]]
	# (no -er/-est: it hid too many real nouns like shower, speaker, drawer)
	return out


def looks_comparative(w: str, valid: set[str]) -> bool:
	"""higher/highest, bigger/biggest: an -er word only counts if its -est twin exists."""
	if w.endswith('er') and len(w) > 4:
		return w[:-2] + 'est' in valid
	if w.endswith('est') and len(w) > 5:
		return w[:-3] + 'er' in valid
	return False


def looks_inflected(w: str, valid: set[str]) -> bool:
	f = z(w)
	return looks_comparative(w, valid) or any(b in valid and z(b) >= f - 0.3 for b in base_forms(w))


def bucket(f: float) -> str:
	for th, name in ((2, '<2'), (3, '2-3'), (3.5, '3-3.5'), (4, '3.5-4'), (5, '4-5')):
		if f < th:
			return name
	return '5+'


# --- commands -------------------------------------------------------------------
def cmd_report(_):
	enc, raw, valid = schedule(), read_words(ANSWERS), set(read_words(ALL_WORDS))
	t = day_index()
	problems = []
	if len(set(enc)) != len(enc):
		problems.append(f'{len(enc) - len(set(enc))} duplicate(s) in encoded schedule')
	if set(enc) != set(raw):
		problems.append(
			f'answerList.txt and schedule differ: {len(set(raw) - set(enc))} not yet built, '
			f'{len(set(enc) - set(raw))} in schedule but not in answerList.txt '
			'(run npm run build-wordlist)'
		)
	if bad := [w for w in enc if w not in valid]:
		problems.append(f'{len(bad)} answer(s) are not valid guesses')
	if bad := [w for w in enc if not re.fullmatch('[a-z]+', w)]:
		problems.append(f'{len(bad)} answer(s) contain non a-z characters')
	blocked = {w for w, r in read_rejected().items() if r.startswith('blocked')}
	if leaked := blocked & set(read_words(ALL_WORDS)):
		problems.append(f'{len(leaked)} blocked word(s) are back in allTheWords.txt')
	if clash := set(raw) & set(read_words(REJECTED)):
		problems.append(f'{len(clash)} word(s) are in both answerList.txt and rejected.txt')

	print(f'Today is day #{t}. Schedule: {len(enc)} words, {len(enc) - t - 1} days of runway '
	      f'(~{(len(enc) - t - 1) / 365:.1f} years). Rejected ledger: {len(read_words(REJECTED))} words.')

	# frozen-history check against every committed version of the schedule
	log = subprocess.run(['git', '-C', str(LISTS), 'log', '--format=%h %ad', '--date=short', '--',
	                      ENCODED.name], capture_output=True, text=True).stdout.split('\n')
	for line in [l for l in log if l][:20]:
		h, d = line.split()
		old_text = subprocess.run(['git', '-C', str(LISTS), 'show', f'{h}:./{ENCODED.name}'],
		                          capture_output=True, text=True).stdout
		old = schedule(old_text)
		n = min(day_index(datetime.date.fromisoformat(d)), t) + 1
		n = min(n, len(old), len(enc))
		changed = sum(1 for a, b in zip(old[:n], enc[:n]) if a != b)
		if changed:
			problems.append(f'history changed vs {h} ({d}): {changed} of first {n} days differ')
	print('Integrity:', 'OK' if not problems else '')
	for p in problems:
		print('  PROBLEM:', p)

	fut = enc[t + 1:]
	print('Upcoming answers by length:',
	      dict(sorted(collections.Counter(len(w) for w in fut).items())))
	order = ['<2', '2-3', '3-3.5', '3.5-4', '4-5', '5+']
	for name, words in (('played', enc[:t + 1]), ('upcoming', fut)):
		c = collections.Counter(bucket(z(w)) for w in words)
		print(f'Zipf frequency, {name:8}:', ', '.join(f'{k}: {c[k]}' for k in order))
	infl = sum(1 for w in fut if looks_inflected(w, valid))
	print(f'Upcoming answers that look like inflected forms: {infl}')
	answers, rej = set(enc) | set(raw), set(read_words(REJECTED))
	pool = [w for w in valid - answers - rej if len(w) > 1]
	for th in (4.5, 4, 3.5, 3):
		n = sum(1 for w in pool if z(w) >= th and not looks_inflected(w, valid))
		print(f'Unreviewed candidates with zipf >= {th}: {n}')


def cmd_candidates(a):
	valid = set(read_words(ALL_WORDS))
	exclude = set(read_words(ANSWERS)) | set(schedule()) | set(read_words(REJECTED))
	out = []
	for w in valid - exclude:
		if len(w) < a.min_len:
			continue
		f = z(w)
		if a.min <= f < a.max and (a.inflected or not looks_inflected(w, valid)):
			out.append((f, w))
	out.sort(reverse=True)
	print(f'# {len(out)} candidates (showing {min(len(out), a.limit)})', file=sys.stderr)
	print(' '.join(w for _, w in out[:a.limit]))


def words_from(path: str) -> list[str]:
	text = sys.stdin.read() if path == '-' else Path(path).read_text()
	return [w.lower() for w in re.findall(r'[A-Za-z]+', text)]


def append_unique(path: Path, words: list[str]) -> list[str]:
	existing = set(read_words(path))
	new = [w for w in dict.fromkeys(words) if w not in existing]
	if new:
		text = path.read_text() if path.exists() else ''
		if text and not text.endswith('\n'):
			text += '\n'
		path.write_text(text + '\n'.join(new) + '\n')
	return new


def cmd_accept(a):
	valid = set(read_words(ALL_WORDS))
	words = words_from(a.file)
	invalid = [w for w in words if w not in valid]
	if invalid:
		sys.exit(f'Refusing: {len(invalid)} word(s) are not valid guesses: {" ".join(invalid)}')
	rej = set(read_words(REJECTED))
	if clash := [w for w in words if w in rej]:
		print(f'Note: un-rejecting {len(clash)} word(s)')
		write_rejected({w: r for w, r in read_rejected().items() if w not in clash})
	new = append_unique(ANSWERS, words)
	ANSWERS.write_text('\n'.join(sorted(set(read_words(ANSWERS)))) + '\n')
	print(f'Added {len(new)} new answer(s) to {ANSWERS.name} (no words printed, to avoid spoilers).')
	print('Now run: npm run build-wordlist')


def cmd_add_valid(a):
	"""Add words to allTheWords.txt (valid guesses), keeping it sorted."""
	words = set(words_from(a.file))
	blocked = {w for w, r in read_rejected().items() if r.startswith('blocked')}
	if refused := words & blocked:
		print(f'Refusing {len(refused)} blocked word(s).')
	words -= blocked
	valid = set(read_words(ALL_WORDS))
	new = sorted(words - valid)
	ALL_WORDS.write_text('\n'.join(sorted(valid | words)) + '\n')
	print(f'Added {len(new)} valid guess(es): {" ".join(new)}')


def cmd_reject(a):
	answers = set(read_words(ANSWERS))
	words = [w for w in words_from(a.file) if w not in answers]
	new = add_rejected(words, a.reason)
	print(f'Recorded {len(new)} rejected word(s) in {REJECTED.name}.')


def cmd_weak(a):
	t = day_index()
	valid = set(read_words(ALL_WORDS))
	fut = schedule()[t + 1:]
	out = sorted((z(w), w) for w in fut if z(w) < a.max or (a.inflected and looks_inflected(w, valid)))
	print(f'# SPOILERS: {len(out)} upcoming answers', file=sys.stderr)
	print(' '.join(w for _, w in out))


def cmd_remove(a):
	t = day_index()
	played = set(schedule()[:t + 1 + FREEZE_BUFFER_DAYS])
	words = set(words_from(a.file))
	if locked := words & played:
		print(f'Skipping {len(locked)} word(s) that were already played or are in the frozen window.')
	words -= played
	raw = read_words(ANSWERS)
	keep = [w for w in raw if w not in words]
	ANSWERS.write_text('\n'.join(keep) + '\n')
	add_rejected(sorted(words), a.reason or 'removed')
	print(f'Removed {len(raw) - len(keep)} upcoming answer(s); recorded in {REJECTED.name}.')
	print('Now run: npm run build-wordlist')


def cmd_check(a):
	"""Sort a brainstormed list (e.g. one domain) into new / already answers / rejected / invalid."""
	valid = set(read_words(ALL_WORDS))
	answers = set(read_words(ANSWERS))
	rejected = set(read_words(REJECTED))
	groups = collections.defaultdict(list)
	for w in dict.fromkeys(words_from(a.file)):
		key = ('answer' if w in answers else 'rejected' if w in rejected
		       else 'invalid' if w not in valid else 'new')
		groups[key].append(w)
	for key in ('new', 'answer', 'rejected', 'invalid'):
		ws = sorted(groups[key], key=lambda w: -z(w)) if key == 'new' else sorted(groups[key])
		shown = ' '.join(f'{w}({z(w):.1f})' for w in ws) if key == 'new' else ' '.join(ws)
		print(f'{key} [{len(ws)}]: {shown}')
	if a.new_out:
		Path(a.new_out).write_text('\n'.join(groups['new']) + '\n')


def cmd_spray(a):
	"""Unreviewed candidates in a frequency band, grouped by WordNet category (noun.food, ...)."""
	try:
		import wn
		en = wn.Wordnet('oewn:2024')
	except Exception:
		sys.exit("Needs WordNet data:  python -c \"import wn; wn.download('oewn:2024')\"")
	valid = set(read_words(ALL_WORDS))
	exclude = set(read_words(ANSWERS)) | set(schedule()) | set(read_words(REJECTED))
	groups = collections.defaultdict(list)
	for w in valid - exclude:
		if len(w) < a.min_len or not a.min <= z(w) < a.max or looks_inflected(w, valid):
			continue
		ss = en.synsets(w)
		# use the first (most common) sense, and only if w is itself a lemma of it
		if not ss or w not in [l.lower() for l in ss[0].lemmas()]:
			continue
		cat = ss[0].lexfile()
		if not a.category or cat in a.category:
			groups[cat].append(w)
	for cat in sorted(groups, key=lambda c: -len(groups[c])):
		ws = sorted(groups[cat], key=lambda w: -z(w))
		print(f'{cat} [{len(ws)}]: ' + ' '.join(ws[:a.limit]))


def _wordnet():
	try:
		import wn
		return wn.Wordnet('oewn:2024')
	except Exception:
		sys.exit("Needs WordNet data:  python -c \"import wn; wn.download('oewn:2024')\"")


def cmd_gaps(a):
	"""Find thin areas: WordNet groups where few of the known words are answers.

	Each reasonably common noun is filed under its parent and grandparent concept
	(for its most common sense). Groups are ranked by how little of them the
	answer list covers, so whole missing domains (instruments, shops...) float up.
	"""
	en = _wordnet()
	valid = set(read_words(ALL_WORDS))
	answers = set(read_words(ANSWERS))
	rejected = set(read_words(REJECTED))
	members = collections.defaultdict(set)
	for w in valid:
		if len(w) < 3 or z(w) < a.min or looks_inflected(w, valid):
			continue
		ss = en.synsets(w, pos='n')
		if not ss or w not in [l.lower() for l in ss[0].lemmas()]:
			continue
		for path in ss[0].hypernym_paths():  # path[0] is the parent, path[-1] the root
			for i in (0, 1):
				if len(path) - i >= 5:  # skip abstract groups near the root
					members[path[i]].add(w)
	ignore_file = HERE / 'gaps-ignore.txt'
	ignore = {l.strip() for l in ignore_file.read_text().split('\n')
	          if l.strip() and not l.startswith('#')} if ignore_file.exists() else set()
	rows = []
	for syn, ws in members.items():
		if syn.lemmas()[0] in ignore:
			continue
		missing = sorted(ws - answers - rejected, key=lambda w: -z(w))
		if len(ws) >= a.min_size and len(missing) >= 5:
			rows.append((len(ws & answers) / len(ws), -len(missing), syn.lemmas()[0], missing))
	rows.sort()
	for cov, neg, name, missing in rows[:a.limit]:
		print(f'{cov:4.0%} covered, {-neg:3} missing  {name:26} {" ".join(missing[:12])}')


def cmd_family(a):
	"""Every word under a concept, e.g. 'musical instrument', split into have/missing."""
	en = _wordnet()
	valid = set(read_words(ALL_WORDS))
	answers = set(read_words(ANSWERS))
	rejected = set(read_words(REJECTED))
	ss = en.synsets(a.concept, pos='n')
	if not ss:
		sys.exit(f'No WordNet noun for {a.concept!r}')
	words = set()
	for s in ss[:a.senses]:
		for h in [s] + s.closure('hyponym'):
			words |= {l.lower() for l in h.lemmas() if l.lower() in valid}
	words = sorted((w for w in words if z(w) >= a.min), key=lambda w: -z(w))
	for label, group in (('missing', [w for w in words if w not in answers and w not in rejected]),
	                     ('rejected', [w for w in words if w in rejected]),
	                     ('answers', [w for w in words if w in answers])):
		print(f'{label} [{len(group)}]: {" ".join(group)}')


def ngram_series(phrases: list[str], start: int, end: int) -> dict[str, list[float]]:
	"""Google Books Ngram (unofficial JSON endpoint), case-insensitive."""
	import json
	import urllib.parse
	import urllib.error
	import urllib.request
	q = urllib.parse.urlencode({'content': ','.join(phrases), 'year_start': start, 'year_end': end,
	                            'corpus': 'en', 'smoothing': 0, 'case_insensitive': 'true'})
	import time
	for attempt in range(6):
		time.sleep(2)  # be polite: Google rate-limits this endpoint aggressively
		try:
			with urllib.request.urlopen(f'https://books.google.com/ngrams/json?{q}', timeout=60) as r:
				data = json.load(r)
			break
		except urllib.error.HTTPError as e:
			if e.code != 429 or attempt == 5:
				raise
			time.sleep(15 * 2 ** attempt)
	out: dict[str, list[float]] = {}
	for s in data:
		# case-insensitive results come back as "word (All)" aggregates plus per-case rows
		name = s['ngram'].replace(' (All)', '').lower().replace(' - ', '-')
		if s['ngram'].endswith('(All)') or name not in out:
			out[name] = s['timeseries']
	return out


def splits(w: str, valid: set[str]) -> list[tuple[str, str]]:
	return [(w[:i], w[i:]) for i in range(2, len(w) - 1) if w[:i] in valid and w[i:] in valid]


def cmd_compound(a):
	"""Is a closed compound (countertop) more common than its open/hyphenated spellings?"""
	valid = set(read_words(ALL_WORDS))
	words = list(dict.fromkeys(words_from(a.file)))
	print(f'Share of the closed spelling in Google Books, {a.start}-{a.end}:')
	for w in words:
		sp = splits(w, valid)
		if not sp:
			print(f'  {w:16} (no two-word split found)')
			continue
		# pick the split whose open form is most common
		phrases = [w] + [f'{x} {y}' for x, y in sp] + [f'{x}-{y}' for x, y in sp]
		try:
			series = ngram_series(phrases, a.start, a.end)
		except Exception as e:  # network, rate limit...
			print(f'  {w:16} ngram lookup failed: {e}')
			continue
		total = {p: series.get(p, [0])[-1] for p in phrases}
		closed = total[w]
		rivals = sum(v for p, v in total.items() if p != w)
		first = [s for s in (series.get(w),) if s]
		share = closed / (closed + rivals) if closed + rivals else 0
		early = (series.get(w, [0])[0], sum(series.get(p, [0])[0] for p in phrases if p != w))
		early_share = early[0] / sum(early) if sum(early) else 0
		best = max((p for p in phrases if p != w), key=lambda p: total[p])
		verdict = 'word' if share >= 0.6 else 'contested' if share >= 0.4 else 'two words'
		print(f'  {w:16} {share:5.0%} closed in {a.end} ({early_share:4.0%} in {a.start}); '
		      f'main rival "{best}" -> {verdict}')


def cmd_review(a):
	"""Markdown summary of answerList.txt changes vs a git ref (spoils added words)."""
	old_text = subprocess.run(['git', '-C', str(LISTS), 'show', f'{a.ref}:./{ANSWERS.name}'],
	                          capture_output=True, text=True, check=True).stdout
	old = {l.strip() for l in old_text.split('\n') if l.strip()}
	new = set(read_words(ANSWERS))
	added, removed = sorted(new - old), sorted(old - new)

	def section(title, words):
		lines = [f'## {title} ({len(words)})', '']
		by_letter = collections.defaultdict(list)
		for w in words:
			by_letter[w[0]].append(w)
		for letter in sorted(by_letter):
			lines.append(f'**{letter.upper()}** · ' + ', '.join(by_letter[letter]))
			lines.append('')
		return lines

	out = [f'# Word list changes vs `{a.ref}`', '',
	       f'{len(old)} → {len(new)} answers (+{len(added)}, −{len(removed)}).', '']
	out += section('Added', added) + section('Removed', removed)
	text = '\n'.join(out)
	if a.out:
		Path(a.out).write_text(text)
		print(f'Wrote {a.out}')
	else:
		print(text)


def main():
	p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
	sub = p.add_subparsers(dest='cmd', required=True)
	sub.add_parser('report').set_defaults(fn=cmd_report)
	c = sub.add_parser('candidates')
	c.add_argument('--min', type=float, default=4.0)
	c.add_argument('--max', type=float, default=99)
	c.add_argument('--limit', type=int, default=300)
	c.add_argument('--min-len', type=int, default=2)
	c.add_argument('--inflected', action='store_true')
	c.set_defaults(fn=cmd_candidates)
	for name, fn in (('accept', cmd_accept), ('reject', cmd_reject), ('remove', cmd_remove),
	                 ('add-valid', cmd_add_valid)):
		s = sub.add_parser(name)
		s.add_argument('file', help="file of words (any whitespace), or '-' for stdin")
		s.add_argument('--reason', default='', help='reject/remove: why (inflected, proper, british, slang, offensive, obscure...)')
		s.set_defaults(fn=fn)
	w = sub.add_parser('weak')
	w.add_argument('--max', type=float, default=2.5)
	w.add_argument('--inflected', action='store_true', help='also include inflected-looking forms')
	w.set_defaults(fn=cmd_weak)
	ch = sub.add_parser('check', help='classify a brainstormed word list: new/answer/rejected/invalid')
	ch.add_argument('file', help="file of words, or '-' for stdin")
	ch.add_argument('--new-out', help='write just the new words to this file')
	ch.set_defaults(fn=cmd_check)
	sp = sub.add_parser('spray', help='candidates in a frequency band, grouped by WordNet category')
	sp.add_argument('--min', type=float, default=2.5)
	sp.add_argument('--max', type=float, default=3.5)
	sp.add_argument('--min-len', type=int, default=4)
	sp.add_argument('--limit', type=int, default=400, help='max words shown per category')
	sp.add_argument('--category', nargs='*', help='e.g. noun.food noun.animal noun.artifact')
	sp.set_defaults(fn=cmd_spray)
	gp = sub.add_parser('gaps', help='WordNet groups the answer list barely covers')
	gp.add_argument('--min', type=float, default=2.3, help='ignore words rarer than this zipf')
	gp.add_argument('--min-size', type=int, default=6)
	gp.add_argument('--limit', type=int, default=60)
	gp.set_defaults(fn=cmd_gaps)
	fa = sub.add_parser('family', help="all words under a concept, e.g. 'musical instrument'")
	fa.add_argument('concept')
	fa.add_argument('--min', type=float, default=2.0)
	fa.add_argument('--senses', type=int, default=1, help='how many senses of the concept to include')
	fa.set_defaults(fn=cmd_family)
	co = sub.add_parser('compound', help='Google Books Ngram: closed vs open/hyphenated spelling')
	co.add_argument('file', help="file of words, or '-' for stdin")
	co.add_argument('--start', type=int, default=1980)
	co.add_argument('--end', type=int, default=2022)
	co.set_defaults(fn=cmd_compound)
	r = sub.add_parser('review', help='markdown list of added/removed answers vs a git ref')
	r.add_argument('--ref', default='main')
	r.add_argument('--out', help='write to this file instead of stdout')
	r.set_defaults(fn=cmd_review)
	a = p.parse_args()
	a.fn(a)


if __name__ == '__main__':
	main()
