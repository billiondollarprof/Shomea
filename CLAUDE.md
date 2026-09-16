# CLAUDE.md

How to work on this project. The product is **Shomea**.

**This repository is the work.** `billiondollarprof/Nwobosi` is a different
product (StellaXafe) and is **reference only**. It was connected once so an
agent could see how Anthony works: the file structure, the documentation,
the tone. Copy the habits. **Never write to it.**

---

## How to talk to Anthony

- Plain, simple, direct English. Straight to the point.
- **No em dashes, ever.** A hyphen only where a word needs one.
- **British English.** Colour, realise, behaviour. Never "whilst".
- **Short sentences. One idea each.** If a sentence has two commas in it,
  it is probably two sentences.
- **No sentence that needs reading twice.** Read it back. If the meaning
  arrives on the second pass and not the first, rewrite it.
- **Say the thing, then explain it.** The answer first, the reasoning after.
- **Plain words over clever ones.** "Stops" not "obviates".
- **Careful with "while", "although", "given that".** They make somebody
  hold half a sentence in their head. Split it.
- **Numbers as numbers.** "0.3 cents", not "a third of a cent".

He said it directly: *"the English language you are using sometimes I don't
used to follow... sometimes your words are not connecting properly."* That
is a failure of the writing, not of the reading. Fix it here.

### The bracket rule is not optional

**Every technical term gets its plain meaning in brackets the first time it
appears in a conversation.** Then carry on normally, and do not
re-explain it later in the same conversation.

> Quantised (shrunk so the model works in whole numbers instead of
> decimals, smaller and faster for a small accuracy cost).

He wants to build the vocabulary, not avoid it. Skipping the bracket takes
something from him.

### Anything he has to do himself is a numbered list

Not a paragraph he has to mine for the actions. One step per line, in
order, with the exact thing to type or tap. **Say where he is** (which
screen, which app) before saying what to do there. If a step is already
done, say so and say how you know.

### Say what is already done before saying what is left

He should never go hunting for something that exists, or redo something
that is finished.

---

## HIS HARDWARE. This shapes every decision.

**Anthony has a phone and an iPad. He does not have a laptop.**

- He cannot run `npm`, a dev server, or a build.
- **He cannot open localhost.** Anything he needs to look at must be on a
  deployed URL.
- So **a preview deployment is not a convenience here, it is the only way
  he can see anything.** Never end a piece of work with "run it locally
  and see".
- He can record audio on his phone, so test material is fine.
- Claude builds. Anthony tests, on a phone, on a real URL.

The church itself has a laptop and a projector. So the app is *deployed* to
a desktop browser even though it is *tested* on a phone.

---

## Taking direction

Anthony is in charge. That is the working rule, not a formality.

- **A specific request gets carried out.** Not argued with, not swapped for
  a better idea, not done at half size. Do it, then say it is done.
- **Opinions are for when they are asked for.** "What do you think", "do
  your thing", "do what works best" are invitations. Anything else is an
  instruction. If something still looks wrong after the work is done, say
  it in one line, after, never instead.
- **One exception, and it is narrow.** A request that would lose data, put
  a false claim somewhere public, or put copyrighted scripture where
  `DIRECTION.md` says it must not go. Say so plainly and wait. Disagreeing
  about taste is not this.

---

## Model choice

Claude cannot switch its own model. Only Anthony can, with `/model`. So
**name the tier in the first line of the reply, before any work**: "Sonnet
is enough for this" or "this one is worth Opus".

**Sonnet 5 is enough for:** building a screen from an agreed spec, adding a
route or a form, doc updates, session logs, commit messages, screenshot
runs and click-through testing, refactors with a clear target.

**Opus 5 earns its cost for:** architecture, the reference-detection gates,
anything where being wrong means rebuilding rather than editing, debugging
something that is not obvious, copy that has to land.

Switching between tasks is free. Do not switch in the middle of one.

---

## Start of every session

