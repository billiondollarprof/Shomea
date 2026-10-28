#!/usr/bin/env python3
"""Check the rules in CLAUDE.md that a machine can check.

WHY THIS EXISTS
---------------
CLAUDE.md holds the rules for writing in this project. Rules that live only
in a document get followed for a week and then quietly stop. These ones are
checkable, so they are checked on every push and nobody has to remember
them.

It checks four things, and nothing it cannot be sure about. A checker that
cries wolf gets switched off, and then it is worth less than no checker.

  1. No em dashes. Anywhere. CLAUDE.md: "No em dashes, ever."
  2. Every source file opens with a header saying what it is.
  3. No machinery words in anything a user reads.
  4. British spelling in the documents.

HOW TO RUN IT
-------------
    python3 scripts/check_house_rules.py

It prints every problem it finds and exits 1 if there were any, which is
what makes the build go red.

ADDING A CHECK
--------------
Only add one if it cannot be wrong. If a rule needs judgement, it belongs
in CLAUDE.md for a person to apply, not here.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {"node_modules", "dist", ".git", ".github"}


def walk(suffixes):
    """Every file in the project with one of these endings."""
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix in suffixes:
            yield path


def shown(path):
    return str(path.relative_to(ROOT))


# ---------------------------------------------------------------------------
# 1. No em dashes
# ---------------------------------------------------------------------------
#
# Anthony's rule and he means it. An em dash is the long one. A hyphen is
# fine where a word genuinely needs one.

def check_no_em_dashes(problems):
    for path in walk({".md", ".js", ".jsx", ".css", ".html", ".json", ".py"}):
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            # Built from code points so this file contains none itself.
            if chr(0x2014) in line or chr(0x2013) in line:
                problems.append(
                    f"{shown(path)}:{number} has a dash that is not a hyphen. "
                    f"Use a hyphen, a comma, or two sentences."
                )


# ---------------------------------------------------------------------------
# 2. Every source file opens with a header
# ---------------------------------------------------------------------------
#
# CLAUDE.md: "A header at the top of every file, saying what this is, why it
# exists, and what it must never do."
#
# A machine cannot judge whether a header is any good. It can insist there
# is one, and that it says more than the filename.

MIN_HEADER_LINES = 4


def check_file_headers(problems):
    for path in walk({".js", ".jsx"}):
        if "src" not in path.parts and "scripts" not in path.parts:
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        comment_lines = 0
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
                comment_lines += 1
                continue
            if stripped == "":
                continue
            break
        if comment_lines < MIN_HEADER_LINES:
            problems.append(
                f"{shown(path)} has no proper header. Say what it is, why it "
                f"exists, and what it must never do. At least "
                f"{MIN_HEADER_LINES} lines."
            )


# ---------------------------------------------------------------------------
# 3. No machinery words in anything a user reads
# ---------------------------------------------------------------------------
#
# DIRECTION.md section 4. The person switching this on before a service is a
# volunteer. They should never meet these words.
#
# Only text inside quotes is checked, and only in the screens. Comments
# explain the machinery on purpose and are left alone.

MACHINERY = [
    "embedding", "vector", "RAG", "inference", "WebGPU", "WASM",
    "WebAssembly", "ONNX", "quantis", "quantiz", "tokeniz", "localStorage",
    "IndexedDB", "endpoint", "API key",
]

QUOTED = re.compile(r'"([^"\\]{4,})"')

# TWO WAYS TO SAY "I MEANT THAT", because some of these words are not being
# shown to anybody.
#
#   plain-words-exception: <reason>   in a file header, excuses the file
#   // plain-words-ok: <reason>       at the end of a line, excuses the line
#
# Both need a reason written next to them. An opt-out with no reason is how
# a check quietly stops meaning anything.

FILE_EXCUSE = "plain-words-exception:"
LINE_EXCUSE = "plain-words-ok:"


def check_plain_words(problems):
    for path in walk({".jsx"}):
        if "screens" not in path.parts and path.name != "App.jsx":
            continue
        text = path.read_text(encoding="utf-8")
        if FILE_EXCUSE in text:
            continue
        for number, line in enumerate(text.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("/*"):
                continue
            if LINE_EXCUSE in line:
                continue
            for found in QUOTED.findall(line):
                for word in MACHINERY:
                    if word.lower() in found.lower():
                        problems.append(
                            f'{shown(path)}:{number} shows "{word}" to a user. '
                            f"DIRECTION.md section 4: plain words on every screen."
                        )


# ---------------------------------------------------------------------------
# 4. British spelling in the documents
# ---------------------------------------------------------------------------
#
# Only the documents. Code uses "color" because CSS does, and that is not a
# spelling mistake, it is the language.

AMERICAN = {
    "color": "colour",
    "colors": "colours",
    "behavior": "behaviour",
    "realize": "realise",
    "realized": "realised",
    "organize": "organise",
    "recognized": "recognised",
    "analyze": "analyse",
    "center": "centre",
    "favorite": "favourite",
}


def check_british_spelling(problems):
    for path in walk({".md"}):
        text = path.read_text(encoding="utf-8")
        for number, line in enumerate(text.splitlines(), 1):
            # Skip code spans and fenced code, where the American spelling
            # is usually a real property name.
            if "`" in line or line.startswith("    "):
                continue
            for wrong, right in AMERICAN.items():
                if re.search(rf"\b{wrong}\b", line, re.IGNORECASE):
                    problems.append(
                        f'{shown(path)}:{number} says "{wrong}". '
                        f'British English: "{right}".'
                    )


# ---------------------------------------------------------------------------
# Running them all
# ---------------------------------------------------------------------------

def main():
    problems = []
    check_no_em_dashes(problems)
    check_file_headers(problems)
    check_plain_words(problems)
    check_british_spelling(problems)

    if not problems:
        print("House rules: all clear.")
        return 0

    print(f"House rules: {len(problems)} problem(s).\n")
    for problem in problems:
        print(f"  {problem}")
    print("\nThe rules are in CLAUDE.md and DIRECTION.md.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
