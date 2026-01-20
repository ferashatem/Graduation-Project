import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceDetector,
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useAuth } from "../../context/AuthContext";
import { pushEngagement } from "../../firebase/attendanceFunctions";
import { getErrorMessage } from "../../utils/errorHelpers";

const VISION_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm";
const FACE_DETECTOR_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/short_range/float16/face_detector.task";
const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/face_landmarker.task";

const SAMPLE_INTERVAL_MS = 1000;
const FLUSH_AFTER_SAMPLES = 10;
const NOSE_CENTER_THRESHOLD = 0.15;

const resolveNoseX = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length === 0) return null;
  const candidate = landmarks[1] || landmarks[4] || landmarks[0];
  if (!candidate || typeof candidate.x !== "number") return null;
  return candidate.x;
};

function EngagementTracker({ sessionId, offeringId }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const countsRef = useRef({
    samples: 0,
    focused: 0,
    distracted: 0,
    away: 0,
  });

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const flushCounts = useCallback(async () => {
    const { samples, focused, distracted, away } = countsRef.current;
    if (!samples) return;

    if (!sessionId || !user?.uid) {
      countsRef.current = { samples: 0, focused: 0, distracted: 0, away: 0 };
      return;
    }

    if (!offeringId) {
      console.warn("EngagementTracker missing offeringId; skipping upload.");
      countsRef.current = { samples: 0, focused: 0, distracted: 0, away: 0 };
      return;
    }

    try {
      await pushEngagement({
        sessionId,
        offeringId,
        studentId: user.uid,
        focusedCount: focused,
        distractedCount: distracted,
        awayCount: away,
        samplesCount: samples,
      });
    } catch (err) {
      console.error("pushEngagement failed", err);
    } finally {
      countsRef.current = { samples: 0, focused: 0, distracted: 0, away: 0 };
    }
  }, [offeringId, sessionId, user?.uid]);

  const analyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const landmarker = landmarkerRef.current;
    if (!landmarker) return;

    const now = performance.now();
    const landmarkerResult = await landmarker.detectForVideo(video, now);
    const detectorResult = detectorRef.current
      ? await detectorRef.current.detectForVideo(video, now)
      : null;

    const landmarks = landmarkerResult?.faceLandmarks?.[0] || [];
    const hasFace =
      landmarks.length > 0 ||
      (detectorResult?.detections && detectorResult.detections.length > 0);

    let nextState = "away";
    if (hasFace) {
      const noseX = resolveNoseX(landmarks);
      if (noseX === null) {
        nextState = "distracted";
      } else {
        const offset = Math.abs(noseX - 0.5);
        nextState = offset <= NOSE_CENTER_THRESHOLD ? "focused" : "distracted";
      }
    }

    setStatus(nextState);

    countsRef.current.samples += 1;
    if (nextState === "focused") countsRef.current.focused += 1;
    if (nextState === "distracted") countsRef.current.distracted += 1;
    if (nextState === "away") countsRef.current.away += 1;

    if (countsRef.current.samples >= FLUSH_AFTER_SAMPLES) {
      await flushCounts();
    }
  }, [flushCounts]);

  useEffect(() => {
    let isActive = true;

    const setupVision = async () => {
      if (!sessionId || !user?.uid) return;
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError("Camera access is not available in this browser.");
        return;
      }

      try {
        setError("");
        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_DETECTOR_MODEL_URL },
          runningMode: "VIDEO",
        });
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        detectorRef.current = detector;
        landmarkerRef.current = landmarker;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setReady(true);
        intervalRef.current = setInterval(analyzeFrame, SAMPLE_INTERVAL_MS);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to start engagement tracking."));
      }
    };

    setupVision();

    return () => {
      isActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (landmarkerRef.current?.close) {
        landmarkerRef.current.close();
      }
      if (detectorRef.current?.close) {
        detectorRef.current.close();
      }
      landmarkerRef.current = null;
      detectorRef.current = null;
      flushCounts();
    };
  }, [analyzeFrame, flushCounts, sessionId, user?.uid]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Engagement Tracker
          </h3>
          <p className="text-xs text-slate-500">
            Aggregates focus every 10 seconds. No video is stored.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
          {ready ? status : "starting"}
        </span>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <video
          ref={videoRef}
          className="h-28 w-36 rounded-xl border border-slate-200 bg-slate-100 object-cover"
          muted
          playsInline
        />
        <div className="text-xs text-slate-500">
          Camera runs locally to estimate focus. Counts are aggregated only.
        </div>
      </div>
    </div>
  );
}

export default EngagementTracker;
