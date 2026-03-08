"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
} from "lucide-react";
import {
  createCall,
  answerCall,
  endCall,
  subscribeToCallStatus,
} from "@/lib/webrtc";

interface VideoRoomProps {
  currentUserId: string;
  remoteUserId: string;
  remoteName: string;
  incomingCallId?: string | null;
  onClose: () => void;
}

export default function VideoRoom({
  currentUserId,
  remoteUserId,
  remoteName,
  incomingCallId,
  onClose,
}: VideoRoomProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [callId, setCallId] = useState<string | null>(incomingCallId || null);
  const [callStatus, setCallStatus] = useState<string>(
    incomingCallId ? "answering" : "idle"
  );
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Acquire local media on mount
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function getMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        setError(
          "Could not access camera/microphone. Please check permissions."
        );
      }
    }

    getMedia();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // If incoming call, answer automatically once we have the local stream
  useEffect(() => {
    if (!incomingCallId || !localStream || callStatus !== "answering") return;

    async function answer() {
      try {
        const peerConnection = await answerCall(incomingCallId!, localStream!);

        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        setPc(peerConnection);
        setCallStatus("connected");
      } catch {
        setError("Failed to answer call.");
        setCallStatus("idle");
      }
    }

    answer();
  }, [incomingCallId, localStream, callStatus]);

  // Subscribe to call status changes
  useEffect(() => {
    if (!callId) return;
    const unsub = subscribeToCallStatus(callId, (status) => {
      if (status === "ended") {
        handleEndCall();
      }
    });
    return () => unsub();
  }, [callId]);

  const handleStartCall = useCallback(async () => {
    if (!localStream) return;
    setCallStatus("ringing");

    try {
      const { pc: peerConnection, callId: newCallId } = await createCall(
        currentUserId,
        remoteUserId,
        localStream
      );

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          setCallStatus("connected");
        }
      };

      setPc(peerConnection);
      setCallId(newCallId);
    } catch {
      setError("Failed to start call.");
      setCallStatus("idle");
    }
  }, [localStream, currentUserId, remoteUserId]);

  const handleEndCall = useCallback(() => {
    if (pc && callId && localStream) {
      endCall(callId, pc, localStream);
    }
    setPc(null);
    setCallId(null);
    setCallStatus("idle");
    onClose();
  }, [pc, callId, localStream, onClose]);

  function toggleVideo() {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  }

  function toggleAudio() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 rounded-xl p-8 text-center">
        <VideoOff className="w-12 h-12 text-gray-500 mb-3" />
        <p className="text-gray-300 text-sm mb-4">{error}</p>
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Video area */}
      <div className="flex-1 relative min-h-0">
        {/* Remote video (large) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {callStatus !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-gray-300">
                {remoteName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-gray-300 font-medium">{remoteName}</p>
            <p className="text-gray-500 text-sm mt-1">
              {callStatus === "idle"
                ? "Ready to call"
                : callStatus === "ringing"
                ? "Ringing..."
                : callStatus === "answering"
                ? "Connecting..."
                : ""}
            </p>
          </div>
        )}

        {/* Local video (small, picture-in-picture) */}
        <div className="absolute bottom-3 right-3 w-32 h-24 rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-800">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition ${
            audioEnabled
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
          title={audioEnabled ? "Mute" : "Unmute"}
        >
          {audioEnabled ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition ${
            videoEnabled
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
          title={videoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {videoEnabled ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </button>

        {callStatus === "idle" ? (
          <button
            onClick={handleStartCall}
            disabled={!localStream}
            className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition"
            title="Start call"
          >
            <Phone className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
            title="End call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
