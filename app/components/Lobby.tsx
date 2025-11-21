"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { RemoteParticipant, RoomEvent, DataPacket_Kind } from "livekit-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LobbyProps {
  username: string;
  onCallAccepted: (roomName: string) => void;
}

export default function Lobby({ username, onCallAccepted }: LobbyProps) {
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/token?room=lobby&username=${encodeURIComponent(username)}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [username]);

  if (!token) return <div className="flex items-center justify-center h-screen">Loading Lobby...</div>;

  return (
    <LiveKitRoom
      video={false}
      audio={false}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      connect={true}
    >
      <LobbyInner username={username} onCallAccepted={onCallAccepted} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function LobbyInner({ username, onCallAccepted }: LobbyProps) {
  const participants = useParticipants();
  const room = useRoomContext();
  const [incomingCall, setIncomingCall] = useState<{ from: string; room: string } | null>(null);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      const str = new TextDecoder().decode(payload);
      const data = JSON.parse(str);

      if (data.type === "CALL_REQUEST" && participant) {
        setIncomingCall({ from: participant.identity, room: data.room });
      } else if (data.type === "CALL_ACCEPT") {
        onCallAccepted(data.room);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, onCallAccepted]);

  const startCall = (targetIdentity: string) => {
    const callRoom = `call-${username}-${targetIdentity}`;
    const data = JSON.stringify({ type: "CALL_REQUEST", room: callRoom });
    const encoder = new TextEncoder();
    
    const target = participants.find(p => p.identity === targetIdentity);
    if (target && target instanceof RemoteParticipant) {
        room.localParticipant.publishData(encoder.encode(data), {
            destinationIdentities: [targetIdentity],
            reliable: true,
        });
        // Optimistically join? Or wait for accept? Let's wait for accept or just join.
        // For simplicity, let's just wait for accept, but we need UI to show "Calling..."
        // For this simple mock, let's just jump to the room and wait for them.
        // Actually, better flow: Send request, wait for accept.
        // But to keep it simple as requested: "if he approves we connect"
        // So we wait for CALL_ACCEPT.
        console.log(`Calling ${targetIdentity}...`);
    }
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    const data = JSON.stringify({ type: "CALL_ACCEPT", room: incomingCall.room });
    const encoder = new TextEncoder();
    
    // Broadcast accept to the caller (we know who called from incomingCall.from)
    room.localParticipant.publishData(encoder.encode(data), {
        destinationIdentities: [incomingCall.from],
        reliable: true,
    });
    
    onCallAccepted(incomingCall.room);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Lobby - Logged in as {username}</h1>
      
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-black">
            <h2 className="text-xl font-bold mb-4">Incoming Call from {incomingCall.from}</h2>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={acceptCall}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full"
              >
                Accept
              </button>
              <button 
                onClick={() => setIncomingCall(null)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants
          .filter((p) => p.identity !== username)
          .map((p) => (
            <div key={p.identity} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">
                {p.identity.charAt(0).toUpperCase()}
              </div>
              <div className="text-xl font-semibold">{p.identity}</div>
              <button
                onClick={() => startCall(p.identity)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full transition-colors"
              >
                Call Video
              </button>
            </div>
          ))}
          
        {participants.length <= 1 && (
            <div className="col-span-full text-center text-gray-500 py-12">
                No other users in the lobby. Open a new tab to test!
            </div>
        )}
      </div>
    </div>
  );
}
