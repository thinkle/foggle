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
	return [l.strip() for l in path.read_text().split('\n') if l.strip()]


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
		REJECTED.write_text('\n'.join(w for w in read_words(REJECTED) if w not in clash) + '\n')
	new = append_unique(ANSWERS, words)
	ANSWERS.write_text('\n'.join(sorted(set(read_words(ANSWERS)))) + '\n')
	print(f'Added {len(new)} new answer(s) to {ANSWERS.name} (no words printed, to avoid spoilers).')
	print('Now run: npm run build-wordlist')


def cmd_reject(a):
	answers = set(read_words(ANSWERS))
	words = [w for w in words_from(a.file) if w not in answers]
	new = append_unique(REJECTED, words)
	REJECTED.write_text('\n'.join(sorted(set(read_words(REJECTED)))) + '\n')
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
	append_unique(REJECTED, sorted(words))
	REJECTED.write_text('\n'.join(sorted(set(read_words(REJECTED)))) + '\n')
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
	for name, fn in (('accept', cmd_accept), ('reject', cmd_reject), ('remove', cmd_remove)):
		s = sub.add_parser(name)
		s.add_argument('file', help="file of words (any whitespace), or '-' for stdin")
		s.set_defaults(fn=fn)
	w = sub.add_parser('weak')
	w.add_argument('--max', type=float, default=2.5)
	w.add_argument('--inflected', action='store_true', help='also include inflected-looking forms')
	w.set_defaults(fn=cmd_weak)
	ch = sub.add_parser('check', help='classify a brainstormed word list: new/answer/rejected/invalid')
	ch.add_argument('file', help="file of words, or '-' for stdin")
	ch.add_argument('--new-out', help='write just the new words to this file')
	ch.set_defaults(fn=cmd_check)
	r = sub.add_parser('review', help='markdown list of added/removed answers vs a git ref')
	r.add_argument('--ref', default='main')
	r.add_argument('--out', help='write to this file instead of stdout')
	r.set_defaults(fn=cmd_review)
	a = p.parse_args()
	a.fn(a)


if __name__ == '__main__':
	main()
