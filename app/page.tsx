"use client";

import { useState } from "react";
import Lobby from "./components/Lobby";
import ActiveCall from "./components/ActiveCall";

export default function Home() {
  const [username, setUsername] = useState("");
  const [submittedUsername, setSubmittedUsername] = useState("");
  const [callRoom, setCallRoom] = useState("");

  if (!submittedUsername) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (username.trim()) setSubmittedUsername(username.trim());
          }}
          className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">Join Video Call</h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Enter Lobby
          </button>
        </form>
      </div>
    );
  }

  if (callRoom) {
    return (
      <ActiveCall
        username={submittedUsername}
        roomName={callRoom}
        onLeave={() => setCallRoom("")}
      />
    );
  }

  return (
    <Lobby
      username={submittedUsername}
      onCallAccepted={(room) => setCallRoom(room)}
    />
  );
}
