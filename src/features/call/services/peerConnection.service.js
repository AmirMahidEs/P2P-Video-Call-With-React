const DEFAULT_ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

export const createPeerConnection = (configuration = {}) => {
  if (!window.RTCPeerConnection) {
    throw new Error("WEBRTC_NOT_SUPPORTED");
  }

  const peerConfiguration = {
    iceServers: DEFAULT_ICE_SERVERS,
    ...configuration,
  };

  return new RTCPeerConnection(peerConfiguration);
};

export const closePeerConnection = (peerConnection) => {
  if (!peerConnection) return;

  if (peerConnection.signalingState !== "closed") {
    peerConnection.close();
  }
};

export const waitForIceGatheringComplete = (peerConnection) => {
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handleGatheringStateChange = () => {
      if (peerConnection.iceGatheringState !== "complete") {
        return;
      }

      peerConnection.removeEventListener(
        "icegatheringstatechange",
        handleGatheringStateChange,
      );

      resolve();
    };

    peerConnection.addEventListener(
      "icegatheringstatechange",
      handleGatheringStateChange,
    );

    // بررسی مجدد برای جلوگیری از از دست رفتن تغییر وضعیت
    handleGatheringStateChange();
  });
};
