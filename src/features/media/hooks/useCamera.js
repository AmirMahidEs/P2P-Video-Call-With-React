import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCameraStream,
  stopMediaStream,
} from "../services/mediaDevices.service";

const useCamera = () => {
  // References
  const streamRef = useRef(null);
  const requestIdRef = useRef(0);
  const ensurePromiseRef = useRef(null);
  const mountedRef = useRef(true);

  // States
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

      // Stop previous camera stream after getting the new one
      stopMediaStream(streamRef.current, "video");

      // Update stream reference and state
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
        setError(
          err.name && err.name !== "Error"
            ? err.name
            : err.message || "UNKNOWN_CAMERA_ERROR",
        );

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

  // Ensure camera has a live track
  const ensureCamera = useCallback(() => {
    const currentTrack = streamRef.current?.getVideoTracks()[0];

    // Return existing stream if camera is already available
    if (currentTrack && currentTrack.readyState === "live") {
      return Promise.resolve(streamRef.current);
    }

    // Prevent duplicate simultaneous initialization requests
    if (ensurePromiseRef.current) {
      return ensurePromiseRef.current;
    }

    const initializationPromise = activateCamera();

    ensurePromiseRef.current = initializationPromise;

    initializationPromise.then(() => {
      if (ensurePromiseRef.current === initializationPromise) {
        ensurePromiseRef.current = null;
      }
    });

    return initializationPromise;
  }, [activateCamera]);

  // Enable or disable camera without stopping its track
  const setCameraEnabled = useCallback(
    (enabled) => {
      const currentTrack = streamRef.current?.getVideoTracks()[0];

      if (!currentTrack || currentTrack.readyState !== "live") {
        if (enabled) {
          return ensureCamera();
        }

        setIsCameraOn(false);
        return null;
      }

      currentTrack.enabled = enabled;
      setIsCameraOn(currentTrack.enabled);

      return streamRef.current;
    },
    [ensureCamera],
  );

  // Toggle camera state
  const toggleCamera = useCallback(() => {
    const currentTrack = streamRef.current?.getVideoTracks()[0];

    const nextEnabled = currentTrack ? !currentTrack.enabled : true;

    return setCameraEnabled(nextEnabled);
  }, [setCameraEnabled]);

  // Release camera resources
  const releaseCamera = useCallback(() => {
    requestIdRef.current += 1;
    ensurePromiseRef.current = null;

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
      ensurePromiseRef.current = null;

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
    ensureCamera,
    setCameraEnabled,
    toggleCamera,
    releaseCamera,
  };
};

export default useCamera;
