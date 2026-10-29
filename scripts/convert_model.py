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

THE LESSON THAT PRODUCED THIS VERSION
-------------------------------------
The first version called the ONNX exporter and the shrinker by hand. It
worked, and the result was wrong in a way that took five runs to see:

    decoder_model_merged_quantized.onnx is 738 MB

That file is supposed to be shrunk. It was not. The reason is that the
decoder is exported as a single graph holding two code paths, one for the
first word and one for every word after, wrapped in a branch. The shrinker
does not descend into branches, so it walked past most of the weights and
reported success.

**transformers.js ships its own converter for exactly this, and it knows.**
It is maintained by the same people who make the library the browser loads
the model with, so the output is right by construction rather than by my
guessing at flags.

So this script does not do the conversion any more. It drives theirs, then
checks and tidies the result. That is the whole change, and it is the
difference between a tool built for the job and a hand-rolled one.

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
        --output build/nigerian-whisper-small \\
        --converter /path/to/transformers.js

Sections
--------
  1. What was asked for
  2. Running their converter
  3. Keeping only what the browser loads
  4. Saying what came out, and whether it can be uploaded
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
    parser.add_argument(
        "--converter",
        required=True,
        help="Path to a checkout of huggingface/transformers.js",
    )
    parser.add_argument(
        "--keep-full-size",
        action="store_true",
        help="Also keep the unshrunk files. Only for comparing accuracy.",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# 2. Running their converter
# ---------------------------------------------------------------------------
#
# It writes into <converter>/models/<model id>/, which is why the output is
# fished out rather than named.

def convert(model_id, converter):
    print(f"Converting {model_id} with the transformers.js converter.")
    print("This downloads the model and takes a while.\n")

    subprocess.run(
        [
            sys.executable, "-m", "scripts.convert",
            "--quantize",
            "--model_id", model_id,
            "--task", "automatic-speech-recognition",
        ],
        cwd=str(converter),
        check=True,
    )

    produced = Path(converter) / "models" / model_id
    if not produced.is_dir():
        print(f"\nExpected the converter to write {produced}. It did not.")
        print("What it did write:")
        for item in sorted((Path(converter) / "models").rglob("*")):
            if item.is_dir():
                print(f"  {item}")
        raise SystemExit(1)

    return produced


# ---------------------------------------------------------------------------
# 3. Keeping only what the browser loads
# ---------------------------------------------------------------------------

SIDECARS = [
    "config.json",
    "generation_config.json",
    "preprocessor_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    "vocab.json",
    "merges.txt",
    "added_tokens.json",
    "normalizer.json",
]

WANTED_ONNX = [
    "encoder_model_quantized.onnx",
    "decoder_model_merged_quantized.onnx",
]


def keep_what_is_needed(produced, output, keep_full_size):
    output = Path(output)
    if output.exists():
        shutil.rmtree(output)
    (output / "onnx").mkdir(parents=True)

    for name in SIDECARS:
        found = produced / name
        if found.exists():
            shutil.copy2(found, output / name)
            print(f"  kept {name}")

    missing = []
    for name in WANTED_ONNX:
        found = produced / "onnx" / name
        if found.exists():
            shutil.copy2(found, output / "onnx" / name)
            print(f"  kept onnx/{name}")
        else:
            missing.append(name)

    if missing:
        print("\nThe converter did not produce the files the browser needs:")
        for name in missing:
            print(f"  {name}")
        print("\nWhat it did produce:")
        for item in sorted((produced / "onnx").glob("*")):
            print(f"  {item.name}  {item.stat().st_size / 1024 / 1024:.1f} MB")
        raise SystemExit(1)

    if keep_full_size:
        for item in sorted((produced / "onnx").glob("*.onnx")):
            if item.name not in WANTED_ONNX:
                shutil.copy2(item, output / "onnx" / item.name)
                print(f"  kept onnx/{item.name} (full size, for comparing)")

    return output


# ---------------------------------------------------------------------------
# 4. Saying what came out, and whether it can be uploaded
# ---------------------------------------------------------------------------

def report(output):
    total = 0
    too_big = []

    print("\nFinished. What the browser will download:")
    for path in sorted(output.rglob("*")):
        if not path.is_file():
            continue
        size = path.stat().st_size
        total += size
        megabytes = size / 1024 / 1024
        if megabytes > 100:
            print(f"  {megabytes:7.1f} MB  {path.relative_to(output)}")
        if megabytes > UPLOAD_LIMIT_MB:
            too_big.append((path.relative_to(output), megabytes))

    print(f"  {total / 1024 / 1024:7.1f} MB  in total")

    # Written down so models.js can carry the real number rather than a
    # guess copied from a blog post.
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
    produced = convert(options.model, options.converter)
    output = keep_what_is_needed(produced, options.output, options.keep_full_size)
    return report(output)


if __name__ == "__main__":
    sys.exit(main())
