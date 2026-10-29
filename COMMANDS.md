# COMMANDS

**How the preacher actually speaks, and what Shomea has to do about it.**

Anthony wrote these down while listening to his own pastor on 2026-10-29.
**His words are kept exactly as he wrote them**, because the whole value of
this file is that it is a record of real speech rather than somebody
imagining how a preacher talks.

Everything under "What this means" is my reading of them, and my reading is
the part that can be wrong.

---

## 1. What he wrote down

> Default Bible version: KJV
>
> The current situation
> it currently takes between 15secs and a minute to display a scripture,
> sometimes more.
>
> The nuanced ways Pastor calls chapters/verses in continuum (meaning next
> verse) or for a different version
>
> can we see that scripture? the amplified version.
> Can we see the next chapter?
> Can we see the next verse
> the next verse
> NLT
> Let's see NLT
> The living Bible
> can we see the next verse
> before that, verse x or before that let's see verse x (x is a number)
> What NLT calls it in proverbs 5:10 (meaning open that Bible verse in NLT
> version)
> When consecutive words are quoted from the Scripture without the verse,
> no way to open the that verse

---

## 2. What this means

Reading those back, the preacher is doing **five** different things, and
only one of them is "name a verse".

### A. Name a verse outright

> "Hebrews chapter one, verse two"

The only one that currently works at all. Everything else is new.

### B. Move, without naming anything

> "Can we see the next verse" / "the next verse"
> "Can we see the next chapter?"
> "before that, verse x" / "before that let's see verse x"

**He is moving relative to what is already on the screen.** So the screen
has to remember what it is showing, and "next" has to mean next from there.

"before that, verse x" is the interesting one: it is a jump backwards
inside the chapter already open, not a new reference.

### C. Change version, without naming the verse

> "can we see that scripture? the amplified version"
> "NLT"
> "Let's see NLT"
> "The living Bible"

**A version name said on its own is a command.** He will say "NLT" and
nothing else, and mean "the verse that is already up, in NLT".

Note "The living Bible" and "the amplified version": he uses the spoken
name, not the initials. Both forms have to be understood.

### D. Both at once

> "What NLT calls it in proverbs 5:10"

A verse and a version in one sentence, and in an order no parser would
expect. The version comes first.

### E. Quote without a reference

> "When consecutive words are quoted from the Scripture without the verse,
> no way to open the that verse"

He is describing a gap, not asking for something. This is the phrase
matching already sketched in `RESEARCH.md` section 5.

---

## 3. What this changes about the design

**The screen has to have a memory.** Up to now the plan was: hear a
reference, show it. Half of what he actually says only makes sense against
what is already showing. So there is a current position, and most commands
move it rather than replace it.

That position is: book, chapter, verse, version. Everything above is a
small change to one or two of those four.

| He says | What changes |
|---|---|
| "Hebrews chapter one verse two" | all four, version stays |
| "the next verse" | verse, plus one |
| "the next chapter" | chapter plus one, verse back to 1 |
| "before that verse 9" | verse, to 9 |
| "NLT" | version only |
| "What NLT calls it in Proverbs 5:10" | all of it |

**This is why the version tally idea in `RESEARCH.md` section 5 is not
enough.** It assumed "another version" with nothing else said. He names the
version he wants, most of the time.

---

## 4. Speed is a requirement, and he has given the number

> "it currently takes between 15secs and a minute to display a scripture,
> sometimes more."

That is what he is living with today, and it is the thing he raised first.

**A verse has to be up in about two seconds.** Moonshine Base measured
1532ms to 2156ms per piece of audio on his phone on 2026-10-29. Nigerian
Whisper measured 46899ms. See `RESEARCH.md`.

Anything that costs seconds has to earn them, and almost nothing can.

---

## 5. Not decided yet

- **Which versions he can actually show.** Amplified, NLT and The Living
  Bible are all under copyright. `DIRECTION.md` section 3 holds the rule
  for where licensed text may live.
- **What happens at a chapter boundary.** "The next verse" at the last
  verse of a chapter: roll into the next chapter, or stop?
- **How long the screen remembers.** If he names a verse, preaches for ten
  minutes, then says "the next verse", does that still mean the verse from
  ten minutes ago?
