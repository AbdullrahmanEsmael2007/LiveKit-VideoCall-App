"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { RemoteParticipant, RoomEvent } from "livekit-client";
import { useEffect, useState } from "react";

interface LobbyProps {
  username: string;
  onCallAccepted: (roomName: string) => void;
}

export default function Lobby({ username, onCallAccepted }: LobbyProps) {
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/token?room=lobby&username=${encodeURIComponent(username)}`
        );
        if (!resp.ok) throw new Error("Failed to fetch token");
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
        setTokenError("Failed to connect to lobby. Please refresh.");
      }
    })();
  }, [username]);

  if (tokenError) return <div className="flex items-center justify-center h-screen text-red-500">{tokenError}</div>;
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

const MIN_ROOM_LENGTH = 3;
const MAX_ROOM_LENGTH = 24;

function LobbyInner({ username, onCallAccepted }: LobbyProps) {
  const participants = useParticipants();
  const room = useRoomContext();
  const [incomingCall, setIncomingCall] = useState<{ from: string; room: string } | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<string | null>(null);
  const [roomError, setRoomError] = useState("");

  // Timeout for outgoing calls
  useEffect(() => {
    if (!outgoingCall) return;
    const timer = setTimeout(() => {
      setOutgoingCall(null);
      alert("Call timed out. The user might be away.");
    }, 30000); // 30 seconds timeout
    return () => clearTimeout(timer);
  }, [outgoingCall]);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      const str = new TextDecoder().decode(payload);
      try {
        const data = JSON.parse(str);

        if (data.type === "CALL_REQUEST" && participant) {
          setIncomingCall({ from: participant.identity, room: data.room });
        } else if (data.type === "CALL_ACCEPT") {
          setOutgoingCall(null); // Clear outgoing call state
          onCallAccepted(data.room);
        }
      } catch (e) {
        console.error("Failed to parse data message:", e);
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
        setOutgoingCall(targetIdentity);
        console.log(`Calling ${targetIdentity}...`);
    }
  };

  const cancelCall = () => {
    setOutgoingCall(null);
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

  interface RoomInfo {
    sid: string;
    name: string;
    numParticipants: number;
  }

  const [activeRooms, setActiveRooms] = useState<RoomInfo[]>([]);

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

  const validateRoomName = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_ROOM_LENGTH) {
      setRoomError(`Room name must be at least ${MIN_ROOM_LENGTH} characters`);
      return false;
    }
    if (trimmed.length > MAX_ROOM_LENGTH) {
      setRoomError(`Room name must be at most ${MAX_ROOM_LENGTH} characters`);
      return false;
    }
    setRoomError("");
    return true;
  };

  const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevent input beyond max length
    if (value.length <= MAX_ROOM_LENGTH) {
      setCustomRoom(value);
      if (value.trim()) {
        validateRoomName(value);
      } else {
        setRoomError("");
      }
    }
  };

  const joinCustomRoom = () => {
    if (validateRoomName(customRoom)) {
      onCallAccepted(customRoom.trim());
    }
  };

  const isRoomValid = customRoom.trim().length >= MIN_ROOM_LENGTH && customRoom.trim().length <= MAX_ROOM_LENGTH;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Lobby - Logged in as {username}</h1>
      
      <div className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Create or Join a Room</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={customRoom}
              onChange={handleRoomNameChange}
              placeholder="Enter room name (e.g. DailyStandup)"
              className={`w-full bg-gray-700 border text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 transition-all ${
                roomError ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-blue-500"
              }`}
              maxLength={MAX_ROOM_LENGTH}
            />
            {roomError && <p className="text-red-400 text-sm mt-1">{roomError}</p>}
            <p className="text-gray-400 text-xs mt-1">
              {customRoom.length}/{MAX_ROOM_LENGTH} characters (minimum {MIN_ROOM_LENGTH})
            </p>
          </div>
          <button
            onClick={joinCustomRoom}
            disabled={!isRoomValid}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors self-start"
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

      {outgoingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-black">
            <h2 className="text-xl font-bold mb-4">Calling {outgoingCall}...</h2>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={cancelCall}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
              >
                Cancel
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
