// src/listening/useTranscriber.js
//
// THE PAGE'S SIDE OF THE WORKER. It loads a model, sends audio, and hands
// back what came out.
//
// Only one piece of audio is worked on at a time. A piece is now a whole
// phrase (see segmenter.js), so a second phrase that arrives while the model
// is busy WAITS its turn and is not thrown away: dropping one could drop
// "the next verse". The queue is short, and a piece that has waited longer
// than STALE_AFTER_MS is dropped, because a verse that arrives half a minute
// late is worse than none. Fresh audio is still worth more than a backlog.
//
// Sections
// --------
//   1. Starting the worker
//   2. Loading a model
//   3. Sending audio, one piece at a time
//   4. What comes back

import { useCallback, useEffect, useRef, useState } from "react";

// How many phrases may wait, and how long one may wait before it is stale.
const MOST_WAITING = 3;
const STALE_AFTER_MS = 15000;

export function useTranscriber({ onResult, onFailure }) {
  const [status, setStatus] = useState("cold");
  const [progress, setProgress] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [busy, setBusy] = useState(false);

  const workerRef = useRef(null);
  const waitingRef = useRef([]);
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
      if (busyRef.current) return;
      const now = Date.now();
      waitingRef.current = waitingRef.current.filter(
        (one) => now - one.offeredAt <= STALE_AFTER_MS,
      );
      const waiting = waitingRef.current.shift();
      if (!waiting) return;
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
        setProgress({
          percent: message.percent,
          loadedMegabytes: message.loadedMegabytes,
          totalMegabytes: message.totalMegabytes,
        });
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

  const offer = useCallback(({ audio, modelId, rms, seconds, room, bar }) => {
    if (!workerRef.current) return null;
    const id = nextIdRef.current;
    nextIdRef.current += 1;

    waitingRef.current.push({
      id,
      audio,
      modelId,
      rms,
      seconds,
      room,
      bar,
      offeredAt: Date.now(),
    });
    // If the queue is full the OLDEST goes, because the newest is the one
    // somebody just said.
    while (waitingRef.current.length > MOST_WAITING) waitingRef.current.shift();
    workerRef.current.__send();
    return id;
  }, []);

  return { status, progress, loaded, busy, load, offer };
}
