# SESSIONS

Log of each work session. Newest at the top. Keep entries short.

---

## Session 1: 2026-09-16

**The research, the decisions, and the repository**

Started from nothing. Anthony described the product by voice: a church app
that listens to the preacher and puts the verse on the screen, offline.

**The research came first, because he asked for it before any building.**
Speech models, Bible licensing, hosting, offline storage. All of it is in
`RESEARCH.md`, with the parts that were read but never run marked as
unconfirmed in section 7 of that file.

**Three things the research changed.**

The first pick of speech model was wrong. Whisper was proposed, at a size
taken from the whisper.cpp build rather than the browser build. **Moonshine
is the better choice**: smaller, more accurate than Whisper tiny, and it
actually streams instead of reprocessing every chunk from scratch. A
working reference app already exists, `moonshine-web`, so the audio
pipeline does not have to be built from nothing.

**The Bible versions changed shape.** Anthony wanted ten, including NKJV,
Good News and The Passion Translation. Eleven public domain versions can be
bundled freely and two of them are the church's own most used. Of the three
copyrighted ones he named, only Good News is obtainable, free, through
API.Bible's non-commercial tier. NKJV and TPT need a direct request to their
publishers. **That produced the rule in `DIRECTION.md` section 3**: licensed
text never goes inside the app, it lives in a layer that can be emptied.
That rule keeps the door open for the day he builds a sellable version.

**No backend.** Considered and rejected on purpose. Everything runs on the
device, so a server would only add something that can be down, in a product
whose first rule is that it works with no network. The one server-shaped
job, refreshing licensed text, happens at build time instead.

**Cloudflare Pages over Netlify and Vercel.** Netlify's free plan is now
credit based and works out at roughly 20 deploys a month, after which every
site on the account is paused. This project will be redeployed constantly
during the accuracy work. Cloudflare gives 500 builds a month and unlimited
static bandwidth.

**Anthony's hardware became an architectural constraint, not a footnote.**
He has a phone and an iPad and no laptop, so he cannot open localhost. That
makes a preview URL the first thing that has to exist, before any feature
work, because without one he cannot see anything that gets built.

**Two unknowns were identified and written down rather than guessed at.**
Whether either speech model copes with the accents of this church's
preachers, which only a real recording answers. And whether an iPhone
clears the app's stored data between Sundays, which would break the offline
promise.

Wrote `README.md`, `DIRECTION.md`, `RESEARCH.md`, `CLAUDE.md`,
`CURRENT.md`, `NOW.md` and this file.

**Then built one screen, so that connecting Cloudflare would produce
something worth opening.** A Vite and React app whose only page is the
device check. It reads what the device supports, shows how much room the
app is allowed and whether that room survives being unused, and opens the
microphone with a live level bar so a lapel mic can be tested in the real
room. It records nothing and sends nothing anywhere.

It is deliberately a diagnostic and not a piece of the product. Anthony has
no laptop, so this is the only way he can find out what his own hardware
does, and it answers four of the unconfirmed items in `RESEARCH.md`
section 7 without anybody guessing.

Two things were wrong on the first look and were fixed: a line telling him
to tap a button "below" when the button was above, and the status dots
centring against labels that had wrapped onto two lines. Screenshotted at
320px, 390px and 1280px, the button clicked, and checked for content
clipped past the right edge at five phone widths. Clean.

**Then, the same day, the listening pipeline went in**, because Anthony had
a service in five hours and wanted to record at it.

Moonshine and Whisper both wired up, five models on one screen, the model
running in a worker so the display never freezes. Audio is cut into five
second pieces with a one second overlap so a reference spoken across the
join is not lost, and silence is skipped rather than sent. Every piece makes
one line in a log that saves as a text file, so a result never has to be
read off a screenshot.

**Two things were found by building that no amount of reading would have
found.**

The first build produced a 26.8 MB WebAssembly file. Cloudflare Pages
refuses anything over 25 MiB, so it would simply have been rejected. The
bundler had folded in the ONNX runtime, which the library fetches from a CDN
by itself anyway. The fix is one resolve condition,
`onnxruntime-web-use-extern-wasm`. The whole deployment is now 680 KB.

The second was in the display. It sized the verse by counting characters and
capped the column at "26ch", which was being measured against the small body
text. On a phone it looked fine. On a projector the column came out about
220 pixels wide and the verse ran off the bottom of the screen. It now
measures the real box and shrinks the text until it fits, so it cannot
scroll. That bug only appeared because the screen was looked at on a
projector-shaped window instead of trusted.

The verse display also got its colours: eight dark ones and a picker, with
the words retinting themselves so a person cannot pick dark grey on black by
accident and find out during a service. A hamburger in the corner, and no
navigation bar, because a projector must never show a menu above a verse.

**Anthony's phone reported 10,240 MB of storage.** Room for every model
several times over, and one of the two big unknowns answered for Android.
It is still open for iPhone.

**Left for next time:** the service. Everything else waits on what it hears.
