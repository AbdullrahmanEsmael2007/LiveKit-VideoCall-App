"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState } from "react";
import VideoLayout from "./VideoLayout";

interface ActiveCallProps {
  roomName: string;
  username: string;
  onLeave: () => void;
}

import { Toaster, toast } from "react-hot-toast";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, RemoteParticipant } from "livekit-client";

function RoomEvents() {
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;
    const onConnected = (p: RemoteParticipant) => {
      toast.success(`${p.identity} joined the room`);
    };
    const onDisconnected = (p: RemoteParticipant) => {
      toast(`${p.identity} left the room`, { icon: '👋' });
    };
    
    room.on(RoomEvent.ParticipantConnected, onConnected);
    room.on(RoomEvent.ParticipantDisconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onConnected);
      room.off(RoomEvent.ParticipantDisconnected, onDisconnected);
    };
  }, [room]);
  return null;
}

export default function ActiveCall({ roomName, username, onLeave }: ActiveCallProps) {
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/token?room=${roomName}&username=${encodeURIComponent(username)}`
        );
        if (!resp.ok) throw new Error("Failed to fetch token");
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
        setTokenError("Failed to connect to call. Please try again.");
      }
    })();
  }, [roomName, username]);

  if (tokenError) return <div className="flex items-center justify-center h-screen text-red-500">{tokenError}</div>;
  if (!token) return <div className="flex items-center justify-center h-screen">Connecting to call...</div>;

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      connect={true}
      onDisconnected={onLeave}
    >
      <VideoLayout />
      <RoomAudioRenderer />
      <RoomEvents />
      <Toaster position="top-right" />
    </LiveKitRoom>
  );
}
