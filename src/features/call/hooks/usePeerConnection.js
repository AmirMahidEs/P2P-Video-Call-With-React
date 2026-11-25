import { useCallback, useEffect, useRef, useState } from "react";

import {
  createPeerConnection,
  closePeerConnection,
} from "../services/peerConnection.service";

const usePeerConnection = () => {
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);

  const [connectionState, setConnectionState] = useState(null);
  const [iceConnectionState, setIceConnectionState] = useState(null);
  const [iceGatheringState, setIceGatheringState] = useState(null);
  const [signalingState, setSignalingState] = useState(null);

  const [iceCandidates, setIceCandidates] = useState([]);

  const [dataChannelState, setDataChannelState] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);

  const [error, setError] = useState(null);

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
        setError(null);
        setIceCandidates([]);

        const peerConnection = createPeerConnection(configuration);

        peerConnectionRef.current = peerConnection;

        setConnectionState(peerConnection.connectionState);
        setIceConnectionState(peerConnection.iceConnectionState);
        setIceGatheringState(peerConnection.iceGatheringState);
        setSignalingState(peerConnection.signalingState);

        peerConnection.onconnectionstatechange = () => {
          if (peerConnectionRef.current !== peerConnection) return;
          setConnectionState(peerConnection.connectionState);
        };

        peerConnection.oniceconnectionstatechange = () => {
          if (peerConnectionRef.current !== peerConnection) return;
          setIceConnectionState(peerConnection.iceConnectionState);
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
    [setupDataChannel],
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

  const releasePeerConnection = useCallback(() => {
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

    setConnectionState("closed");
    setIceConnectionState("closed");
    setIceGatheringState("complete");
    setSignalingState("closed");
    setIceCandidates([]);
    setDataChannelState("closed");
    setLastMessage(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      const dataChannel = dataChannelRef.current;
      const peerConnection = peerConnectionRef.current;

      if (dataChannel) {
        dataChannel.onopen = null;
        dataChannel.onclose = null;
        dataChannel.onerror = null;
        dataChannel.onmessage = null;

        if (dataChannel.readyState !== "closed") {
          dataChannel.close();
        }
      }

      if (peerConnection) {
        peerConnection.onconnectionstatechange = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onicegatheringstatechange = null;
        peerConnection.onicecandidate = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.ondatachannel = null;

        closePeerConnection(peerConnection);
      }

      dataChannelRef.current = null;
      peerConnectionRef.current = null;
    };
  }, []);

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
