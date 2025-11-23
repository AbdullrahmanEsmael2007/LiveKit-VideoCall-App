"use client";

import { useParticipants, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState } from "react";
import { ControlBar } from "@livekit/components-react";

export default function VideoLayout() {
  const participants = useParticipants();
  const [currentPage, setCurrentPage] = useState(0);
  const participantsPerPage = 4;

  const totalParticipants = participants.length;
  const totalPages = Math.ceil(totalParticipants / participantsPerPage);

  // Get participants for current page
  const startIndex = currentPage * participantsPerPage;
  const endIndex = startIndex + participantsPerPage;
  const visibleParticipants = participants.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Determine layout class based on number of visible participants
  const getLayoutClass = () => {
    const count = visibleParticipants.length;
    
    if (count === 1) {
      return "grid-cols-1 grid-rows-1"; // Fullscreen
    } else if (count === 2) {
      return "grid-cols-2 grid-rows-1"; // Side by side
    } else if (count === 3) {
      return "grid-cols-2 grid-rows-2"; // Triangle: 1 top (span 2), 2 bottom
    } else {
      return "grid-cols-2 grid-rows-2"; // 2x2 grid
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-hidden flex items-center justify-center">
        <div className={`grid ${getLayoutClass()} gap-4 w-full h-full`}>
          {visibleParticipants.map((participant, index) => {
            // For 3 participants, make first one span 2 columns
            const isFirstOfThree = visibleParticipants.length === 3 && index === 0;
            
            // Get video publication for this participant
            const videoPublication = participant.videoTrackPublications.values().next().value;
            
            return (
              <div
                key={participant.identity}
                className={`relative flex items-center justify-center ${
                  isFirstOfThree ? "col-span-2" : ""
                }`}
              >
                {/* 16:9 Aspect Ratio Container */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <div className="absolute inset-0 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                    {videoPublication?.track ? (
                      <VideoTrack
                        trackRef={{
                          participant: participant,
                          source: Track.Source.Camera,
                          publication: videoPublication,
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
                          {participant.identity.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-white text-lg">Camera Off</p>
                      </div>
                    )}
                    
                    {/* Participant Name Overlay */}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {participant.identity}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Controls - Only show if more than 4 participants */}
      {totalPages > 1 && (
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="pointer-events-auto bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full shadow-lg transition-all"
            aria-label="Previous page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            className="pointer-events-auto bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full shadow-lg transition-all"
            aria-label="Next page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Page Indicator */}
      {totalPages > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white px-4 py-2 rounded-full text-sm">
          Page {currentPage + 1} of {totalPages}
        </div>
      )}

      {/* Control Bar - Always visible with minimal height */}
      <div className="bg-gray-900">
        <ControlBar variation="minimal" />
      </div>
    </div>
  );
}

