// src/listening/useTranscriber.js
//
// THE PAGE'S SIDE OF THE WORKER. It loads a model, sends audio, and hands
// back what came out.
//
// Only one piece of audio is worked on at a time. If a new piece arrives
// while the model is busy, the newest one waits and any older waiting piece
// is thrown away. That is deliberate: in a live room, fresh audio is worth
// more than a backlog, and a queue that grows never catches up.
//
// Sections
// --------
//   1. Starting the worker
//   2. Loading a model
//   3. Sending audio, one piece at a time
//   4. What comes back

import { useCallback, useEffect, useRef, useState } from "react";

export function useTranscriber({ onResult, onFailure }) {
  const [status, setStatus] = useState("cold");
  const [progress, setProgress] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [busy, setBusy] = useState(false);

  const workerRef = useRef(null);
  const waitingRef = useRef(null);
  const busyRef = useRef(false);
  const nextIdRef = useRef(1);
  const inFlightRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onFailureRef = useRef(onFailure);

  useEffect(() => {
    onResultRef.current = onResult;
    onFailureRef.current = onFailure;
  }, [onResult, onFailure]);

  // -------------------------------------------------------------------------
  // 1. Starting the worker
  // -------------------------------------------------------------------------

  useEffect(() => {
    const worker = new Worker(
      new URL("./transcriber.worker.js", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    const send = () => {
      const waiting = waitingRef.current;
      if (!waiting || busyRef.current) return;
      waitingRef.current = null;
      busyRef.current = true;
      setBusy(true);
      inFlightRef.current = waiting;
      worker.postMessage(
        {
          type: "transcribe",
          id: waiting.id,
          audio: waiting.audio,
          modelId: waiting.modelId,
        },
        [waiting.audio.buffer],
      );
    };

    // -----------------------------------------------------------------------
    // 4. What comes back
    // -----------------------------------------------------------------------

    worker.onmessage = (event) => {
      const message = event.data;
      if (!message) return;

      if (message.type === "loading") {
        setStatus("loading");
        setProgress(null);
      } else if (message.type === "progress") {
        if (message.total) {
          setProgress({
            file: message.file,
            percent: Math.round((message.loaded / message.total) * 100),
          });
        }
      } else if (message.type === "ready") {
        setStatus("ready");
        setProgress(null);
        setLoaded({
          modelId: message.modelId,
          device: message.device,
          dtype: message.dtype,
        });
      } else if (message.type === "result") {
        busyRef.current = false;
        setBusy(false);
        const sent = inFlightRef.current;
        inFlightRef.current = null;
        if (onResultRef.current) {
          onResultRef.current({
            text: message.text,
            milliseconds: message.milliseconds,
            sent,
          });
        }
        send();
      } else if (message.type === "failed") {
        if (message.stage === "load") {
          setStatus("failed");
          setProgress(null);
        }
        busyRef.current = false;
        setBusy(false);
        inFlightRef.current = null;
        if (onFailureRef.current) onFailureRef.current(message);
        send();
      }
    };

    worker.onerror = (problem) => {
      setStatus("failed");
      if (onFailureRef.current) {
        onFailureRef.current({
          stage: "worker",
          message: problem && problem.message ? problem.message : "The worker stopped.",
        });
      }
    };

    // Keep a reference to send, so offer() below can reach it.
    worker.__send = send;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------------
  // 2. Loading a model
  // -------------------------------------------------------------------------

  const load = useCallback(({ modelId, device, dtype }) => {
    if (!workerRef.current) return;
    setStatus("loading");
    workerRef.current.postMessage({ type: "load", modelId, device, dtype });
  }, []);

  // -------------------------------------------------------------------------
  // 3. Sending audio, one piece at a time
  // -------------------------------------------------------------------------

  const offer = useCallback(({ audio, modelId, rms, seconds }) => {
    if (!workerRef.current) return null;
    const id = nextIdRef.current;
    nextIdRef.current += 1;

    // The newest piece wins. An older one still waiting is dropped.
    waitingRef.current = {
      id,
      audio,
      modelId,
      rms,
      seconds,
      offeredAt: Date.now(),
    };
    workerRef.current.__send();
    return id;
  }, []);

  return { status, progress, loaded, busy, load, offer };
}
