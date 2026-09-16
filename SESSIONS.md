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

**Left for next time:** Anthony connects Cloudflare Pages, which is the one
thing only he can do. Then the accuracy spike, which also needs a recording
of real preaching from him.
