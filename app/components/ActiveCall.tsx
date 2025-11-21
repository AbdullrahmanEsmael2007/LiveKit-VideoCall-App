"use client";

import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState } from "react";

interface ActiveCallProps {
  roomName: string;
  username: string;
  onLeave: () => void;
}

export default function ActiveCall({ roomName, username, onLeave }: ActiveCallProps) {
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/token?room=${roomName}&username=${encodeURIComponent(username)}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomName, username]);

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
      className="h-screen w-screen"
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
