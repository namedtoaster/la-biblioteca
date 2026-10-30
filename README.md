# La Biblioteca

**Speak Spanish out loud.** One question a day. Answer it by voice. Real learners answer you back.

Built for people who know lots of words but freeze when they have to speak. Low pressure on purpose: you rehearse alone first, nobody hears you until you choose, and nothing is ever live.

## Status

Version 0.1, an early working slice:

- A short welcome, a few quick questions, then an account by email code (no passwords). Your first clip is a simple "hola".
- One question a day, the same for everyone on the same local date. A new day starts at 4am, so late nights still count.
- Record, listen back, try again as many times as you like.
- A private journal of your answers. Every older question stays open.
- Progress: weeks you showed up (never streaks), minutes spoken, and your first clip next to your latest.

Everything in 0.1 stays in your browser. Nothing is uploaded.

Coming next: posting answers so other learners can reply by voice, with every clip checked before anyone hears it.

## Free forever

Answering questions, listening, replying, notifications, your progress and the app will always be free. If paid features ever exist, they will be new things added on top, never something taken away from this list.

## Run it

```
npm install
npm run dev
```

Then open http://localhost:3000. Recording needs a browser with microphone access (Chrome, Safari or Firefox), on `localhost` or HTTPS.

Without any setup the app runs with no accounts and keeps everything in your browser.

Practice groups need a Supabase project: run `supabase/migrations/0001_groups.sql` in its SQL editor. `npm run test:db` runs the database tests on a throwaway local PostgreSQL (version 15 or newer). To try accounts, copy `.env.example` to `.env.local` and fill in your own Supabase project's URL and publishable key; then signing in is required to record.

Before sending changes:

```
npm run check
```

## License

The code is licensed under the [GNU AGPL 3.0](LICENSE). If you run a modified version as a service, you share your changes.

The question text in `lib/questions.ts` is licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), so it can be reused and translated.

Contributors sign a short [Contributor License Agreement](CLA.md): you keep your copyright, and everything you contribute stays available as open source. See [CONTRIBUTING.md](CONTRIBUTING.md) to help.
