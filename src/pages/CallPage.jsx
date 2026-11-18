import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useCall } from "../features/call/providers/CallProvider";

const CallPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const {
    cameraStream,
    isCameraOn,
    toggleCamera,

    isMicrophoneOn,
    toggleMicrophone,

    releaseMedia,
  } = useCall();

  // Attach existing camera stream
  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) return;

    videoElement.srcObject = cameraStream;

    return () => {
      videoElement.srcObject = null;
    };
  }, [cameraStream, isCameraOn]);

  const handleHangup = () => {
    releaseMedia();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold">تماس تصویری</h1>
          <p className="mt-2 text-slate-400">
            این صفحه فعلاً برای تست جریان Media ساخته شده است.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="flex min-h-80 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
            {cameraStream && isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full  w-full object-cover"
              />
            ) : (
              <p className="text-slate-400">دوربین خاموش است</p>
            )}
          </div>

          <div className="flex min-h-80 items-center justify-center rounded-2xl bg-slate-900">
            <div className="text-center">
              <p className="text-xl font-semibold">Remote Participant</p>
              <p className="mt-2 text-sm text-slate-400">
                هنوز شرکت‌کننده دیگری متصل نشده است.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap justify-center gap-4">
          <button
            onClick={toggleCamera}
            className="rounded-xl bg-blue-600 px-6 py-3"
          >
            {isCameraOn ? "خاموش کردن دوربین" : "روشن کردن دوربین"}
          </button>

          <button
            onClick={toggleMicrophone}
            className="rounded-xl bg-blue-600 px-6 py-3"
          >
            {isMicrophoneOn ? "قطع میکروفون" : "فعال کردن میکروفون"}
          </button>

          <button
            onClick={handleHangup}
            className="rounded-xl bg-red-600 px-6 py-3 font-semibold"
          >
            پایان تماس
          </button>
        </section>
      </div>
    </main>
  );
};

export default CallPage;
