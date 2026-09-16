# CURRENT

**What is actually built. Blunt about what is not.**

This file is deliberately honest. Trust it over anything a screen says.
`NOW.md` is what comes next. `DIRECTION.md` is what it is all for.

Last updated: 2026-09-16.

---

## The short version

**It is live at https://shomea.pages.dev and it has heard a real voice.**

Two addresses. **`/` is the verse display and it is all the church ever
sees.** **`/dev` is the listening test and the device check, and nothing
links to it.**

Moonshine heard "Exodus chapter 6 verse 1" perfectly. It heard a bare
"verse number one" as "Best number line". That gap is the work, and the way
through it is written up in `NOW.md` step 1.

---

## What is genuinely real

- **The repository and its documents.** `README.md`, `DIRECTION.md`,
  `RESEARCH.md`, `CLAUDE.md`, `CURRENT.md`, `NOW.md`, `SESSIONS.md`.
- **The research.** Speech models, Bible licensing, hosting, offline
  storage. All of it in `RESEARCH.md`, with the unconfirmed parts marked
  as unconfirmed in section 7 of that file.
- **The decisions below.** Settled, not up for rediscussion unless
  something changes.
- **It is deployed.** https://shomea.pages.dev, from `main`, on Cloudflare
  Pages. Build command `npm run build`, output folder `dist`.
  **The whole deployment is 680 KB.** The model and the engine under it are
  fetched from a CDN the first time and then kept by the browser.
- **The listening pipeline, end to end.** Microphone, five second pieces
  with a one second overlap, silence skipped, a speech model in a worker so
  the screen never freezes, and the words back on the page.
  `src/listening/`.
- **Five models to choose between**, Moonshine Base and Tiny, Whisper Base,
  Small and Tiny. Switching stops the listening first, so one log can never
  mix two models. `src/listening/models.js`.
  **This chooser is temporary.** It is on `/dev` because Anthony needs to
  compare. The finished app chooses by itself. `NOW.md` step 2.
- **The look.** Sora and DM Sans, carried over from Anthony's other work.
  A wine accent used sparingly. **Light and dark, switched in the menu**,
  with every colour a token declared twice in `styles.css`.
- **The display is a slide, not a page.** Landscape first, built for a
  projector. Reference, a rule, then the verse filling the middle.
- **The log, and three ways to get it off the phone.** Every piece of audio
  makes one line: the time, what it heard, how long it took, how loud it
  was. **Send the log** opens WhatsApp or email straight from the phone.
  There is also save as a file and copy the lot. No audio is kept and
  nothing is uploaded on its own. `src/shared/sessionLog.js`.
- **The verse display.** Full screen, never scrolls, and the verse is sized
  by measuring the real box rather than counting characters. Eight dark
  colours plus a colour picker, and the words retint themselves to match.
  `src/screens/Display.jsx` and `src/shared/displayTheme.js`.
- **A hamburger in the corner and no navigation bar**, because a projector
  must never show a menu across the top of a verse.
- **`src/DeviceCheck.jsx`, the device check screen.** It reads whether the
  device has a usable graphics chip, whether it can hold the app offline,
  whether it can keep the screen awake, and how much room the app is
  allowed. It opens the microphone and shows a live level bar, so a lapel
  mic can be tested in the real room. It records nothing.
- **Looked at, not just built.** Every screen screenshotted at phone and
  projector widths. The menu opened, a colour changed, the display measured
  to confirm it never scrolls at 320px, 390px or 1280px. Checked for content
  clipped past the right edge on all three screens at five phone widths:
  clean everywhere. No page errors.

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

- **Nothing has been transcribed at a real service.** It has heard Anthony
  in a room. A forty minute sermon in a hall is a different thing.
- **Whisper has never actually run.** It failed every time in the first test
  because of a bug in our own code, now fixed. Nobody yet knows whether it
  is any good here.
- **Nothing matches a book name yet.** It hears words. It does not know that
  "Like toast one one" is Titus 1:1.
- **Nothing switches model by itself.** Anthony picks one on `/dev`.
- **No Bible text.** The display shows an example verse.
- **No verse log, no version switching.** The "give me another version"
  behaviour is designed and not built.
- **No way to read a log remotely.** Sending it from the phone works.
  Anthony reading it from anywhere, without somebody at the church tapping
  send, does not exist yet.
- **No service worker.** So "offline" today means offline after a recent
  visit, not offline for ever. The model is kept by the browser's own cache
  and nothing guarantees it survives a week.
- **No graphics chip.** The runtime build WebGPU needs is 27 MB and
  Cloudflare Pages refuses anything over 25 MiB. It runs on the plain route.
  Fixing it means R2.

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

1. **Retry Whisper Base on /dev.** It has never run. The bug that killed it
   is fixed. Say three or four references at it and send the log.
2. **Take it to a service.** Warm the model up at home on wifi first. Then
   tap Start listening and leave the phone alone. **Send the log**
   afterwards.
3. **Get the Good News and Passion Translation text** if a free copy can be
   found. See the note in `DIRECTION.md` section 3 about where it goes.
3. **Email Thomas Nelson** about NKJV permission for a single church's
   display use.
4. **Email BroadStreet Publishing** about The Passion Translation. Low
   expectations, and nothing should be built around it landing.
5. **Get an API.Bible key** on the free Starter plan, for Good News Bible.

---

## Small things noticed and deliberately left

Nothing yet.
