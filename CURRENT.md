# CURRENT

**What is actually built. Blunt about what is not.**

---

## ANTHONY'S OPEN REQUESTS

Read this first, before anything else in this file. A request he makes
that is not built in the same turn goes here immediately, in his own
words, with the date. It comes off only when it is built and checked.

### Open

- **2026-10-28. Cloudflare for everything, drop Supabase.** "Use
  Cloudflare for the both the storage and database, anything, since we
  want to make it to be offline, I don't know if there's any need adding
  Supabase, since Cloudflare can do the job." Agreed and settled. See
  Decided below.
- **2026-10-28. Python in CI and CD, for testing and quality.** "Check
  where you can use Python code and CI and CD for testing to ensure
  everything is professional, the code is professional, clean, clear, you
  know, the UI, everything."
  **Two thirds done.** `check_house_rules.py` runs on every push and the
  build is size checked against Cloudflare's cap. The conversion workflow
  is Python too. What is missing is a test that scores how well a
  transcript finds verse references, and that needs the book matcher
  first.
- **2026-10-28. Use a model trained on Nigerian speech. BUILT, MEASURED,
  AND REJECTED.** It works and it takes **47 seconds per 5 seconds of
  speech**, against Moonshine's 2 seconds, and it heard nonsense where
  Moonshine heard "Hebrews chapter one, verse two" exactly right.
  **Moonshine Base is the model.** `RESEARCH.md`, The verdict.
- **2026-10-29. How the pastor actually speaks.** Recorded in
  `COMMANDS.md`, his words kept exactly, and **every open question in it is
  now answered by him.** The big one: **"media" is the trigger.** The
  pastor already calls the media team by name out loud, and that word is
  what makes a vague instruction safe to act on.
  **Not built. This is the next thing.**
- **2026-10-29. Remove the Nigerian model from storage.** "we'll remove it
  so that space is not occupied." Gone from the chooser. The workflow to
  clear it out of storage is written and needs running once.
- **2026-10-29. Get the Bible versions by downloading them.** No API.
  `DIRECTION.md` section 3. Not started.
- **2026-10-29. Fewer models in the chooser.** "there's a lot of models
  there. You should retire some of them." **Done**, six down to three:
  Moonshine Base, Nigerian Whisper, Whisper Base.
- **2026-09-16. Match the book names by sound. BUILT AND PASSING.**
  `src/scripture/`. 25 tests, every one from a real transcript or from
  Anthony's own notes, and it runs in CI on every push. It now finds
  Titus in "Diters", Proverbs in "Provide", Ephesians in "a fee shins",
  and Malachi in "an Anakai", **and still finds nothing in "That's number
  one" or "she is 2 cool".**
  **Not yet wired to the listening screen.** That is next.
- **2026-10-30. What do Anthropic, OpenAI and Google use, and is it
  free?** "Even Google, Gemini, they are all doing well with Nigerian
  accent. What are they using? Are those things free to get access for
  this, for transcribing a voice to text?"
  **Answered, and it turned up something better than expected.** All of
  theirs run on a server, cost money by the minute and need the internet,
  so none of them can be used here. **But Chrome has Google's own speech
  engine built in, free, and from Chrome 139 it can run on the device with
  no internet.** That would replace Moonshine, the worker, the storage and
  the whole conversion pipeline.
  **Built as a third choice on `/dev` so it can be measured. Nothing was
  removed.** Swapping the pipeline is his decision and it waits for him
  and for a real measurement. `RESEARCH.md` section 10.
- **2026-09-16. The model should switch by itself**, Moonshine to Whisper,
  with nobody choosing. `NOW.md` step 2.
- **2026-09-16. Read the logs remotely**, so a problem at church can be
  looked at from anywhere. Now possible with Cloudflare D1.
- **2026-09-16. The verse log and "give me another version".**
- **2026-10-28. The UI is not good enough yet.** "the interface, the UI is
  not yet cool, but let's leave it first. When we finish what is more
  important, we will now work on the UI." **Deliberately parked by him.
  Do not spend time on it until he says.**

### Decided

- **2026-10-30. Chrome's own ears are the main listener. Moonshine is the
  offline backup.** Measured on his phone: Chrome heard "Malachi 3:3",
  "ecclesiastes 4:19", "Proverbs 22", "Titus 1:2" correctly, online. The
  church has Starlink, so online is normal. "Chrome has nothing" for
  offline on his phone (Android, Chrome 155), so the on-device pack is not
  available there and offline means Moonshine. His words: "anytime it's
  offline, the system switches to moonshine when the network is not
  strong... we are already even optimizing moonshine before, so we can
  still optimize it and use it when the system is offline as a backup."
  **Built 2026-10-30:** the screen's memory, `src/scripture/memory.js`,
  with 33 service-style tests. It handles a named verse, "the next verse",
  "the previous verse", "the next chapter", "before that verse 9", a version
  said alone ("NLT", "the living Bible"), a version and verse together, and
  "that verse again". It ignores preaching. It is shown on `/dev` as "On the
  screen now". It is **not on the church display yet**, because the Bible
  text is not loaded.
  **Open, my reading, tune from real services:** a sentence counts as an
  instruction when it has 5 or fewer meaningful words or says "see", "show"
  or "media". "That verse again" goes to the verse before this one.
  **Built 2026-10-30:** the automatic switch. `src/listening/engine.js`
  holds the rule, 14 tests. **Automatic** is the first choice on `/dev` and
  the default. It listens with Chrome, and moves to Moonshine when the
  internet goes, when Chrome fails with the internet on (Brave), or when the
  browser has no speech at all (Firefox). It goes back to Chrome when it can.
  A refused microphone stops it and does not switch. Moonshine loads in the
  background while Chrome is hearing. Every switch is a NOTE line in the
  log. Walked through with a pretend browser in all five cases.
  **2026-10-31, his iPad:** Chrome on an iPad uses Apple's hearing, which
  heard his pastor much worse than Google's does on his Android. See
  `RESEARCH.md` section 10. **Open question for him, not decided:** on an
  iPad or iPhone should Automatic use Moonshine instead of Apple's hearing?
  And should "for" and "to" be read as 4 and 2 right after a book name
  ("Malachi for four")? That one trades a missed verse against a wrong one.
  **Not proved on real hardware:** the switch on his phone, and whether an
  installed app (PWA) keeps the microphone and Chrome's engine. There is no
  manifest or service worker yet, so there is no PWA to test. This replaces
  the older "model should switch by itself" item, which was Moonshine to
  Whisper and is no longer needed.
- **2026-10-28. No Supabase. Cloudflare is the whole stack.** Pages for
  the app, R2 for the model files, D1 for the logs, Pages Functions for
  the one endpoint that writes them.
- **2026-10-28. Not for sale.** "I don't even intend to commercialize
  this... it just helps my portfolio." So non-commercial licences are
  usable, including AfriSpeech. If that ever changes, the swappable layer
  in `DIRECTION.md` section 3 is what makes it changeable.
- **2026-09-16. Two addresses.** `/` for the church, `/dev` for Anthony.
- **2026-09-16. Moonshine first.** It picks up speech where Whisper picks
  up any noise in the room. Anthony's own observation, confirmed on his
  phone.

---


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
