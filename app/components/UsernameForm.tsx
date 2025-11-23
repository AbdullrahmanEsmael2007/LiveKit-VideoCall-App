"use client";

import { useState } from "react";

interface UsernameFormProps {
  onSubmit: (username: string) => void;
}

const MIN_LENGTH = 3;
const MAX_LENGTH = 24;

export default function UsernameForm({ onSubmit }: UsernameFormProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const validateUsername = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_LENGTH) {
      setError(`Username must be at least ${MIN_LENGTH} characters`);
      return false;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Username must be at most ${MAX_LENGTH} characters`);
      return false;
    }
    setError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevent input beyond max length
    if (value.length <= MAX_LENGTH) {
      setUsername(value);
      if (value.trim()) {
        validateUsername(value);
      } else {
        setError("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUsername(username)) {
      onSubmit(username.trim());
    }
  };

  const isValid = username.trim().length >= MIN_LENGTH && username.trim().length <= MAX_LENGTH;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Join Video Call</h1>
        <div className="mb-4">
          <input
            type="text"
            value={username}
            onChange={handleChange}
            placeholder="Enter your username"
            className={`w-full bg-gray-700 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
              error ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-blue-500"
            }`}
            maxLength={MAX_LENGTH}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <p className="text-gray-400 text-xs mt-2">
            {username.length}/{MAX_LENGTH} characters (minimum {MIN_LENGTH})
          </p>
        </div>
        <button
          type="submit"
          disabled={!isValid}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Enter Lobby
        </button>
      </form>
    </div>
  );
}
