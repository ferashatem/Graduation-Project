import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { getStoredAccessToken } from "../auth/session";

const HUB_URL =
  "https://universitymanagementsystem-production-e58e.up.railway.app/hubs/notifications";

/**
 * Subscribes to lecture recording SignalR events.
 * @param {object} handlers
 *   .onStatusChanged(data)      – { recordingId, status, error? }
 *   .onTranscriptionCompleted(data) – { recordingId }
 *   .onAnalysisCompleted(data)  – { recordingId }
 *   .onFlashcardsGenerated(data) – { recordingId, count }
 *   .onQuizGenerated(data)      – { recordingId, count }
 */
export function useRecordingSignalR(handlers = {}) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getStoredAccessToken(),
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.on("LectureStatusChanged", (data) =>
      handlersRef.current.onStatusChanged?.(data)
    );
    connection.on("TranscriptionCompleted", (data) =>
      handlersRef.current.onTranscriptionCompleted?.(data)
    );
    connection.on("AnalysisCompleted", (data) =>
      handlersRef.current.onAnalysisCompleted?.(data)
    );
    connection.on("FlashcardsGenerated", (data) =>
      handlersRef.current.onFlashcardsGenerated?.(data)
    );
    connection.on("QuizGenerated", (data) =>
      handlersRef.current.onQuizGenerated?.(data)
    );

    connection.start().catch(() => {});

    return () => {
      connection.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
