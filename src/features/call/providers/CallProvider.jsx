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

  // Initialize camera and microphone independently and in parallel
  const initializeMedia = useCallback(() => {
    // Prevent duplicate initialization requests
    if (initializationRef.current) {
      return initializationRef.current;
    }

    setIsInitializingMedia(true);

    const initializationPromise = Promise.allSettled([
      camera.activateCamera(),
      microphone.activateMicrophone(),
    ]);

    initializationRef.current = initializationPromise;

    initializationPromise.finally(() => {
      if (initializationRef.current === initializationPromise) {
        initializationRef.current = null;
        setIsInitializingMedia(false);
      }
    });

    return initializationPromise;
  }, [camera.activateCamera, microphone.activateMicrophone]);

  // Release both media devices
  const releaseMedia = useCallback(() => {
    camera.releaseCamera();
    microphone.releaseMicrophone();

    initializationRef.current = null;
    setIsInitializingMedia(false);
  }, [camera.releaseCamera, microphone.releaseMicrophone]);

  // Release media when the Provider is unmounted
  useEffect(() => {
    return () => {
      camera.releaseCamera();
      microphone.releaseMicrophone();
    };
  }, [camera.releaseCamera, microphone.releaseMicrophone]);

  const contextValue = useMemo(
    () => ({
      // Camera
      cameraStream: camera.cameraStream,
      isCameraOn: camera.isCameraOn,
      isCameraLoading: camera.isLoading,
      cameraError: camera.error,
      activateCamera: camera.activateCamera,
      setCameraEnabled: camera.setCameraEnabled,
      toggleCamera: camera.toggleCamera,

      // Microphone
      microphoneStream: microphone.microphoneStream,
      isMicrophoneOn: microphone.isMicrophoneOn,
      isMicrophoneLoading: microphone.isLoading,
      microphoneError: microphone.error,
      activateMicrophone: microphone.activateMicrophone,
      setMicrophoneEnabled: microphone.setMicrophoneEnabled,
      toggleMicrophone: microphone.toggleMicrophone,

      // Shared media operations
      isInitializingMedia,
      initializeMedia,
      releaseMedia,
    }),
    [camera, microphone, isInitializingMedia, initializeMedia, releaseMedia],
  );

  return (
    <CallContext.Provider value={contextValue}>{children}</CallContext.Provider>
  );
};

// Access CallProvider context
export const useCall = () => {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error("useCall must be used inside a CallProvider");
  }

  return context;
};
