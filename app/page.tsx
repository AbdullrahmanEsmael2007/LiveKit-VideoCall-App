"use client";

import { useState } from "react";
import Lobby from "./components/Lobby";
import ActiveCall from "./components/ActiveCall";
import UsernameForm from "./components/UsernameForm";

export default function Home() {

  const [submittedUsername, setSubmittedUsername] = useState("");
  const [callRoom, setCallRoom] = useState("");

  if (!submittedUsername) {
    return (
      <UsernameForm onSubmit={setSubmittedUsername} />
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
