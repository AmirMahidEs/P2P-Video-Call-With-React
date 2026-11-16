import { useCallback, useEffect, useRef, useState } from "react";

import {
  getMicrophoneStream,
  stopMediaStream,
} from "../services/mediaDevices.service";

const useMicrophone = () => {
  const streamRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const [microphoneStream, setMicrophoneStream] = useState(null);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Activate microphone or switch to another microphone
  const activateMicrophone = useCallback(async (deviceId) => {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const newStream = await getMicrophoneStream(deviceId);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        stopMediaStream(newStream, "audio");
        return null;
      }

      const newTrack = newStream.getAudioTracks()[0];

      if (!newTrack || newTrack.readyState !== "live") {
        stopMediaStream(newStream, "audio");
        throw new Error("MICROPHONE_TRACK_NOT_AVAILABLE");
      }

      // Stop previous stream after successful acquisition
      stopMediaStream(streamRef.current, "audio");

      streamRef.current = newStream;
      setMicrophoneStream(newStream);
      setIsMicrophoneOn(newTrack.enabled);

      // Handle unexpected track termination
      newTrack.addEventListener(
        "ended",
        () => {
          if (streamRef.current !== newStream) return;

          streamRef.current = null;
          setMicrophoneStream(null);
          setIsMicrophoneOn(false);
          setError("MICROPHONE_TRACK_ENDED");
        },
        { once: true },
      );

      return newStream;
    } catch (err) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(err.name || err.message || "UNKNOWN_MICROPHONE_ERROR");

        const currentTrack = streamRef.current?.getAudioTracks()[0];

        setIsMicrophoneOn(
          Boolean(
            currentTrack &&
            currentTrack.readyState === "live" &&
            currentTrack.enabled,
          ),
        );
      }

      return null;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Enable or disable microphone without stopping its track
  const setMicrophoneEnabled = useCallback(
    async (enabled) => {
      const currentTrack = streamRef.current?.getAudioTracks()[0];

      if (!currentTrack || currentTrack.readyState !== "live") {
        if (enabled) {
          return activateMicrophone();
        }

        setIsMicrophoneOn(false);
        return null;
      }

      currentTrack.enabled = enabled;
      setIsMicrophoneOn(currentTrack.enabled);

      return streamRef.current;
    },
    [activateMicrophone],
  );

  const toggleMicrophone = useCallback(() => {
    return setMicrophoneEnabled(!isMicrophoneOn);
  }, [isMicrophoneOn, setMicrophoneEnabled]);

  // Release microphone resources
  const releaseMicrophone = useCallback(() => {
    requestIdRef.current += 1;

    stopMediaStream(streamRef.current, "audio");

    streamRef.current = null;

    setMicrophoneStream(null);
    setIsMicrophoneOn(false);
    setIsLoading(false);
    setError(null);
  }, []);

  // Hook lifecycle
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;

      stopMediaStream(streamRef.current, "audio");
      streamRef.current = null;
    };
  }, []);

  return {
    microphoneStream,
    isMicrophoneOn,
    isLoading,
    error,
    activateMicrophone,
    setMicrophoneEnabled,
    toggleMicrophone,
    releaseMicrophone,
  };
};

export default useMicrophone;
