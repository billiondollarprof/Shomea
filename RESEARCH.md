# RESEARCH

**Everything known about how Shomea can be built. Researched 2026-09-16.**

This file exists so nobody researches the same thing twice. When something
here is proved or disproved by running real code, **change the line and say
who proved it and when.** A research note that has been overtaken is worse
than no note, because the next person cannot tell which half is still true.

Section 7 is a list of things that were read but never run. Treat those as
unconfirmed until somebody confirms them.

---

## 1. The speech model

### Moonshine

Built by Useful Sensors specifically for live listening on small devices.

- Tiny is 27M parameters. Base is 61M, about 237MB on disk unquantised.
- **Quantised** (shrunk so the model works in whole numbers instead of
  decimals, which makes it smaller and faster for a small accuracy cost)
  **the tiny model is about 28MB in total**: 7.94MB encoder, 20.2MB
  decoder. Both sit under Cloudflare Pages' 25 MiB per-file cap.
- Beats Whisper tiny and Whisper small on the standard benchmarks while
  being smaller than both.
- **It streams properly.** It keeps what it has already worked out and
  reuses it, instead of starting again on every chunk. Latency under 200ms
  on ordinary hardware.
- **Tiny and base are English only.**
- As of 2026-09-16 the **Moonshine v2 streaming ONNX exports had not
  shipped**. Check whether that has changed.

### Whisper

- Works in fixed 30 second windows with **no memory between them**. Every
  chunk is processed from scratch. That is why it feels slow live.
- Multilingual, 99 languages, and generally stronger on accented English.
- **The "75MB tiny" figure everyone quotes is the whisper.cpp GGML build,
  not the ONNX build a browser uses.** Do not repeat it as a browser
  number.
