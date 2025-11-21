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

  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const resp = await fetch('/api/rooms');
        const data = await resp.json();
        if (Array.isArray(data)) {
          setActiveRooms(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const [customRoom, setCustomRoom] = useState("");

  const joinCustomRoom = () => {
    if (customRoom.trim()) {
      onCallAccepted(customRoom.trim());
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Lobby - Logged in as {username}</h1>
      
      <div className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Create or Join a Room</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={customRoom}
            onChange={(e) => setCustomRoom(e.target.value)}
            placeholder="Enter room name (e.g. DailyStandup)"
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={joinCustomRoom}
            disabled={!customRoom.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Join
          </button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Online Users */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Online Users
          </h2>
          <div className="space-y-4">
            {participants
              .filter((p) => p.identity !== username)
              .map((p) => (
                <div key={p.identity} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">
                      {p.identity.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold">{p.identity}</span>
                  </div>
                  <button
                    onClick={() => startCall(p.identity)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Call
                  </button>
                </div>
              ))}
            {participants.length <= 1 && (
              <div className="text-gray-500 italic">No other users online.</div>
            )}
          </div>
        </div>

        {/* Right Column: Active Rooms */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Active Rooms
          </h2>
          <div className="space-y-4">
            {activeRooms.map((room) => (
              <div key={room.sid} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">{room.name}</div>
                  <div className="text-sm text-gray-400">{room.numParticipants} participants</div>
                </div>
                <button
                  onClick={() => onCallAccepted(room.name)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
            {activeRooms.length === 0 && (
              <div className="text-gray-500 italic">No active rooms. Create one above!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
