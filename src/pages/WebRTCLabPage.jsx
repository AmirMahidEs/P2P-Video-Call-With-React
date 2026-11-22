import { useState } from "react";

import usePeerConnection from "../features/call/hooks/usePeerConnection";

const StateLabel = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-700 py-2">
    <span className="text-sm text-slate-400">{label}</span>
    <span className="text-sm font-medium text-white">
      {value ?? "Not initialized"}
    </span>
  </div>
);

const PeerPanel = ({ title, peer }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
    <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>

    <StateLabel
      label="Connection"
      value={peer.connectionState}
    />
    <StateLabel
      label="ICE Connection"
      value={peer.iceConnectionState}
    />
    <StateLabel
      label="ICE Gathering"
      value={peer.iceGatheringState}
    />
    <StateLabel
      label="Signaling"
      value={peer.signalingState}
    />
    <StateLabel
      label="DataChannel"
      value={peer.dataChannelState}
    />

    {peer.error && (
      <p className="mt-3 text-sm text-red-400">Error: {peer.error}</p>
    )}
  </div>
);

const WebRTCLabPage = () => {
  const peerA = usePeerConnection();
  const peerB = usePeerConnection();

  const [offerSdp, setOfferSdp] = useState("");
  const [answerSdp, setAnswerSdp] = useState("");
  const [messageA, setMessageA] = useState("");
  const [messageB, setMessageB] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const copySdp = async (text, field) => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);

      setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    } catch (error) {
      console.error("Clipboard error:", error);
    }
  };

  const initializePeers = () => {
    const connectionA = peerA.initializePeerConnection();
    const connectionB = peerB.initializePeerConnection();

    if (connectionA && connectionB) {
      setIsInitialized(true);
    }
  };

  const generateOffer = async () => {
    const channel = peerA.createDataChannel("chat");

    if (!channel) return;

    const offer = await peerA.createLocalOffer();

    if (offer) {
      setOfferSdp(offer);
    }
  };

  const generateAnswer = async () => {
    if (!offerSdp.trim()) return;

    const answer = await peerB.createAnswerFromOffer(offerSdp);

    if (answer) {
      setAnswerSdp(answer);
    }
  };

  const applyAnswer = async () => {
    if (!answerSdp.trim()) return;

    await peerA.applyRemoteAnswer(answerSdp);
  };

  const sendFromA = () => {
    if (!messageA.trim()) return;

    const sent = peerA.sendData(messageA);

    if (sent) {
      setMessageA("");
    }
  };

  const sendFromB = () => {
    if (!messageB.trim()) return;

    const sent = peerB.sendData(messageB);

    if (sent) {
      setMessageB("");
    }
  };

  const resetPeers = () => {
    peerA.releasePeerConnection();
    peerB.releasePeerConnection();

    setOfferSdp("");
    setAnswerSdp("");
    setMessageA("");
    setMessageB("");
    setCopiedField(null);
    setIsInitialized(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">WebRTC Lab</h1>
            <p className="mt-2 text-sm text-slate-400">
              آزمایش ارتباط دو Peer با استفاده از DataChannel
            </p>
          </div>

          {!isInitialized ? (
            <button
              onClick={initializePeers}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500"
            >
              Initialize Peers
            </button>
          ) : (
            <button
              onClick={resetPeers}
              className="rounded-lg bg-red-600 px-5 py-3 font-medium hover:bg-red-500"
            >
              Reset Connection
            </button>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <PeerPanel
            title="Peer A — Offerer"
            peer={peerA}
          />
          <PeerPanel
            title="Peer B — Answerer"
            peer={peerB}
          />
        </div>

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-5 text-lg font-bold">مرحله اول: ایجاد Offer</h2>

          <button
            onClick={generateOffer}
            disabled={!isInitialized}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create Offer
          </button>

          <textarea
            value={offerSdp}
            onChange={(event) => setOfferSdp(event.target.value)}
            placeholder="Offer SDP در این قسمت قرار می‌گیرد..."
            className="mt-4 min-h-40 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
          />

          <button
            onClick={() => copySdp(offerSdp, "offer")}
            disabled={!offerSdp.trim()}
            className="mt-3 rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copiedField === "offer" ? "Copied!" : "Copy Offer"}
          </button>
        </section>

        <section className="mt-5 rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-5 text-lg font-bold">
            مرحله دوم: دریافت Offer و ایجاد Answer
          </h2>

          <button
            onClick={generateAnswer}
            disabled={!isInitialized || !offerSdp.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Accept Offer & Create Answer
          </button>

          <textarea
            value={answerSdp}
            onChange={(event) => setAnswerSdp(event.target.value)}
            placeholder="Answer SDP در این قسمت قرار می‌گیرد..."
            className="mt-4 min-h-40 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
          />

          <button
            onClick={() => copySdp(answerSdp, "answer")}
            disabled={!answerSdp.trim()}
            className="mt-3 rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copiedField === "answer" ? "Copied!" : "Copy Answer"}
          </button>
        </section>

        <section className="mt-5 rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-5 text-lg font-bold">
            مرحله سوم: ثبت Answer در Peer A
          </h2>

          <button
            onClick={applyAnswer}
            disabled={!isInitialized || !answerSdp.trim()}
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply Remote Answer
          </button>
        </section>

        <section className="mt-5 rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="mb-5 text-lg font-bold">مرحله چهارم: ارسال پیام</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Peer A to Peer B */}
            <div>
              <p className="mb-3 font-medium">ارسال از Peer A به Peer B</p>

              <div className="flex gap-2">
                <input
                  value={messageA}
                  onChange={(event) => setMessageA(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendFromA();
                  }}
                  placeholder="پیام از A..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                />

                <button
                  onClick={sendFromA}
                  disabled={peerA.dataChannelState !== "open"}
                  className="rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-40"
                >
                  Send
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-slate-800 p-3">
                <p className="mb-2 text-xs text-slate-400">
                  آخرین پیام دریافتی Peer B
                </p>
                <p className=" text-sm text-white">
                  {peerB.lastMessage ?? "هنوز پیامی دریافت نشده"}
                </p>
              </div>
            </div>

            {/* Peer B to Peer A */}
            <div>
              <p className="mb-3 font-medium">ارسال از Peer B به Peer A</p>

              <div className="flex gap-2">
                <input
                  value={messageB}
                  onChange={(event) => setMessageB(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendFromB();
                  }}
                  placeholder="پیام از B..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-emerald-500"
                />

                <button
                  onClick={sendFromB}
                  disabled={peerB.dataChannelState !== "open"}
                  className="rounded-lg bg-emerald-600 px-4 py-2 disabled:opacity-40"
                >
                  Send
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-slate-800 p-3">
                <p className="mb-2 text-xs text-slate-400">
                  آخرین پیام دریافتی Peer A
                </p>
                <p className=" text-sm text-white">
                  {peerA.lastMessage ?? "هنوز پیامی دریافت نشده"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default WebRTCLabPage;
