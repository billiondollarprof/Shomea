#!/usr/bin/env python3
"""Turn a Hugging Face Whisper model into something a browser can run.

WHY THIS EXISTS
---------------
The models trained on Nigerian speech are all PyTorch. A browser cannot run
PyTorch. It runs ONNX, through the ONNX runtime, which is what
transformers.js loads.

So every one of them has to be exported and shrunk before it is any use
here. That takes Python, several gigabytes of download, and real compute.
It cannot happen on Anthony's phone and it cannot happen inside an agent
session, because huggingface.co is not reachable from there.

It happens on a GitHub Actions runner instead, which can reach Hugging Face
and has the disk to do it. See .github/workflows/convert-model.yml.

WHAT IT PRODUCES
----------------
The exact folder shape transformers.js expects:

    <output>/
      config.json
      generation_config.json
      preprocessor_config.json
      tokenizer.json
      tokenizer_config.json
      onnx/
        encoder_model.onnx
        decoder_model_merged.onnx
        encoder_model_quantized.onnx
        decoder_model_merged_quantized.onnx

Loading with dtype "q8" picks the two files ending in _quantized.

THE ONE DECISION WORTH KNOWING ABOUT
------------------------------------
**Only the decoder is shrunk. The encoder is left at full precision.**

Other people converting fine-tuned Whisper models have found that shrinking
the encoder costs real accuracy, while shrinking the decoder costs almost
none and saves most of the size. The encoder is also the smaller half.

So the default here keeps the encoder honest. If a future measurement shows
the accuracy holds, --quantise-encoder turns it on, and the result gets
compared rather than assumed.

RUNNING IT
----------
    python3 scripts/convert_model.py \\
        --model NCAIR1/NigerianAccentedEnglish \\
        --output build/nigerian-whisper-small
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# 1. What was asked for
# ---------------------------------------------------------------------------

def read_arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--model",
        required=True,
        help="The Hugging Face model id, for example NCAIR1/NigerianAccentedEnglish",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Where to write the finished folder",
    )
    parser.add_argument(
        "--quantise-encoder",
        action="store_true",
        help="Shrink the encoder too. Off by default, because it costs accuracy.",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# 2. Export to ONNX
# ---------------------------------------------------------------------------
#
# "with-past" means the decoder keeps what it has already worked out between
# steps instead of starting again, which is the difference between usable
# and unusably slow.

def export(model_id, into):
    print(f"Exporting {model_id}. This downloads the model and takes a while.")
    subprocess.run(
        [
            sys.executable, "-m", "optimum.exporters.onnx",
            "--model", model_id,
            "--task", "automatic-speech-recognition-with-past",
            "--opset", "14",
            str(into),
        ],
        check=True,
    )
    print("Export finished.")


# ---------------------------------------------------------------------------
# 3. Shrink it
# ---------------------------------------------------------------------------

def quantise(source, target):
    from onnxruntime.quantization import QuantType, quantize_dynamic

    print(f"Shrinking {source.name}")
    quantize_dynamic(
        model_input=str(source),
        model_output=str(target),
        weight_type=QuantType.QUInt8,
        # Whisper's attention blocks do not survive this one well, and
        # leaving it off costs almost nothing in size.
        extra_options={"MatMulConstBOnly": True},
    )
    before = source.stat().st_size / 1024 / 1024
    after = target.stat().st_size / 1024 / 1024
    print(f"  {before:.1f} MB becomes {after:.1f} MB")


# ---------------------------------------------------------------------------
# 4. Put it in the shape transformers.js expects
# ---------------------------------------------------------------------------
#
# The exporter writes everything flat. transformers.js wants the model files
# in an onnx/ folder and the rest beside it.

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


def arrange(exported, output, quantise_encoder):
    output = Path(output)
    if output.exists():
        shutil.rmtree(output)
    (output / "onnx").mkdir(parents=True)

    for name in SIDECARS:
        found = exported / name
        if found.exists():
            shutil.copy2(found, output / name)
            print(f"  kept {name}")

    encoder = exported / "encoder_model.onnx"
    decoder = exported / "decoder_model_merged.onnx"

    if not encoder.exists() or not decoder.exists():
        print("\nThe exporter did not produce the two files expected.")
        print("What it did produce:")
        for item in sorted(exported.glob("*.onnx")):
            print(f"  {item.name}")
        raise SystemExit(1)

    shutil.copy2(encoder, output / "onnx" / "encoder_model.onnx")
    shutil.copy2(decoder, output / "onnx" / "decoder_model_merged.onnx")

    quantise(decoder, output / "onnx" / "decoder_model_merged_quantized.onnx")

    if quantise_encoder:
        quantise(encoder, output / "onnx" / "encoder_model_quantized.onnx")
    else:
        # transformers.js asks for the _quantized name when dtype is q8, so
        # the full precision encoder is given that name. It is not a trick:
        # the file that gets loaded is the honest one, and that is the point.
        shutil.copy2(encoder, output / "onnx" / "encoder_model_quantized.onnx")
        print("  encoder left at full precision, on purpose")

    return output


# ---------------------------------------------------------------------------
# 5. Say what came out
# ---------------------------------------------------------------------------

def report(output):
    total = 0
    print("\nFinished. What the browser will download:")
    for path in sorted(output.rglob("*")):
        if path.is_file():
            size = path.stat().st_size
            total += size
            if size > 1024 * 100:
                print(f"  {size / 1024 / 1024:7.1f} MB  {path.relative_to(output)}")
    print(f"  {total / 1024 / 1024:7.1f} MB  in total")

    # Written down so the number in models.js can be the real one rather
    # than a guess copied from a blog post.
    (output / "SIZE.json").write_text(
        json.dumps({"totalBytes": total, "totalMegabytes": round(total / 1024 / 1024, 1)}),
        encoding="utf-8",
    )


def main():
    options = read_arguments()
    workspace = Path("build/_export")
    if workspace.exists():
        shutil.rmtree(workspace)
    workspace.mkdir(parents=True)

    export(options.model, workspace)
    output = arrange(workspace, options.output, options.quantise_encoder)
    report(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
