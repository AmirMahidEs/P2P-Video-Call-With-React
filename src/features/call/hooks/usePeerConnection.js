import { useCallback, useEffect, useRef, useState } from "react";

import {
  createPeerConnection,
  closePeerConnection,
  waitForIceGatheringComplete,
} from "../services/peerConnection.service";

const usePeerConnection = () => {
  // References
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);

  // PeerConnection states
  const [connectionState, setConnectionState] = useState(null);
  const [iceConnectionState, setIceConnectionState] = useState(null);
  const [iceGatheringState, setIceGatheringState] = useState(null);
  const [signalingState, setSignalingState] = useState(null);

  // DataChannel states
  const [dataChannelState, setDataChannelState] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);

  const [error, setError] = useState(null);

  // Setup DataChannel event handlers
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

  // Create a new PeerConnection
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

        peerConnection.onsignalingstatechange = () => {
          if (peerConnectionRef.current !== peerConnection) return;

          setSignalingState(peerConnection.signalingState);
        };

        // Receive DataChannel created by the remote peer
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

  // Create a DataChannel on the local peer
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

  // Send a message through the DataChannel
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

  // Create an Offer and gather ICE candidates
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

      await waitForIceGatheringComplete(peerConnection);

      if (peerConnectionRef.current !== peerConnection) {
        return null;
      }

      return peerConnection.localDescription.sdp;
    } catch (err) {
      setError(err.message || "OFFER_CREATION_FAILED");

      return null;
    }
  }, []);

  // Receive an Offer and create an Answer
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

      await waitForIceGatheringComplete(peerConnection);

      if (peerConnectionRef.current !== peerConnection) {
        return null;
      }

      return peerConnection.localDescription.sdp;
    } catch (err) {
      setError(err.message || "ANSWER_CREATION_FAILED");

      return null;
    }
  }, []);

  // Receive the Answer from the remote peer
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

  // Close the current PeerConnection
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
      peerConnection.onsignalingstatechange = null;
      peerConnection.ondatachannel = null;

      peerConnectionRef.current = null;

      closePeerConnection(peerConnection);
    }

    setConnectionState("closed");
    setIceConnectionState("closed");
    setIceGatheringState("complete");
    setSignalingState("closed");
    setDataChannelState("closed");
    setLastMessage(null);
    setError(null);
  }, []);

  // Hook cleanup
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

        dataChannelRef.current = null;
      }

      if (peerConnection) {
        peerConnection.onconnectionstatechange = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onicegatheringstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.ondatachannel = null;

        peerConnectionRef.current = null;

        closePeerConnection(peerConnection);
      }
    };
  }, []);

  return {
    // References
    peerConnectionRef,
    dataChannelRef,

    // PeerConnection states
    connectionState,
    iceConnectionState,
    iceGatheringState,
    signalingState,

    // DataChannel states
    dataChannelState,
    lastMessage,

    error,

    // PeerConnection methods
    initializePeerConnection,
    releasePeerConnection,

    // DataChannel methods
    createDataChannel,
    sendData,

    // Negotiation methods
    createLocalOffer,
    createAnswerFromOffer,
    applyRemoteAnswer,
  };
};

export default usePeerConnection;
