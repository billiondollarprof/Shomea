# CURRENT

**What is actually built. Blunt about what is not.**

This file is deliberately honest. Trust it over anything a screen says.
`NOW.md` is what comes next. `DIRECTION.md` is what it is all for.

Last updated: 2026-09-16.

---

## The short version

**Nothing is built yet.** This is day one.

What exists is the thinking: the research is done, the decisions are made,
and the documents are written. No code, no app, no deployment.

---

## What is genuinely real

- **The repository and its documents.** `README.md`, `DIRECTION.md`,
  `RESEARCH.md`, `CLAUDE.md`, `CURRENT.md`, `NOW.md`, `SESSIONS.md`.
- **The research.** Speech models, Bible licensing, hosting, offline
  storage. All of it in `RESEARCH.md`, with the unconfirmed parts marked
  as unconfirmed in section 7 of that file.
- **The decisions below.** Settled, not up for rediscussion unless
  something changes.

That is all. Everything else on this page is "not yet".

---

## Decisions that are settled

- **One device.** The device that listens is the device that displays. No
  second screen, no pairing, no companion app.
- **Offline after the first run.** A whole service runs with no network.
- **Any preacher.** No voice training, no enrolment.
- **Free, for Anthony's church.** Not commercial. A sellable version for
  other churches would be a different app with a different name, and a
  completely different licensing position.
- **No backend.** No Supabase, no Firebase, no accounts, no sync.
  Everything on the device. See `CLAUDE.md`, Hosting and backend.
- **Cloudflare Pages** for hosting. Netlify's free plan pauses every site
  after roughly 20 deploys a month, which cannot work here.
- **Copyrighted scripture never goes inside the app.** It lives in a
  separate swappable layer. `DIRECTION.md` section 3.
- **Moonshine first, Whisper as a fallback or a cascade.** `RESEARCH.md`
  section 1.
- **The name is Shomea.**

---

## What is not built

Everything. Listed so nobody assumes otherwise:

- No app. No `package.json`, no build, no dependencies installed.
- No Cloudflare Pages project. **No preview URL, which means Anthony
  currently cannot see anything.** This is the first blocker to clear.
- No speech model running anywhere.
- No Bible text downloaded or bundled.
- No reference detection.
- No screen.
- No verse log, no version switching.
- No service worker, nothing cached, nothing offline.

---

## The two unknowns that matter most

**1. The accent.** Nobody knows how well Moonshine or Whisper handle the
accents of this church's preachers. No benchmark answers it. Only a
recording does. **This is why the accuracy spike comes before any design
work.** If the answer is bad, the shape of the project changes.

**2. iPhone storage.** Safari can clear a site's stored data after a
stretch of not being used. **A church app runs once a week, which sits
right on that boundary.** If the model is cleared between Sundays, it
re-downloads every week and the offline promise is broken. Unconfirmed.
`RESEARCH.md` section 7, item 2.

---

## What Anthony has to do, that nobody else can

These are waiting on him. They are not blocked on code.

1. **Record 10 to 15 minutes of real preaching**, on the lapel mic he
   intends to use, with verse references said naturally. This is the input
   for the accuracy spike and the project cannot be measured without it.
2. **Connect Cloudflare Pages** to this repository, so a preview URL
   exists.
3. **Email Thomas Nelson** about NKJV permission for a single church's
   display use.
4. **Email BroadStreet Publishing** about The Passion Translation. Low
   expectations, and nothing should be built around it landing.
5. **Get an API.Bible key** on the free Starter plan, for Good News Bible.

---

## Small things noticed and deliberately left

Nothing yet.
