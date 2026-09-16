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

**Left for next time:** connect Cloudflare Pages, then the accuracy spike.
Anthony owes a recording of real preaching before that spike can be
measured.
