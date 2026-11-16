import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCameraStream,
  stopMediaStream,
} from "../services/mediaDevices.service";

const useCamera = () => {
  const streamRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Activate camera or switch to another camera
  const activateCamera = useCallback(async (deviceId) => {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const newStream = await getCameraStream(deviceId);

      // Ignore outdated requests or requests completed after unmount
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        stopMediaStream(newStream, "video");
        return null;
      }

      const newTrack = newStream.getVideoTracks()[0];

      if (!newTrack || newTrack.readyState !== "live") {
        stopMediaStream(newStream, "video");
        throw new Error("CAMERA_TRACK_NOT_AVAILABLE");
      }

      // Stop previous stream only after successful acquisition
      stopMediaStream(streamRef.current, "video");

      streamRef.current = newStream;
      setCameraStream(newStream);
      setIsCameraOn(newTrack.enabled);

      // Handle unexpected track termination
      newTrack.addEventListener(
        "ended",
        () => {
          if (streamRef.current !== newStream) return;

          streamRef.current = null;
          setCameraStream(null);
          setIsCameraOn(false);
          setError("CAMERA_TRACK_ENDED");
        },
        { once: true },
      );

      return newStream;
    } catch (err) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(err.name || err.message || "UNKNOWN_CAMERA_ERROR");

        const currentTrack = streamRef.current?.getVideoTracks()[0];

        setIsCameraOn(
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

  // Enable or disable camera without stopping its track
  const setCameraEnabled = useCallback(
    async (enabled) => {
      const currentTrack = streamRef.current?.getVideoTracks()[0];

      if (!currentTrack || currentTrack.readyState !== "live") {
        if (enabled) {
          return activateCamera();
        }

        setIsCameraOn(false);
        return null;
      }

      currentTrack.enabled = enabled;
      setIsCameraOn(currentTrack.enabled);

      return streamRef.current;
    },
    [activateCamera],
  );

  const toggleCamera = useCallback(() => {
    return setCameraEnabled(!isCameraOn);
  }, [isCameraOn, setCameraEnabled]);

  // Release camera resources
  const releaseCamera = useCallback(() => {
    requestIdRef.current += 1;

    stopMediaStream(streamRef.current, "video");

    streamRef.current = null;

    setCameraStream(null);
    setIsCameraOn(false);
    setIsLoading(false);
    setError(null);
  }, []);

  // Hook lifecycle
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;

      stopMediaStream(streamRef.current, "video");
      streamRef.current = null;
    };
  }, []);

  return {
    cameraStream,
    isCameraOn,
    isLoading,
    error,
    activateCamera,
    setCameraEnabled,
    toggleCamera,
    releaseCamera,
  };
};

export default useCamera;
