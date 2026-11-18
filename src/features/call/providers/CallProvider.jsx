import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useCamera from "../../media/hooks/useCamera";
import useMicrophone from "../../media/hooks/useMicrophone";

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const camera = useCamera();
  const microphone = useMicrophone();

  const [isInitializingMedia, setIsInitializingMedia] = useState(false);

  const initializationRef = useRef(null);
  const mountedRef = useRef(true);

  // Initialize camera and microphone independently and in parallel
  const initializeMedia = useCallback(() => {
    // Prevent duplicate simultaneous initialization
    if (initializationRef.current) {
      return initializationRef.current;
    }

    setIsInitializingMedia(true);

    const initializationPromise = Promise.allSettled([
      camera.ensureCamera(),
      microphone.ensureMicrophone(),
    ]);

    initializationRef.current = initializationPromise;

    initializationPromise.then(() => {
      // Ignore outdated initialization requests
      if (initializationRef.current !== initializationPromise) {
        return;
      }

      initializationRef.current = null;

      if (mountedRef.current) {
        setIsInitializingMedia(false);
      }
    });

    return initializationPromise;
  }, [camera.ensureCamera, microphone.ensureMicrophone]);

  // Release both media devices
  const releaseMedia = useCallback(() => {
    // Invalidate current initialization
    initializationRef.current = null;

    camera.releaseCamera();
    microphone.releaseMicrophone();

    setIsInitializingMedia(false);
  }, [camera.releaseCamera, microphone.releaseMicrophone]);

  // Provider lifecycle
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Invalidate initialization during cleanup
      initializationRef.current = null;
    };
  }, []);

  // Context value
  const contextValue = useMemo(
    () => ({
      // Camera
      cameraStream: camera.cameraStream,
      isCameraOn: camera.isCameraOn,
      isCameraLoading: camera.isLoading,
      cameraError: camera.error,

      activateCamera: camera.activateCamera,
      ensureCamera: camera.ensureCamera,
      setCameraEnabled: camera.setCameraEnabled,
      toggleCamera: camera.toggleCamera,

      // Microphone
      microphoneStream: microphone.microphoneStream,
      isMicrophoneOn: microphone.isMicrophoneOn,
      isMicrophoneLoading: microphone.isLoading,
      microphoneError: microphone.error,

      activateMicrophone: microphone.activateMicrophone,
      ensureMicrophone: microphone.ensureMicrophone,
      setMicrophoneEnabled: microphone.setMicrophoneEnabled,
      toggleMicrophone: microphone.toggleMicrophone,

      // Shared media operations
      isInitializingMedia,
      initializeMedia,
      releaseMedia,
    }),
    [
      camera.cameraStream,
      camera.isCameraOn,
      camera.isLoading,
      camera.error,
      camera.activateCamera,
      camera.ensureCamera,
      camera.setCameraEnabled,
      camera.toggleCamera,

      microphone.microphoneStream,
      microphone.isMicrophoneOn,
      microphone.isLoading,
      microphone.error,
      microphone.activateMicrophone,
      microphone.ensureMicrophone,
      microphone.setMicrophoneEnabled,
      microphone.toggleMicrophone,

      isInitializingMedia,
      initializeMedia,
      releaseMedia,
    ],
  );

  return (
    <CallContext.Provider value={contextValue}>{children}</CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error("useCall must be used inside a CallProvider");
  }

  return context;
};
