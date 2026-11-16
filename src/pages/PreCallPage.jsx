import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useCall } from "../features/call/providers/CallProvider";

const getMediaErrorMessage = (error) => {
  const messages = {
    NotAllowedError: "دسترسی به دستگاه توسط مرورگر رد شد.",
    NotFoundError: "دستگاه موردنظر پیدا نشد.",
    NotReadableError: "دستگاه در حال حاضر قابل استفاده نیست.",
    OverconstrainedError: "تنظیمات انتخاب‌شده برای دستگاه قابل اجرا نیست.",
    CAMERA_TRACK_ENDED: "اتصال دوربین به‌صورت غیرمنتظره قطع شد.",
    MICROPHONE_TRACK_ENDED: "اتصال میکروفون به‌صورت غیرمنتظره قطع شد.",
    CAMERA_TRACK_NOT_AVAILABLE: "تصویر دوربین در دسترس نیست.",
    MICROPHONE_TRACK_NOT_AVAILABLE: "صدای میکروفون در دسترس نیست.",
  };

  return messages[error] || "خطای ناشناخته‌ای رخ داده است.";
};

const PreCallPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const {
    cameraStream,
    isCameraOn,
    isCameraLoading,
    cameraError,
    activateCamera,
    toggleCamera,

    isMicrophoneOn,
    isMicrophoneLoading,
    microphoneError,
    activateMicrophone,
    toggleMicrophone,

    isInitializingMedia,
    initializeMedia,
    releaseMedia,
  } = useCall();

  // Request camera and microphone when entering pre-call
  useEffect(() => {
    initializeMedia();
  }, [initializeMedia]);

  // Attach camera stream to video element
  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) return;

    videoElement.srcObject = cameraStream;

    return () => {
      videoElement.srcObject = null;
    };
  }, [cameraStream, isCameraOn]);

  const handleJoinCall = () => {
    navigate("/call");
  };

  const handleLeave = () => {
    releaseMedia();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold">آماده‌سازی تماس</h1>
          <p className="mt-2 text-slate-400">
            قبل از ورود به تماس، دوربین و میکروفون خود را بررسی کنید.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
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
              <div className="text-center text-slate-400">
                <p className="text-lg">
                  {isCameraLoading
                    ? "در حال دریافت تصویر دوربین..."
                    : "دوربین خاموش است"}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5 rounded-2xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">وضعیت دستگاه‌ها</h2>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="font-medium">دوربین</p>
              <p className="mt-1 text-sm text-slate-400">
                {isCameraLoading
                  ? "در حال دریافت..."
                  : isCameraOn
                    ? "روشن"
                    : "خاموش"}
              </p>

              {cameraError && (
                <p className="mt-2 text-sm text-red-400">
                  {getMediaErrorMessage(cameraError)}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={toggleCamera}
                  disabled={isCameraLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-50"
                >
                  {isCameraOn ? "خاموش کردن" : "روشن کردن"}
                </button>

                {!isCameraOn && !isCameraLoading && (
                  <button
                    onClick={() => activateCamera()}
                    className="rounded-lg bg-slate-700 px-4 py-2"
                  >
                    تلاش مجدد
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="font-medium">میکروفون</p>
              <p className="mt-1 text-sm text-slate-400">
                {isMicrophoneLoading
                  ? "در حال دریافت..."
                  : isMicrophoneOn
                    ? "روشن"
                    : "خاموش"}
              </p>

              {microphoneError && (
                <p className="mt-2 text-sm text-red-400">
                  {getMediaErrorMessage(microphoneError)}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={toggleMicrophone}
                  disabled={isMicrophoneLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-50"
                >
                  {isMicrophoneOn ? "خاموش کردن" : "روشن کردن"}
                </button>

                {!isMicrophoneOn && !isMicrophoneLoading && (
                  <button
                    onClick={() => activateMicrophone()}
                    className="rounded-lg bg-slate-700 px-4 py-2"
                  >
                    تلاش مجدد
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleJoinCall}
            disabled={isInitializingMedia}
            className="rounded-xl bg-green-600 px-6 py-3 font-semibold disabled:opacity-50"
          >
            ورود به تماس
          </button>

          <button
            onClick={handleLeave}
            className="rounded-xl bg-slate-800 px-6 py-3"
          >
            خروج
          </button>
        </div>

        <p className="text-sm text-slate-400">
          حتی اگر دوربین یا میکروفون در دسترس نباشد، می‌توانید وارد تماس شوید.
        </p>
      </div>
    </main>
  );
};

export default PreCallPage;
