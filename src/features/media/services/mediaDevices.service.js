const getMediaDevices = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("MEDIA_DEVICES_NOT_SUPPORTED");
  }

  return navigator.mediaDevices;
};

// Check device discovery support
const checkEnumerateDevicesSupport = () => {
  const mediaDevices = getMediaDevices();

  if (!mediaDevices.enumerateDevices) {
    throw new Error("ENUMERATE_DEVICES_NOT_SUPPORTED");
  }

  return mediaDevices;
};

// Get camera stream
export const getCameraStream = async (deviceId) => {
  const mediaDevices = getMediaDevices();

  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : true,
    audio: false,
  };

  return await mediaDevices.getUserMedia(constraints);
};

// Get microphone stream
export const getMicrophoneStream = async (deviceId) => {
  const mediaDevices = getMediaDevices();

  const constraints = {
    video: false,
    audio: deviceId ? { deviceId: { exact: deviceId } } : true,
  };

  return await mediaDevices.getUserMedia(constraints);
};

// Get available cameras and microphones
export const getAvailableDevices = async () => {
  const mediaDevices = checkEnumerateDevicesSupport();

  const devices = await mediaDevices.enumerateDevices();

  return {
    cameras: devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label,
        groupId: device.groupId,
      })),

    microphones: devices
      .filter((device) => device.kind === "audioinput")
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label,
        groupId: device.groupId,
      })),
  };
};

// Stop tracks of a stream
export const stopMediaStream = (stream, kind) => {
  if (!stream) return;

  let tracks;

  if (kind === "video") {
    tracks = stream.getVideoTracks();
  } else if (kind === "audio") {
    tracks = stream.getAudioTracks();
  } else {
    tracks = stream.getTracks();
  }

  tracks.forEach((track) => track.stop());
};

// Switch camera safely
export const switchCameraStream = async (currentStream, deviceId) => {
  const newStream = await getCameraStream(deviceId);

  stopMediaStream(currentStream, "video");

  return newStream;
};

// Switch microphone safely
export const switchMicrophoneStream = async (currentStream, deviceId) => {
  const newStream = await getMicrophoneStream(deviceId);

  stopMediaStream(currentStream, "audio");

  return newStream;
};