1. Read `CURRENT.md`. It is the state of things.
2. Read `NOW.md`. It is what is next, in order.
3. Read `SESSIONS.md` for the log behind it.
4. `DIRECTION.md` and `RESEARCH.md` when the work touches them.

At the end of a session, update `CURRENT.md`, `NOW.md` and `SESSIONS.md`.

---

## When Anthony asks for something new

1. **Repeat the request back in short, simple language.** Wait for him to
   confirm you understood it right.
2. Audit what already exists.
3. Write a short plan.
4. Build it.

---

## The rules this product turns on

These come from `DIRECTION.md`. They are repeated here because they are
easy to break while writing code.

### Never show the wrong verse

**When unsure, show nothing.** Every threshold, every confidence bar, every
gate is set from that direction. Do not lower one to make a demo look
better. A blank screen is invisible. A wrong verse is public.

### Never bundle copyrighted scripture into the app

Public domain versions ship inside the app. **Everything under copyright
lives in a separate layer that can be swapped or emptied without touching
the app.** Read `DIRECTION.md` section 3 for why, before going near it.

### Offline is a requirement, not a feature

**Nothing may need the network during a service.** If a change introduces a
network call on a path that runs while the app is listening, that change is
wrong, however small the call is.

### Plain words on every screen

No model names, no "transcription", no "inference", no megabytes in
anything a user reads. Say **listening**, **ready**, **getting ready**,
**not hearing anything**. A control that needs explaining is a broken
control.

---

## Nothing is finished until it has been used

A change that has not been used is a change that has not been tested.

1. **Use the thing you built, as the person who will use it.** Tap the
   button. Cancel the dialog and confirm it did nothing. Say the wrong
   thing at it and see what happens.
2. **Look at it, do not read the markup.** Screenshot at a phone width and
   a desktop width, in both themes.
3. **Judge it as somebody who was never told how it works.**
4. **Deploy it to a preview URL**, because that is the only place Anthony
   can see it.
5. Only then say it is done, and say what you actually checked.

**A green build is not evidence that a page renders.**

---

## Project structure

Shomea is not one big file. Each major part is its own file:

- The screen the congregation sees: its own file.
- The listening pipeline: its own file.
- The reference detection and its gates: its own file.
- The Bible lookup and the version switching: its own file.
- The settings screen: its own file.

**Every file stands on its own.**

- **A header at the top of every file** saying what it is, why it exists,
  and what it must never do. If a decision in the file would look wrong to
  somebody who was not in the conversation, the reason goes in the header.
  **When the code changes, the header changes with it.**
- **A labelled section for every distinct job**, numbered where order
  matters.
- **Written for the slowest engineer in the room.** No cleverness that has
  to be decoded. If a line needs a paragraph to explain it, either write
  the paragraph or write a simpler line.
- **Read it back cold before calling it done.** Can you tell in ten seconds
  what it does and where to change one thing? If not, it is not finished.

Split for reading, joined into one app for speed.

---

## Branching and deploying

Nothing is live yet. When Cloudflare Pages is connected:

1. Build on a feature branch.
2. Push it. Cloudflare builds a preview URL.
3. Send Anthony the URL. He looks at it on his phone.
4. Merge to `main` only when he says.

`main` is the production branch. Claude does not merge to it without being
asked.

---

## Hosting and backend

- **Cloudflare Pages.** 500 builds a month, unlimited static bandwidth.
  Netlify's free plan caps at roughly 20 deploys and then pauses every site
  on the account, which is unusable for this work.
- **There is no backend and there should not be one.** No Supabase, no
  Firebase, no accounts, no sync. Everything is on the device. Adding a
  server adds a thing that can be down, in a product whose first rule is
  that it works with no network.
- The one server-shaped job, refreshing licensed text, **happens at build
  time** so the API key never reaches a browser. See `RESEARCH.md`
  section 6.
- If a server is ever genuinely needed, Cloudflare Pages Functions are
  already there. No new account, no new vendor.
