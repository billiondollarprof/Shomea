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

## 5. "MEDIA" IS THE WORD. This is the most important thing in this file.

Anthony, 2026-10-29:

> "he would say a string of four words from a particular chapter, but he
> didn't remember the chapter. He can just mention media. Once he mentions
> media, it means that he's saying that the media should show him the
> scripture... Media is another word to call on the Bible app"

**He is already calling the media team by name, out loud, in the middle of
preaching.** That word is the trigger, and it has been there all along.

> "let's read that verse again, media"

**Why this matters more than anything else here.** The biggest danger in
this whole project was the eager parser: forty minutes of speech, and the
screen flickering with verses nobody asked for. `DIRECTION.md` says never
show the wrong verse, and that was the hardest rule to keep.

"Media" removes the guessing. When he wants something shown, he says so.

### CORRECTION, 2026-10-30. There are THREE triggers, not one.

I read the above as "media is the trigger". Anthony corrected it, and the
reason matters more than the correction:

> "If you are using only media as a trigger, that means anytime the pastor
> is preaching, the pastor would always deliberately say media, because
> currently he says it without thinking"

**That is the whole point.** He says it naturally now. Build the app around
it and he has to start saying it on purpose, which changes how he preaches.
**A tool that changes how somebody does their job has failed**, however
clever the trigger is.

So, three ways in, and any one of them is enough:

| Trigger | Example | On its own? |
|---|---|---|
| **A reference, spoken** | "in Malachi chapter 3, verse 5" | Yes |
| **A quotation** | about four consecutive words from a verse | Yes |
| **"Media"** | "let's read that verse again, media" | Yes |

And "media" is still what makes the vague ones safe: a bare "NLT", "the
next verse", a half-remembered quote.

> "sometimes he just quotes open to the book of something like that... Then
> sometimes he's speaking, he will now just say something like in Malachi
> chapter 3, verse 5."

---

## 6. NO TWO BOOKS SOUND ALIKE. This is what makes it work.

Anthony, 2026-10-30:

> "luckily enough, no 2 books in the Bible sound alike. First John at least
> has John first. Second John has second on it. Third John. So I don't
> think any book, any 2 books sound alike."

**He is right, and it is the single most useful fact in this file.**

Matching a mis-heard word against 66 names is only dangerous when two names
are close. They are not. So a book can be found by **what it sounds like**
rather than by what the model typed, and there is no near-miss to confuse
it with.

The real failures so far, all recoverable this way:

    "Diters"        Titus
    "Like toast"    Titus
    "Provide"       Proverbs
    "an Anakai"     Malachi
    "a fee shins"   Ephesians

### The numbered books are the one exception, and he handled it

> "first John, second John, third John. Those are editions, right? But if
> it not say first, it just says John, it means we are talking about the
> account of Jesus Christ, John"

**A number in front is part of the name.** No number means the plain book.
That holds for Samuel, Kings, Chronicles, Corinthians, Thessalonians,
Timothy, Peter and John.

### Sound alone is not enough, and he said how to firm it up

> "using sound plus qualifying it to the verse"

**A book name is believed when a number follows it.** That is what turns a
loose sound match into a reference, and it is why "Best number line" was
correctly ignored: numbers with no book in front of them are noise.

---

## 7. Answered by Anthony, 2026-10-29

### "The next verse" at the last verse of a chapter

**Leave what is on the screen. Do not move.**

> "obviously stops because there's no verse in that particular chapter...
> I think the best thing is to just leave the verse that is already there.
> They don't move it because there's no verse. But it's rare because he
> would already know that this is the last verse in the chapter."

Do not roll into the next chapter. Do not blank the screen. Do nothing.

### How long the screen remembers

**There is no time limit.** It holds until he names another verse or
another chapter.

> "as long as 10 minutes, yes. Because he hasn't said another verse, he
> hasn't quoted another chapter... There's really no time limit because
> sometimes it could take time illustrating on a particular verse that was
> just read."

**Mentioning another verse is what clears it. Nothing else does.**

### Showing the same verse again

The screen will have moved on to something else by then. He says:

> "let's read that verse again, media"

So "the verse that was up" has to survive the screen showing something
else, and be recallable.

### The versions

**Downloaded and loaded in, not fetched from an API.**

> "this app is not for sale, so we can actually use it, and we have been
> using those Bible verses, so we can get them and use. We can download
> them online. There are a lot of places where they have it for free. Even
> if you check GitHub free repo... we don't even need API for this thing."

His decision, made twice. `DIRECTION.md` section 3 still holds: licensed
text goes in the swappable layer, so the day this ever becomes something
he sells, that layer is emptied and nothing else changes.

---

## 8. Still open

**Synonyms.** He was clear that every one of these has several forms:

> "You can still mention something like another translation... let's go to
> the previous verse. So all of these have synonyms. It's synonym way they
> say it. So there's a lot of anecdotes, nuances that are involved. So but
> it's with time."

So this file is not finished and is not meant to be. **Every service is a
chance to add a phrase that was actually said.** Add them here, in his
words, as they come.
