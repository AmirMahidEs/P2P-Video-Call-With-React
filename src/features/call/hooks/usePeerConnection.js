import { useCallback, useEffect, useRef, useState } from "react";

import {
  createPeerConnection,
  closePeerConnection,
} from "../services/peerConnection.service";

const DISCONNECT_TIMEOUT_MS = 15000;

const usePeerConnection = () => {
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const disconnectTimerRef = useRef(null);

  const [connectionState, setConnectionState] = useState(null);
  const [iceConnectionState, setIceConnectionState] = useState(null);
  const [iceGatheringState, setIceGatheringState] = useState(null);
  const [signalingState, setSignalingState] = useState(null);
  const [iceCandidates, setIceCandidates] = useState([]);
  const [dataChannelState, setDataChannelState] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);

  const [error, setError] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const clearDisconnectTimer = useCallback(() => {
    if (disconnectTimerRef.current !== null) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const setupDataChannel = useCallback((dataChannel) => {
    dataChannelRef.current = dataChannel;
    setDataChannelState(dataChannel.readyState);

    dataChannel.onopen = () => {
      if (dataChannelRef.current !== dataChannel) return;
      setDataChannelState(dataChannel.readyState);
    };

    dataChannel.onclose = () => {
      if (dataChannelRef.current !== dataChannel) return;
      setDataChannelState(dataChannel.readyState);
    };

    dataChannel.onerror = (event) => {
      if (dataChannelRef.current !== dataChannel) return;

      if (dataChannel.readyState === "closed") {
        return;
      }

      const peerConnection = peerConnectionRef.current;

      if (
        !peerConnection ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        return;
      }

      setError(event.error?.message || "DATA_CHANNEL_ERROR");
    };

    dataChannel.onmessage = (event) => {
      if (dataChannelRef.current !== dataChannel) return;
      setLastMessage(event.data);
    };

    return dataChannel;
  }, []);

  const initializePeerConnection = useCallback(
    (configuration) => {
      const currentPeerConnection = peerConnectionRef.current;

      if (
        currentPeerConnection &&
        currentPeerConnection.signalingState !== "closed"
      ) {
        return currentPeerConnection;
      }

      try {
        clearDisconnectTimer();

        setError(null);
        setConnectionError(null);

        setIceCandidates([]);
        setLastMessage(null);
        setDataChannelState(null);

        const peerConnection = createPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        setConnectionState(peerConnection.connectionState);
        setIceConnectionState(peerConnection.iceConnectionState);
        setIceGatheringState(peerConnection.iceGatheringState);
        setSignalingState(peerConnection.signalingState);

        peerConnection.onconnectionstatechange = () => {
          if (peerConnectionRef.current !== peerConnection) return;

          const state = peerConnection.connectionState;

          setConnectionState(state);

          if (state === "failed") {
            clearDisconnectTimer();
            setConnectionError("ICE_CONNECTION_FAILED");
          }

          if (state === "connected") {
            clearDisconnectTimer();
            setConnectionError(null);
          }

          if (state === "closed") {
            clearDisconnectTimer();
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          if (peerConnectionRef.current !== peerConnection) return;

          const state = peerConnection.iceConnectionState;

          setIceConnectionState(state);

          if (state === "disconnected") {
            if (disconnectTimerRef.current === null) {
              disconnectTimerRef.current = setTimeout(() => {
                disconnectTimerRef.current = null;

                if (peerConnectionRef.current !== peerConnection) return;

                if (peerConnection.iceConnectionState === "disconnected") {
                  setConnectionError("ICE_CONNECTION_DISCONNECTED_TIMEOUT");
                }
              }, DISCONNECT_TIMEOUT_MS);
            }
          }

          if (state === "connected" || state === "completed") {
            clearDisconnectTimer();
            setConnectionError(null);
          }

          if (state === "failed") {
            clearDisconnectTimer();
            setConnectionError("ICE_CONNECTION_FAILED");
          }

          if (state === "closed") {
            clearDisconnectTimer();
          }
        };

        peerConnection.onicegatheringstatechange = () => {
          if (peerConnectionRef.current !== peerConnection) return;

          setIceGatheringState(peerConnection.iceGatheringState);
        };

        peerConnection.onicecandidate = (event) => {
          if (peerConnectionRef.current !== peerConnection) return;

          if (event.candidate) {
            setIceCandidates((previous) => [
              ...previous,
              event.candidate.toJSON(),
            ]);
          } else {
            console.log("ICE gathering completed");
          }
        };

        peerConnection.onsignalingstatechange = () => {
          if (peerConnectionRef.current !== peerConnection) return;

          setSignalingState(peerConnection.signalingState);
        };

        peerConnection.ondatachannel = (event) => {
          if (peerConnectionRef.current !== peerConnection) return;

          setupDataChannel(event.channel);
        };

        return peerConnection;
      } catch (err) {
        setError(err.message || "PEER_CONNECTION_INITIALIZATION_FAILED");
        return null;
      }
    },
    [setupDataChannel, clearDisconnectTimer],
  );

  const createDataChannel = useCallback(
    (label = "chat", options) => {
      const peerConnection = peerConnectionRef.current;

      if (!peerConnection) {
        setError("PEER_CONNECTION_NOT_INITIALIZED");
        return null;
      }

      if (dataChannelRef.current) {
        if (dataChannelRef.current.readyState !== "closed") {
          return dataChannelRef.current;
        }

        dataChannelRef.current = null;
      }

      try {
        const dataChannel = peerConnection.createDataChannel(label, options);

        return setupDataChannel(dataChannel);
      } catch (err) {
        setError(err.message || "DATA_CHANNEL_CREATION_FAILED");
        return null;
      }
    },
    [setupDataChannel],
  );

  const sendData = useCallback((message) => {
    const dataChannel = dataChannelRef.current;

    if (!dataChannel || dataChannel.readyState !== "open") {
      return false;
    }

    try {
      dataChannel.send(message);
      return true;
    } catch (err) {
      setError(err.message || "DATA_CHANNEL_SEND_FAILED");
      return false;
    }
  }, []);

  const createLocalOffer = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection) {
      setError("PEER_CONNECTION_NOT_INITIALIZED");
      return null;
    }

    try {
      setError(null);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (peerConnectionRef.current !== peerConnection) {
        return null;
      }

      return peerConnection.localDescription.sdp;
    } catch (err) {
      setError(err.message || "OFFER_CREATION_FAILED");
      return null;
    }
  }, []);

  const createAnswerFromOffer = useCallback(async (offerSdp) => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection) {
      setError("PEER_CONNECTION_NOT_INITIALIZED");
      return null;
    }

    try {
      setError(null);

      await peerConnection.setRemoteDescription({
        type: "offer",
        sdp: offerSdp,
      });

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (peerConnectionRef.current !== peerConnection) {
        return null;
      }

      return peerConnection.localDescription.sdp;
    } catch (err) {
      setError(err.message || "ANSWER_CREATION_FAILED");
      return null;
    }
  }, []);

  const applyRemoteAnswer = useCallback(async (answerSdp) => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection) {
      setError("PEER_CONNECTION_NOT_INITIALIZED");
      return false;
    }

    try {
      setError(null);

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      return true;
    } catch (err) {
      setError(err.message || "REMOTE_ANSWER_FAILED");
      return false;
    }
  }, []);

  const addRemoteIceCandidates = useCallback(async (candidates) => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection) {
      setError("PEER_CONNECTION_NOT_INITIALIZED");
      return false;
    }

    if (!Array.isArray(candidates)) {
      setError("INVALID_ICE_CANDIDATES");
      return false;
    }

    try {
      setError(null);

      for (const candidate of candidates) {
        await peerConnection.addIceCandidate(candidate);
      }

      return true;
    } catch (err) {
      setError(err.message || "ADD_ICE_CANDIDATE_FAILED");
      return false;
    }
  }, []);

  const cleanupPeerConnection = useCallback(() => {
    clearDisconnectTimer();

    const peerConnection = peerConnectionRef.current;
    const dataChannel = dataChannelRef.current;

    if (dataChannel) {
      dataChannel.onopen = null;
      dataChannel.onclose = null;
      dataChannel.onerror = null;
      dataChannel.onmessage = null;

      if (dataChannel.readyState !== "closed") {
        dataChannel.close();
      }

      dataChannelRef.current = null;
    }

    if (peerConnection) {
      peerConnection.onconnectionstatechange = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.onicegatheringstatechange = null;
      peerConnection.onicecandidate = null;
      peerConnection.onsignalingstatechange = null;
      peerConnection.ondatachannel = null;

      peerConnectionRef.current = null;
      closePeerConnection(peerConnection);
    }
  }, [clearDisconnectTimer]);

  const releasePeerConnection = useCallback(() => {
    cleanupPeerConnection();

    setConnectionState("closed");
    setIceConnectionState("closed");
    setIceGatheringState("complete");
    setSignalingState("closed");
    setIceCandidates([]);
    setDataChannelState("closed");
    setLastMessage(null);
    setError(null);
    setConnectionError(null);
  }, [cleanupPeerConnection]);

  useEffect(() => {
    return () => {
      cleanupPeerConnection();
    };
  }, [cleanupPeerConnection]);

  return {
    peerConnectionRef,
    dataChannelRef,
    connectionState,
    iceConnectionState,
    iceGatheringState,
    signalingState,
    iceCandidates,
    dataChannelState,
    lastMessage,
    error,
    connectionError,
    initializePeerConnection,
    releasePeerConnection,
    createDataChannel,
    sendData,
    createLocalOffer,
    createAnswerFromOffer,
    applyRemoteAnswer,
    addRemoteIceCandidates,
  };
};

export default usePeerConnection;
