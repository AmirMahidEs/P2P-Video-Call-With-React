import { useNavigate } from "react-router-dom";

import { useCall } from "../features/call/providers/CallProvider";
import LocalVideo from "../features/media/components/LocalVideo";

const CallPage = () => {
  const navigate = useNavigate();

  const {
    cameraStream,
    isCameraOn,
    toggleCamera,

    isMicrophoneOn,
    toggleMicrophone,

    releaseMedia,
  } = useCall();

  // Hang up
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
          {/* Local Video */}
          <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
            <LocalVideo
              stream={cameraStream}
              isOn={isCameraOn}
            />
          </div>

          {/* Remote Participant */}
          <div className="flex min-h-80 items-center justify-center rounded-2xl bg-slate-900">
            <div className="text-center">
              <p className="text-xl font-semibold">Remote Participant</p>

              <p className="mt-2 text-sm text-slate-400">
                هنوز شرکت‌کننده دیگری متصل نشده است.
              </p>
            </div>
          </div>
        </section>

        {/* Call Controls */}
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