- WebGPU (the browser's route to the graphics chip) runs it 5 to 10 times
  faster than WASM (the slower fallback that works everywhere).

### The one question that can kill the project

**Nobody knows how well either model handles a Nigerian accent.** No
published benchmark answers it. Only a recording of the actual preachers
answers it.

Everything else in this file is ordinary engineering. This is the risk, and
it is why the accuracy spike comes before any design work. See `NOW.md`.

### Combining the two models

Four options were considered. Ranked, with the reasoning.

**A. Fix it without a second model. Try this first.**

The app does not need a good transcript. It needs 66 book names and some
numbers. That is a tiny vocabulary.

So take the messy output and match it against that small list **by sound,
not by spelling** (phonetic matching, comparing how words sound so that
"a fee shins" still reaches "Ephesians"), together with fuzzy matching
(allowing for a few wrong letters). Most accent errors die here, at almost
no cost.

**B. A cascade. The good combination, if A is not enough.**

Moonshine listens all the time, because it is fast and cheap. When what it
heard looks like a verse reference but confidence is low, take the same two
to four seconds of audio, already sitting in the buffer, and run only that
through Whisper. Use Whisper's answer.

This is not two models side by side. Whisper wakes a handful of times in a
sermon. The cost is near nothing and the accuracy rises exactly where it
matters.

**C. Whisper alone.** If the spike shows Moonshine cannot cope. Simpler,
slower, still workable.

**D. Both running in parallel, always.** Rejected. Doubles memory and
compute on a phone, and the slower model sets the speed. Anthony called
this overkill himself and he was right.

**Order: A, measure, then B only if the number is not good enough.**

### One more lever, unconfirmed

Whisper takes an `initial_prompt`, a short piece of text that nudges it
towards a vocabulary. Feeding it the 66 book names should help.

**But as of 2026-09-16 transformers.js had not clearly shipped this.** See
huggingface/transformers.js issue #990 and #1099 for Moonshine support, and
issue #923 for the prompt question. It is also a soft nudge rather than a
rule, and it works better on bigger models. **Confirm before relying on it.**

### The reference app to start from

**`huggingface/transformers.js-examples/moonshine-web`**

React and Vite. Runs Moonshine Base entirely in the browser through
Transformers.js, WebGPU accelerated with WASM underneath. It works today.

**Do not build the audio pipeline from scratch.** Start here.

### Where the models live

- `onnx-community/moonshine-tiny-ONNX`
- `onnx-community/moonshine-base-ONNX`
- `onnx-community/whisper-tiny`, `onnx-community/whisper-base`

**Warning: huggingface.co was blocked from the agent session that did this
research** (`CONNECT tunnel failed, 403`). npm and raw.githubusercontent.com
both worked. Test your own network early. If Hugging Face is blocked for
you too, the app still works on a real device, because the browser fetches
the model itself. You simply cannot benchmark inside the session.

---

## 2. Hearing when somebody is speaking

Do not feed the model a constant stream.

Use **VAD** (voice activity detection, a small model that decides whether
audio is speech or just room noise). Speech only reaches the transcription
model when there is speech. Less work, better accuracy.

- **`@ricky0123/vad-web`** runs Silero VAD in the browser through ONNX.
  Mature, and it is the standard pairing for this.

### The microphone

**A lapel microphone plugged straight into the device is correct.** It sits
close to the mouth, so the voice is loud and the room is quiet by
comparison. That is the single biggest thing that can be done for accuracy,
and it costs nothing in software.

One setting to watch, and it is about the browser, not the microphone. When
a browser opens a microphone it switches on `echoCancellation`,
`noiseSuppression` and `autoGainControl` by default. **`autoGainControl`
turns the volume up whenever things go quiet**, which between sentences
means it turns up the room. With a good lapel mic the signal may be cleaner
with it off.

**Test both, with the real microphone, in the real room.** Record the
answer here.

---

## 3. Finding the reference in what was heard

**`openbibleinfo/Bible-Passage-Reference-Parser`**, the BCV parser.
TypeScript, built to cope with typos and ambiguous references.

**Its known weakness is exactly this project's problem: it is too eager.**
It reads "she is 2 cool" as Isaiah 2. A forty minute sermon full of
mis-heard words will produce false hits, and see `DIRECTION.md` for why a
false hit is the worst thing this app can do.

**So it must be gated.** Only accept a reference when:

1. A book name matches strongly, by sound and by spelling.
2. A number follows within a word or two.
3. Confidence clears a bar.

**Tune that bar against real sermon transcripts, never against clean text.**

---

## 4. The Bible text

### Free to bundle. No permission, no fee, offline for ever.

King James (KJV), King James 1611, American Standard (ASV), World English
Bible (WEB), Berean Standard (BSB), Darby, Webster, English Revised (ERV),
Douay-Rheims, Young's Literal, American King James.

**Eleven versions, and two of them are the church's own most used.**

One wrinkle worth recording: outside the UK the KJV is public domain, but
**inside the UK the Crown holds rights to it**. Not a problem for a
Nigerian church. Written down so nobody trips on it later.

### Where to download them

- **Bible SuperSearch**, https://www.biblesupersearch.com/bible-downloads/
  Ships 11 public domain Bibles as SQLite, JSON, CSV and plain text, and
  states plainly they may be redistributed. Also on SourceForge.
- **Free Use Bible API**, bible.helloao.org, built with the Berean Standard
  Bible team who put BSB into the public domain.
- **scrollmapper/bible_databases** on GitHub, 140+ translations.

Size is not a problem. The whole KJV as plain text is about 4.5MB, roughly
1MB compressed. Eleven versions is 15 to 25MB.

### The versions the church actually uses

Asked and answered: **KJV** and **NKJV** most, plus **Good News Bible**,
**The Passion Translation**, and sometimes **ASV**.

KJV and ASV are free. The other three are under copyright.

### Good News Bible: obtainable, free, properly

**API.Bible**, run by the American Bible Society.

- Starter plan is **$0**. 5,000 calls a month, plus a choice of copyrighted
  translations on top of every public domain one.
- **GNT is among the ones they carry**, with CEV, KJV and Reina-Valera.
- **Strictly non-commercial. A church's own app qualifies.**
- **You may cache an entire translation on the device.** The only rule is
  that cached content must be **refreshed from API.Bible at least once
  every 30 days.**

So offline still holds. The text needs the internet once a month, never
during a service.

**And it need not be the device that fetches it.** See section 6 for why the
refresh should happen at build time, which also keeps the API key out of
the browser.

### NKJV: not available

Owned by Thomas Nelson, part of HarperCollins Christian Publishing. Not on
API.Bible. The legitimate route is a direct request for permission for a
single church's display use. Churches are granted this more often than
people expect. Worth one email.

### The Passion Translation: not available

Owned by Passion & Fire Ministries. BroadStreet Publishing is the exclusive
publisher. **No developer licensing programme was found at all.** A direct
approach to BroadStreet is the only route. **Do not build anything around
it landing.**

### Other APIs that advertise NKJV and NIV

Bolls Bible API and jsonBible list NKJV, NIV, ESV and more. **Their
licensing position is unclear at best.** If they are used at all, they go
behind the swappable layer in `DIRECTION.md` section 3, like everything
else under copyright.

---

## 5. The parts that need no model at all

### "Give me another version"

The preacher reads a verse. Later he says something like "someone give me
another version", **without naming the verse again**. Shomea must know which
verse he means.

The design, and it needs no AI:

1. Every verse put on screen is written to a **verse log** with a time.
2. A switch phrase with no reference in it means: take the verse at the top
   of that log and show it again in the next version.
3. **Which version is next comes from a tally kept on the device.** It
   starts with a sensible order and becomes the church's own order after a
   few services, because it counted what they actually switch to.
4. If he names a version out loud, a lookup table of names and nicknames
   catches it: "the Passion", "King James", "the Message", "Good News".

A small state machine. Instant, and it cannot invent anything. Probably the
part that will feel like magic in the room.

### A quoted line with no reference

The preacher quotes a verse without naming it. Can Shomea find it? **Yes,
and offline.**

- 31,102 verses. Build an inverted index and rank with **BM25** (a standard
  scoring formula that weights rare words heavily). Milliseconds on the
  device.
- **The search is easy. The trigger is the hard part.** A preacher talks for
  forty minutes and almost none of it is a quotation. Search every sentence
  and the screen flickers with verses for no reason.
- So: only search when the phrase is long enough, and only display when the
  best match scores far clear of the second best.

**Build it, ship it switched off, prove it in a real service, then turn it
on.** It can be dropped entirely if it does not earn its place.

---

## 6. Hosting, storage and the shape of the thing

### There is no backend, and there does not need to be one

Everything runs on the device. The model, the Bible text, the verse log,
the learned version order, the settings. Nothing is shared between devices,
there are no accounts, and nothing needs to be synchronised.

**Adding Supabase or Firebase would add a thing that can be down, in a
product whose first rule is that it works with no network.** See
`DIRECTION.md`.

The single place a server might have been needed is refreshing the licensed
text from API.Bible, because an API key does not belong in a browser where
anybody can read it.

**That is solved without a server.** The key lives in the build
environment. **The build fetches the licensed text and bakes it into the
deployment.** A rebuild once a month satisfies API.Bible's 30 day refresh
rule, the key never reaches a browser, and the device still never needs the
network during a service.

If a server is ever genuinely needed, **Cloudflare Pages Functions are
already there**, so it costs nothing and adds no new account.

### Hosting: Cloudflare Pages

Free tier, checked 2026-09-16:

| | Cloudflare Pages | Netlify | Vercel Hobby |
|---|---|---|---|
| Deploys per month | **500 builds** | ~20 (credit based) | unlimited, 1 at a time |
| Bandwidth | **unlimited static** | ~15GB | 100GB |
| When the cap is hit | n/a | **every site pauses** | capped |

Netlify's free plan is 300 credits a month and a production deploy costs
15, so roughly **20 deploys and then every site on the account goes down
until the next month**. For a project that will be redeployed constantly
during the accuracy work, that is unusable. Vercel is better but its limits
sit on functions, which is not the shape of this app.

**Cloudflare Pages it is.** 500 builds a month, unlimited static bandwidth,
and Anthony already has an account and knows the dashboard.

### The limits to design around

- **25 MiB per file.** Bigger files must go to R2 (Cloudflare's file
  storage, with a public bucket).
- 20,000 files free, 100,000 on a paid plan.
- A claim of a 100MB total project cap circulates online. **It is wrong**
  and does not appear in Cloudflare's own limits.

**Moonshine tiny fits as it is** (20.2MB and 7.94MB). **Moonshine base at
237MB does not**, and would need R2 or splitting. That is a real reason to
try tiny first.

### Keeping it on the device

- **Cache API** for the model files and the Bible text, because those are
  fetched by URL.
- **IndexedDB** (a database inside the browser) for the verse log, the
  settings and the learned version order.
- A **service worker** (a script that sits between the app and the network)
  puts everything in place on install.
- **Wake Lock API** so the screen does not sleep during the sermon. Easy to
  forget, obvious the first time it happens live.

First run needs the internet once. After that, aeroplane mode.

---

## 7. NOT YET CONFIRMED. Do not build on these until somebody checks.

This research was done by reading, not by running. Confirm each of these
and update this file with what you found.

1. **iOS Safari WebGPU support**, and how slow the WASM fallback is if it
   is missing. Anthony tests on an iPhone and an iPad.
2. **iOS Safari storage eviction.** Safari can clear a site's storage after
   a stretch of not being used. **A church app runs once a week, which is
   right on that boundary.** Find the current rule, and whether installing
   to the home screen changes it. **If the model is cleared between
   Sundays, the app re-downloads every week and the offline promise is
   broken.** This is the most serious unknown after the accent question.
3. **Microphone access inside an installed iOS web app**, in standalone
   mode, not just in a Safari tab.
4. Whether **transformers.js supports `initial_prompt`** yet.
5. Whether **Moonshine v2 streaming ONNX exports** have shipped.
6. **Exact current file sizes** of the quantised Moonshine and Whisper ONNX
   builds. The numbers above came from search results, not a download.
7. **Which copyrighted versions API.Bible carries today**, read from their
   own Bibles endpoint rather than from a blog. Confirm GNT is there and
   NKJV and TPT are not.
8. **Whether your session can reach huggingface.co.**

---

## 8. MODELS TRAINED ON NIGERIAN SPEECH. Researched 2026-10-28.

Anthony asked whether anything open source has been trained on how
Nigerians actually speak. **It has, and there is quite a lot of it.**

### The dataset everything is built on

**AfriSpeech-200.** 200 hours of Pan-African accented English, 67,577
clips, 2,463 speakers. **67% of it is Nigerian accents.** Licensed
CC BY-NC-SA 4.0, which means non-commercial use only. Shomea is a church
app and not for sale, so that fits.

The paper reports a fine-tuned Whisper gaining **16.2% average relative
improvement** across accents over the plain model. That is a real gain and
it is in exactly the direction this project needs.

### The models, best first

| Model | Base | Who made it |
|---|---|---|
| `intronhealth/afrispeech-whisper-medium-all` | Whisper Medium | Intron Health, who built AfriSpeech |
| `NCAIR1/NigerianAccentedEnglish` | Whisper Small | Awarri, under Nigeria's Federal Ministry of Communications |
| `DivineAngel317/whisper-small-nigerian-accented-english` | Whisper Small | 15 hours of Hausa, Igbo and Yoruba accented English |
| `Modularcomputing/dynamic-asr` | Omnilingual ASR 1B | Nigerian English, Pidgin, Igbo, Yoruba, Hausa. 187 hours |

**Whisper Small is the size to aim at.** Medium is roughly three times
bigger and the 1B model is far too large for a phone browser.

**Licences differ and must be read before anything ships.** AfriSpeech is
non-commercial. NCAIR1 uses its own Open Source Research and Innovation
Licence with extra conditions. Read each one.

**`NCAIR1/NigerianAccentedEnglish` IS GATED.** Proved on 2026-10-29: the
conversion workflow got a 401 and "Access to model is restricted". Its
owner has to grant access before Hugging Face will serve a single file, so
no token-free pipeline can use it.

To use it, somebody with a Hugging Face account requests access on the
model page, makes a read token, and that token goes into this repository as
a secret called `HF_TOKEN`. The workflow already looks for it.

Until then, the ungated ones are the route.
**`DivineAngel317/whisper-small-nigerian-accented-english` is not gated**,
proved on 2026-10-29, and it converted in 81 seconds.

### What the conversion pipeline has actually proved, run by run

| Run | Got as far as | Stopped by |
|---|---|---|
| 1 | Install | `optimum[exporters]` no longer carries the exporter. Optimum 2.0 moved it to `optimum-onnx` |
| 2 | The model | NCAIR1 is gated, 401 |
| 3 | Converted | R2 was not switched on for the account. Error 10042 |
| 4 | **Converted, made the bucket, uploaded three files** | The encoder was 336 MiB. See below |

### The encoder size, and why it changed the plan

Run 4 proved R2 works. It then stopped on this:

    Wrangler only supports uploading files up to 300 MiB
    encoder_model.onnx is 336 MiB

**The upload limit was the messenger, not the problem.** The real finding is
that leaving the encoder at full precision makes a model a church phone
cannot download. About half a gigabyte, over Nigerian mobile data, before it
hears one word.

The earlier note here said other people's conversions lost accuracy by
shrinking the encoder, so this one did not shrink it. That reasoning was
sound and the result was unusable. **A model nobody can download is not more
accurate, it is not a model.**

So both halves are shrunk now, and only the shrunk files are written out at
all. The full precision copies were being stored and uploaded for nobody,
because asking for dtype "q8" fetches the two ending in _quantized and
nothing else.

**If accuracy turns out to suffer, that is a measurement, not a guess.**
`--keep-encoder-full` puts it back, and then the size has to be solved some
other way: fp16 for the encoder, or Whisper Base instead of Small.

### Device size is NOT the constraint. Anthony corrected this on 2026-10-29.

An earlier note here treated a few hundred megabytes as too much for a
church to download. **That was wrong and he said so plainly.**

> "most of these churches is their laptop they used to load, it's not
> mobile phone... for a mobile phone, 300 MB, believe you me, it's not even
> big. Because mobile phones nowadays is 8 gigabytes of RAM... most of the
> phones are now 128 gigabytes."

He is right. A church runs this on a laptop into a projector, and a modern
phone has the room and the processor for it. **The only hard limit left is
Cloudflare's 300 MB per file on upload**, which is about the host and not
about anybody's device.

So accuracy is worth paying size for here. Do not shrink something below
what it needs to be in order to save megabytes nobody was short of.

### Run 5, and what was actually wrong

Shrinking both halves did not save it. The size guard caught:

    decoder_model_merged_quantized.onnx is 738 MB

**A shrunk file should not be 738 MB.** Whisper Small's decoder is about 153
million numbers, so roughly 600 MB at full precision. Shrunk to whole
numbers it should be nearer 150 MB. Something in the shrinking is barely
touching it, most likely the `MatMulConstBOnly` option, or the merged
decoder carrying two copies of the same weights.

**The cause, found after run 5.** The decoder is exported as one graph
holding two code paths, one for the first word and one for every word after,
wrapped in a branch. `quantize_dynamic` does not descend into branches. So
it walked past most of the weights, shrank almost nothing, and reported
success.

**The fix was to stop hand-rolling it.** transformers.js ships its own
converter, `scripts/convert.py` in the `huggingface/transformers.js`
repository, maintained by the same people who make the library the browser
loads the model with. It knows about this. The workflow clones it and drives
it now, and `scripts/convert_model.py` only checks and tidies the result.

Five runs went into a hand-rolled export that produced a wrong answer
confidently. **The lesson is the general one: when a library ships a tool
for converting models to its own format, use that tool.**

Everything in the chain is now proved except R2 itself. The Cloudflare token
works: it created the bucket. The conversion works: 81 seconds, no errors.

### THE PROBLEM, and it is the one worth solving

**None of them are ONNX.** Every one is a PyTorch model, and the browser
cannot run PyTorch. They have to be exported to ONNX and quantised first.

That export needs Python, a few gigabytes of download and real compute.
**It cannot happen in this repository and it cannot happen on Anthony's
phone.**

### THE ANSWER, and it is why Anthony's CI idea matters

**GitHub Actions runners can reach Hugging Face. This agent session
cannot.** Confirmed 2026-10-28: huggingface.co times out from here.

So the conversion becomes a workflow:

1. A runner pulls the Nigerian-accent model from Hugging Face.
2. Python exports it to ONNX with Optimum, encoder and merged decoder.
3. It quantises to int8 and checks the result against the original.
4. It uploads the files to Cloudflare R2.
5. The app loads them from R2 like any other model.

That is Python in CI doing a job nothing else here can do, and it also
solves self-hosting the model files, which Cloudflare Pages refuses
because of the 25 MiB cap.

**Two warnings found in other people's conversions of fine-tuned Whisper:**

- **Quantising the encoder can cost accuracy.** One Hinglish conversion had
  to keep the encoder at full precision and only shrink the decoder. Check
  each half separately rather than quantising the lot.
- **Fine-tunes often ship no alignment heads**, so word timings break. We
  do not use word timings, so it does not matter here. Worth knowing.

### Somebody has already solved the hard part

**`ChurchPresenter`** on GitHub (GPL-3.0, and widely forked) is worship
presentation software that **includes a Bible lookup engine that detects
scripture references from speech.** That is the exact problem in `NOW.md`
step 1.

Read how they did it before writing ours. **GPL-3.0 means copying their
code makes this project GPL too**, which is fine for a church app Anthony
is not selling, and not fine if that ever changes. So read it for the
approach, and write ours.

Others worth a look for the display: `praisenter`, `CrossPresenter`.

---

## 9. PROVED ON REAL HARDWARE. These are no longer guesses.

### 2026-09-16, Anthony's Android phone, on the deployed site

- **The microphone works.** The level bar moved and read "Hearing you".
- **Storage quota is 10,240 MB.** Ten gigabytes. Room for every model on
  the list several times over. Item 2 of section 7 is answered for Android.
  **It is still open for iPhone.**

### 2026-09-16, Anthony speaking into the phone. THE FIRST REAL RESULTS.

**Moonshine Base works, and the pattern in its failures is the whole plan.**

What it got right:

- "I want you to turn to the book of Exodus chapter 6 verse 1." Exact.
- "Exodus two, verse number three." Exact.
- "Somebody opened the book of Proverbs 13, 18." Exact.

What it got wrong:

- "verse number one" on its own came back as **"That's number one"** and as
  **"Best number line"**.
- "Titus 1:1" came back as **"Like toast one one"**.
- "Proverbs chapter 2 verse 1" came back as **"Provide chapter 2 verse 1"**.

**Anthony spotted the pattern himself and he is right: the book name is the
anchor.** When he says the book first, the model has context and gets the
rest right. When he says a bare "verse number one" with nothing before it,
it has nothing to hold onto and produces noise.

**This is the single most useful finding so far**, because every one of
those failures is recoverable without a better model:

- "Like toast" against "Titus": both are T-T-S by sound.
- "Provide" against "Proverbs": the same first four letters.

That is exactly option A in section 1. **Match the 66 book names by sound,
then trust a number that follows a confident book match and ignore a number
that follows nothing.** Build that before reaching for a second model.

**Moonshine is also the better listener in a room.** Anthony: Moonshine
"seems more efficient at picking actual sounds", while Whisper "picks any
sound, surrounding sound, or whatever". That matches what Moonshine was
built for.

**Whisper failed completely, and it was our bug, not Whisper's.** Every
Whisper model returned:

    Cannot specify `task` or `language` for an English-only model.

The worker was passing `language` and `task` to models whose names end in
`.en`. Those builds only speak English and reject both options. Fixed on
2026-09-16 by passing neither, to any model. **Whisper has still never been
measured on a real voice.** It has to be retried before any comparison
between the two families means anything.

**A failure before the model has loaded is not a model failure.** The log
showed "No model loaded" when he spoke during the download, and "Failed to
fetch" when the network dropped mid download. Both are honest and both look
alarming. Worth making them read as what they are.

### 2026-09-16, found while building, not by reading

- **Cloudflare's 25 MiB file cap bites on the very first build.** The
  bundler folded the ONNX runtime's WebAssembly into the deployment and
  produced a 26.8 MB file. That deploy would have been rejected.
  The fix is the `onnxruntime-web-use-extern-wasm` resolve condition in
  `vite.config.js`. Read the comment there before touching it. With it, the
  whole deployment is 680 KB.
- **Transformers.js already fetches the right runtime from a CDN itself**,
  choosing between four builds based on the browser and pinning the version
  it was tested against. Do not override that by hand. The code that does
  it is worth reading: `dist/transformers.web.js`, search `wasmPathSuffix`.
- **WebGPU cannot be self-hosted on Pages.** The runtime build it needs is
  27 MB. Putting it on R2 is real work, so the app runs on the plain route
  today. This is a hosting limit, not a preference.
- **`onnxruntime-node` cannot install in this environment.** Its postinstall
  downloads a native binary and the proxy blocks it. `.npmrc` carries
  `ignore-scripts=true`, which is why the install works. It is not needed:
  nothing here runs in Node.
