# Foggle

A Wordle-inspired word-game, by Tom Hinkle. I wrote this because:

(A) I was curious if you could play wordle without knowing how many letters you were guessing.
(B) I wanted a simple fresh project to use to learn the new version of Svelte (Svelte 5).

This project is currently live at:
[https://www.fogglegame.com](https://www.fogglegame.com)

As I built the game, I realized the question of what is "right" is made
trickier when you don't know how many letters you're guessing. For me, it's important to know if you got the _first_ letter, sure, but _also_ it matters if you have the _last_ letter pinned down.

And then of course you'd like to know how long the word is!

So I ended up coding this to give you feedback both from the left (i.e. first letter, second letter, ...), and from the right (i.e. last letter, penultimate letter, ...). That design choice made the game pretty hard to grok, so then I had to do some design work to make it easier to understand how to play and how to use the clues. After tweaking the interface, I've discovered I can pretty much always get the word in 6 guesses or fewer, so the old familiar 6-guess framework applies!

The design inspiration came from [David Jonathan Ross's](https://www.djr.com) font "Indoor Kid" which I got as part of his "Font-of-the-Month" club. It was fun creating a brand new look for a wordgame! It turns out that his font was also designed with variable width, which was very helpful when creating a game where inputs could be any number of letters long.

---

Svelte boilerplate below

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
