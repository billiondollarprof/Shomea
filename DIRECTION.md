# DIRECTION

**What Shomea is being built toward, and the rules that do not bend.**

`CURRENT.md` is what exists. This file is what it is for. When the two
disagree, this file is right and the code is behind.

---

## 1. The problem being solved

A preacher names a verse. Some of the congregation find it. Most do not,
or they find it three verses later, or they are still turning pages when he
has moved on. The ones on phones lose the thread entirely.

Shomea removes the gap. He says it, it is on the screen.

Nobody operates it. That is the whole point. A person sitting at a laptop
typing references is the thing this replaces, and that person is either
slow, or distracted, or not there that week.

---

## 2. The four rules that never bend

### It works offline

**After the first install, a whole service runs with no network.** Not
degraded, not partial. The same app.

This is not a preference. Church buildings have bad signal, the wifi drops,
the data runs out, and none of that may ever be the reason a verse does not
appear. The model runs on the device. The Bible text is on the device. The
switching logic is on the device.

The only thing allowed to touch the network is refreshing licensed text,
and that happens between services, never during one.

### It never shows the wrong verse

**A wrong verse on a screen in front of a whole church is the worst failure
this app has.** It is worse than showing nothing, because showing nothing is
invisible and being wrong is public.

So the app is built to stay silent when it is unsure. Every gate, every
confidence bar, every threshold is set from that direction. When in doubt,
show nothing and wait for the next sentence.

Read that again before lowering any threshold to make a demo look better.

### It works for any preacher

The church has several. Visiting preachers turn up. **Nothing may depend on
training the app on one voice**, and there is no enrolment step.

### Nothing to operate

No console, no operator, no settings during a service. It is switched on
before, and switched off after. Whatever cannot be decided without a human
in the moment is not a feature, it is a bug.

---

## 3. The licensed text boundary

Eleven Bible versions are public domain. They are bundled into the app,
they ship with it, and they work offline for ever. Nothing about them needs
permission.

**Everything under copyright lives in a separate layer that can be swapped,
refreshed or emptied without touching a line of the app.**

This boundary is not bureaucracy. It is what keeps two futures open at once:

- **Today** Shomea is free, for Anthony's own church, and non-commercial.
- **One day** he may build a version to sell to other churches. He has said
  so himself. **The moment money is involved, the licensing position
  changes completely.** NIV commercial use is not available at any price
  through API.Bible. Others need paying for.

If licensed text were baked into the app, that day would mean rebuilding.
With the boundary, it means emptying one store and refilling it.

**Never bundle copyrighted scripture into the app itself. Never.**

---

## 4. Plain words on every screen

Nobody using this app is technical. The person switching it on before a
service is a volunteer.

- **No model names, no "transcription", no "inference", no "WebGPU", no
  "cache", no megabytes** in anything a user reads.
- Say **listening**, **ready**, **getting ready**, **not hearing anything**.
- If a control needs explaining, the control is wrong, not the person.

The one thing worth showing is **whether it is hearing him**. That builds
trust and it is the only diagnostic anybody needs. Everything else hides.

---

## 5. What Shomea is not

- **Not a presentation tool.** No song lyrics, no slides, no announcements.
  There is software for that already and it is not this.
- **Not a note taker.** It does not transcribe the sermon for anybody to
  read. It listens for references and forgets the rest.
- **Not a recording.** Audio is used and dropped. Nothing is stored and
  nothing leaves the device.
- **Not multi-site, multi-church or an account system.** One device, one
  church, no sign in. The day it needs accounts is the day it has become
  the other product, and that one has a different name.

---

## 6. The measure of done

Not a green build. Not a passing test.

**A whole service runs, in aeroplane mode, and nobody touches the machine.**

Until that has happened, in a real service, with a real preacher, it is not
finished.
