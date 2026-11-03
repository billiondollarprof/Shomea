// src/listening/useMicrophone.js
//
// THE EAR. It opens the microphone, cuts the sound into phrases at the
// pauses, and hands each phrase to whoever asked for it.
//
// Sample rate
// -----------
// Every speech model here wants 16,000 samples a second. The browser
// usually gives 44,100 or 48,000. Rather than resampling by hand, the
// AudioContext is asked for 16,000 directly, which every current browser
// honours. If one refuses, the real rate is reported so the problem is
// visible instead of producing a transcript of nonsense.
//
// Why ScriptProcessorNode
// -----------------------
// It is marked deprecated, and the modern replacement is an AudioWorklet
// which needs a second file loaded from a URL. This one works on every
// browser this app will ever meet, including Safari on an iPhone, with no
// extra file. When the worklet path is proved on a real device, swap it.
// Do not swap it on principle.
//
// autoGainControl is OFF
// ----------------------
// On purpose. It turns the volume up when things go quiet, which between
// sentences means turning up the room. RESEARCH.md section 2.
//
// Sections
// --------
//   1. The settings that shape the audio
//   2. Opening and closing
//   3. Cutting the sound into phrases
//
// Where the cutting happens
// -------------------------
// Not here. It is in segmenter.js, which is plain code with its own tests.
// This file only feeds it sound and passes on what comes out. The first
// version cut the sound into fixed 5 second pieces on a clock, and that
// clipped the first word of phrases like "First John". Stopping listening
// throws away a phrase that was half said, on purpose: it would otherwise
// arrive after the other engine had taken over.

import { useCallback, useEffect, useRef, useState } from "react";
import { makeSegmenter } from "./segmenter.js";

// ---------------------------------------------------------------------------
// 1. The settings that shape the audio
// ---------------------------------------------------------------------------

const WANTED_RATE = 16000;

// ---------------------------------------------------------------------------
// 2. Opening and closing
// ---------------------------------------------------------------------------

export function useMicrophone({ onPiece }) {
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [rate, setRate] = useState(null);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const contextRef = useRef(null);
  const nodeRef = useRef(null);
  const sourceRef = useRef(null);
  const segmenterRef = useRef(null);
  const onPieceRef = useRef(onPiece);

  useEffect(() => {
    onPieceRef.current = onPiece;
  }, [onPiece]);

  const stop = useCallback(() => {
    if (nodeRef.current) {
      nodeRef.current.disconnect();
      nodeRef.current.onaudioprocess = null;
      nodeRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close().catch(() => {});
      contextRef.current = null;
    }
    segmenterRef.current = null;
    setLevel(0);
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const Context = window.AudioContext || window.webkitAudioContext;
      const context = new Context({ sampleRate: WANTED_RATE });
      contextRef.current = context;
      setRate(context.sampleRate);

      // A context that is created while the page is in the background can
      // start suspended. Waking it here saves a silent failure.
      if (context.state === "suspended") await context.resume();

      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;

      const node = context.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;

      // ---------------------------------------------------------------------
      // 3. Cutting the sound into pieces
      // ---------------------------------------------------------------------

      segmenterRef.current = makeSegmenter({ rate: context.sampleRate });

      node.onaudioprocess = (event) => {
        const incoming = event.inputBuffer.getChannelData(0);

        // Copy, because the browser reuses this buffer on the next tick and
        // the segmenter keeps slices of what it is given.
        const copy = new Float32Array(incoming);

        // Show the level, so somebody can see it is hearing them.
        let sum = 0;
        for (let i = 0; i < copy.length; i += 1) sum += copy[i] * copy[i];
        const rms = Math.sqrt(sum / copy.length);
        setLevel(Math.min(1, rms * 4));

        if (!segmenterRef.current) return;
        segmenterRef.current.push(copy).forEach((phrase) => {
          if (onPieceRef.current) onPieceRef.current(phrase);
        });
      };

      source.connect(node);

      // ScriptProcessorNode only runs when it is connected to something.
      // A gain of zero means nothing is played back, so there is no howl.
      const mute = context.createGain();
      mute.gain.value = 0;
      node.connect(mute);
      mute.connect(context.destination);

      setListening(true);
    } catch (problem) {
      setError(
        problem && problem.name === "NotAllowedError"
          ? "Permission was refused. Allow the microphone and try again."
          : `The microphone could not be opened. ${(problem && problem.message) || ""}`,
      );
      stop();
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { listening, level, rate, error, start, stop, wantedRate: WANTED_RATE };
}
