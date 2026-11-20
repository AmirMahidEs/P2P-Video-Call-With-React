import { useEffect, useRef } from "react";

const LocalVideo = ({ stream, isOn, isLoading = false }) => {
  const videoRef = useRef(null);

  // Attach MediaStream to the video element
  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) return;

    videoElement.srcObject = stream || null;

    return () => {
      videoElement.srcObject = null;
    };
  }, [stream]);

  const isVideoVisible = Boolean(stream && isOn);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${
          isVideoVisible ? "visible" : "invisible"
        }`}
      />

      {!isVideoVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-center text-slate-400">
          <p className="text-lg">
            {isLoading ? "در حال دریافت تصویر دوربین..." : "دوربین خاموش است"}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocalVideo;
