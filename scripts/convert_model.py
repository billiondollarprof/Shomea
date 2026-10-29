#!/usr/bin/env python3
"""Turn a Hugging Face Whisper model into something a browser can run.

WHY THIS EXISTS
---------------
The models trained on Nigerian speech are all PyTorch. A browser cannot run
PyTorch. It runs ONNX, through the ONNX runtime, which is what
transformers.js loads.

So every one of them has to be exported and shrunk before it is any use
here. That takes Python, several gigabytes of download and real compute.
It cannot happen on Anthony's phone and it cannot happen inside an agent
session, because huggingface.co is not reachable from there.

It happens on a GitHub Actions runner instead. See
.github/workflows/convert-model.yml.

THE BUG THAT TOOK SIX RUNS, AND THE FIX
--------------------------------------
Run 5 produced this:

    decoder_model_merged_quantized.onnx is 738 MB

That file is supposed to be shrunk. It was not, and the reason is worth
writing down because it is invisible otherwise.

The decoder is normally exported as **one graph holding two code paths**:
one for the first word, one for every word after, wrapped in a branch. The
shrinker walks the graph top to bottom and **does not go inside branches**.
So it stepped over almost every weight, found nothing to do, and reported
success. A confidently wrong answer.

Run 6 then tried transformers.js's own converter instead. That turned out
to have been deleted from their repository as unmaintained, and their README
now points back here. So there is no tool to borrow.

**The fix is to never hand the shrinker a branch.**

  1. Export WITHOUT merging, which gives two plain decoder graphs.
  2. Shrink each one. No branches, so nothing is stepped over.
  3. Merge the two shrunk graphs afterwards.

The merge is `optimum.onnx.merge_decoders`, which exists for this.
transformers.js only loads the merged name, so step 3 is not optional.

WHAT IT PRODUCES
----------------
The folder shape transformers.js expects:

    <output>/
      config.json
      generation_config.json
      preprocessor_config.json
      tokenizer.json
      tokenizer_config.json
      onnx/
        encoder_model_quantized.onnx
        decoder_model_merged_quantized.onnx

**Only the shrunk files.** Loading with dtype "q8" asks for the two names
ending in _quantized and nothing else, so the full size copies would be
stored and served for nobody.

RUNNING IT
----------
    python3 scripts/convert_model.py \\
        --model DivineAngel317/whisper-small-nigerian-accented-english \\
        --output build/nigerian-whisper-small

Sections
--------
  1. What was asked for
  2. Export, without merging
  3. Shrink each plain graph
  4. Merge the two shrunk decoders
  5. Put it in the shape transformers.js expects
  6. Saying what came out, and whether it can be uploaded
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


# Cloudflare's upload tool refuses anything above this. It is the only hard
# limit left: a church laptop and a modern phone both handle a few hundred
# megabytes without noticing.
UPLOAD_LIMIT_MB = 300


# ---------------------------------------------------------------------------
# 1. What was asked for
# ---------------------------------------------------------------------------

def read_arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--model",
        required=True,
        help="The Hugging Face model id",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Where to write the finished folder",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# 2. Export, without merging
# ---------------------------------------------------------------------------
#
# --no-post-process is the whole point. Without it the exporter merges the
# two decoder graphs into one wrapped in a branch, and the shrinker then
# cannot see inside it. See the header.

def export(model_id, into):
    print(f"Exporting {model_id}. This downloads the model and takes a while.")
    subprocess.run(
        [
            sys.executable, "-m", "optimum.exporters.onnx",
            "--model", model_id,
            "--task", "automatic-speech-recognition-with-past",
            "--no-post-process",
            "--opset", "14",
            str(into),
        ],
        check=True,
    )
    print("Export finished.\n")


# ---------------------------------------------------------------------------
# 3. Shrink each plain graph
# ---------------------------------------------------------------------------

def shrink(source, target):
    from onnxruntime.quantization import QuantType, quantize_dynamic

    before = source.stat().st_size / 1024 / 1024
    print(f"Shrinking {source.name} ({before:.0f} MB)")

    quantize_dynamic(
        model_input=str(source),
        model_output=str(target),
        weight_type=QuantType.QUInt8,
    )

    after = target.stat().st_size / 1024 / 1024
    print(f"  becomes {after:.0f} MB")

    # The whole bug was a shrink that did almost nothing and said it worked.
    # Never let that pass silently again.
    if after > before * 0.6:
        print("")
        print(f"  WARNING: {source.name} barely shrank. Expect about a quarter")
        print("  of the original. Something is being stepped over, most likely")
        print("  a branch in the graph. Read the header of this file.")

    return after


# ---------------------------------------------------------------------------
# 4. Merge the two shrunk decoders
# ---------------------------------------------------------------------------
#
# transformers.js only ever loads "decoder_model_merged", so this step is
# required rather than an optimisation. Checked against the library bundle
# on 2026-10-29: "decoder_with_past_model" appears in it zero times.

def merge(first, with_past, target):
    from optimum.onnx import merge_decoders

    print(f"Merging the two shrunk decoders into {target.name}")

    # strict=False, and it is not a loosening of a safety check.
    #
    # The two decoders are SUPPOSED to have different outputs. The first one
    # works out the encoder's key and value cache and hands it out. Every one
    # after reuses that cache, so it has nothing to hand out. Twenty four
    # outputs exist on one and not the other, by design.
    #
    # With the default strict=True the merge refuses on exactly that, which
    # is what run 7 hit. strict=False is the setting written for this case.
    merge_decoders(
        decoder=str(first),
        decoder_with_past=str(with_past),
        save_path=str(target),
        strict=False,
    )
    print(f"  {target.stat().st_size / 1024 / 1024:.0f} MB\n")


# ---------------------------------------------------------------------------
# 5. Put it in the shape transformers.js expects
# ---------------------------------------------------------------------------

# Files that come out of the export.
FROM_EXPORT = [
    "config.json",
    "generation_config.json",
    "preprocessor_config.json",
]

# THE TOKENIZER IS FETCHED FROM THE HUB, NOT TAKEN FROM THE EXPORT.
#
# Run 8 shipped a model with no tokenizer in it. The browser loaded it and
# died on:
#
#     Cannot read properties of undefined (reading 'tokenizer_class')
#
# The export simply had not written those files, and the old code copied
# "whatever it found", so finding nothing looked the same as success.
#
# The tokenizer is how the model's numbers turn back into words. Without it
# the model is useless, so it is fetched straight from the model's own page
# rather than hoped for, and its absence is fatal below.
FROM_HUB = [
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.json",
    "merges.txt",
    "special_tokens_map.json",
    "added_tokens.json",
    "normalizer.json",
]

# Without this one, nothing works. Checked explicitly.
MUST_HAVE = "tokenizer_config.json"


def fetch_tokenizer(model_id, output):
    """Take the tokenizer from the model's own page on the Hub."""
    import os

    from huggingface_hub import hf_hub_download
    from huggingface_hub.utils import EntryNotFoundError

    token = os.environ.get("HF_TOKEN") or None
    got = []

    for name in FROM_HUB:
        try:
            found = hf_hub_download(model_id, name, token=token)
            shutil.copy2(found, output / name)
            got.append(name)
            print(f"  fetched {name}")
        except EntryNotFoundError:
            # Not every model has every file. merges.txt and vocab.json are
            # absent when the tokenizer is the single-file kind.
            pass
        except Exception as problem:
            print(f"  could not fetch {name}: {problem}")

    if MUST_HAVE not in got:
        print(f"\n{model_id} has no {MUST_HAVE}.")
        print("")
        print("That file is how the model's numbers turn back into words.")
        print("Without it the browser loads the model and then dies on")
        print("'Cannot read properties of undefined'. This is exactly what")
        print("run 8 shipped, so it is a hard stop now.")
        print("")
        print(f"What was fetched: {got if got else 'nothing'}")
        raise SystemExit(1)

    return got


