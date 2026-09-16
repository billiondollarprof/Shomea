# CURRENT

**What is actually built. Blunt about what is not.**

This file is deliberately honest. Trust it over anything a screen says.
`NOW.md` is what comes next. `DIRECTION.md` is what it is all for.

Last updated: 2026-09-16.

---

## The short version

**The documents and one page exist. Nothing else does.**

The research is done, the decisions are made, and there is a working app
with a single screen: the device check. It is not part of the product. It
is the measuring tape, built so Anthony can find out what his own phone and
iPad can actually do by opening one link.

---

## What is genuinely real

- **The repository and its documents.** `README.md`, `DIRECTION.md`,
  `RESEARCH.md`, `CLAUDE.md`, `CURRENT.md`, `NOW.md`, `SESSIONS.md`.
- **The research.** Speech models, Bible licensing, hosting, offline
  storage. All of it in `RESEARCH.md`, with the unconfirmed parts marked
  as unconfirmed in section 7 of that file.
- **The decisions below.** Settled, not up for rediscussion unless
  something changes.
- **The app builds.** Vite and React. `npm run build` produces `dist` in
  under a second. Cloudflare Pages needs no configuration beyond the build
  command and the output folder.
- **`src/DeviceCheck.jsx`, the device check screen.** It reads whether the
  device has a usable graphics chip, whether it can hold the app offline,
  whether it can keep the screen awake, and how much room the app is
  allowed. It opens the microphone and shows a live level bar, so a lapel
  mic can be tested in the real room. It records nothing.
- **Looked at, not just built.** Screenshotted at 320px, 390px and 1280px.
  The microphone button was clicked and the state change confirmed.
  Checked for content clipped past the right edge at five phone widths:
  clean at all of them.

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

- No Cloudflare Pages project. **No preview URL, which means Anthony still
  cannot see the device check on his own phone.** This is the one blocker
  left, and it is the only thing that needs him.
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

1. **Connect Cloudflare Pages** to this repository. Build command
   `npm run build`, output folder `dist`. Nothing else. This is the first
   one, because until it is done he cannot see anything that gets built.
2. **Record 10 to 15 minutes of real preaching**, on the lapel mic he
   intends to use, with verse references said naturally. This is the input
   for the accuracy spike and the project cannot be measured without it.
3. **Email Thomas Nelson** about NKJV permission for a single church's
   display use.
4. **Email BroadStreet Publishing** about The Passion Translation. Low
   expectations, and nothing should be built around it landing.
5. **Get an API.Bible key** on the free Starter plan, for Good News Bible.

---

## Small things noticed and deliberately left

Nothing yet.