def arrange(exported, output, model_id):
    output = Path(output)
    if output.exists():
        shutil.rmtree(output)
    (output / "onnx").mkdir(parents=True)

    for name in FROM_EXPORT:
        found = exported / name
        if found.exists():
            shutil.copy2(found, output / name)
            print(f"  kept {name}")

    print("")
    fetch_tokenizer(model_id, output)
    print("")

    encoder = exported / "encoder_model.onnx"
    decoder = exported / "decoder_model.onnx"
    with_past = exported / "decoder_with_past_model.onnx"

    missing = [p.name for p in (encoder, decoder, with_past) if not p.exists()]
    if missing:
        print("\nThe exporter did not produce what was expected. Missing:")
        for name in missing:
            print(f"  {name}")
        print("\nWhat it did produce:")
        for item in sorted(exported.glob("*.onnx")):
            print(f"  {item.name}  {item.stat().st_size / 1024 / 1024:.0f} MB")
        raise SystemExit(1)

    print("")
    shrink(encoder, output / "onnx" / "encoder_model_quantized.onnx")

    # The two decoder halves are shrunk into a scratch folder, then merged
    # into the one name the browser asks for.
    scratch = exported / "_shrunk"
    scratch.mkdir(exist_ok=True)
    shrink(decoder, scratch / "decoder.onnx")
    shrink(with_past, scratch / "decoder_with_past.onnx")

    merge(
        scratch / "decoder.onnx",
        scratch / "decoder_with_past.onnx",
        output / "onnx" / "decoder_model_merged_quantized.onnx",
    )

    return output


# ---------------------------------------------------------------------------
# 6. Saying what came out, and whether it can be uploaded
# ---------------------------------------------------------------------------

def report(output):
    total = 0
    too_big = []

    print("What the browser will download:")
    for path in sorted(output.rglob("*")):
        if not path.is_file():
            continue
        size = path.stat().st_size
        total += size
        megabytes = size / 1024 / 1024
        if megabytes > 10:
            print(f"  {megabytes:7.1f} MB  {path.relative_to(output)}")
        if megabytes > UPLOAD_LIMIT_MB:
            too_big.append((path.relative_to(output), megabytes))

    print(f"  {total / 1024 / 1024:7.1f} MB  in total")

    (output / "SIZE.json").write_text(
        json.dumps({
            "totalBytes": total,
            "totalMegabytes": round(total / 1024 / 1024, 1),
        }),
        encoding="utf-8",
    )

    if too_big:
        print("\nTOO BIG TO UPLOAD. Cloudflare refuses a single file over "
              f"{UPLOAD_LIMIT_MB} MB:")
        for name, megabytes in too_big:
            print(f"  {megabytes:.0f} MB  {name}")
        print("\nThis is an upload limit, not a device limit. A church laptop")
        print("and a modern phone both handle this size without noticing.")
        return 1

    return 0


def main():
    options = read_arguments()

    workspace = Path("build/_export")
    if workspace.exists():
        shutil.rmtree(workspace)
    workspace.mkdir(parents=True)

    export(options.model, workspace)
    output = arrange(workspace, options.output, options.model)
    return report(output)


if __name__ == "__main__":
    sys.exit(main())
