"use client";

import { VideoTrack, useTracks, useLocalParticipant, useRoomContext, TrackReferenceOrPlaceholder, TrackReference } from "@livekit/components-react";
import { Track, RoomEvent, RemoteParticipant, Participant, ConnectionQuality, ParticipantEvent } from "livekit-client";
import { useState, useRef, useEffect } from "react";
import { ControlBar } from "@livekit/components-react";

// Helper component for individual tiles to handle reactive state (speaking, connection)
interface TrackTileProps {
  trackRef: TrackReferenceOrPlaceholder;
  isSpotlight: boolean;
  onClick?: () => void;
  onContextMenu: (e: React.MouseEvent, participant: Participant) => void;
  onVideoElement: (sid: string, el: HTMLVideoElement | null) => void;
}

function TrackTile({ trackRef, isSpotlight, onClick, onContextMenu, onVideoElement }: TrackTileProps) {
  const participant = trackRef.participant;
  const [isSpeaking, setIsSpeaking] = useState(participant.isSpeaking);
  const [connectionQuality, setConnectionQuality] = useState(participant.connectionQuality);
  
  useEffect(() => {
    const onSpeakingChanged = (speaking: boolean) => {
      setIsSpeaking(speaking);
    };
    const onConnectionQualityChanged = (quality: ConnectionQuality) => {
      setConnectionQuality(quality);
    };

    participant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
    participant.on(ParticipantEvent.ConnectionQualityChanged, onConnectionQualityChanged);

    return () => {
      participant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
      participant.off(ParticipantEvent.ConnectionQualityChanged, onConnectionQualityChanged);
    };
  }, [participant]);

  const isScreenShare = trackRef.source === Track.Source.ScreenShare;

  // Connection Quality Icon
  const getSignalIcon = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
      case ConnectionQuality.Good:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case ConnectionQuality.Poor:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" />
          </svg>
        );
      default: // Lost or Unknown
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center cursor-pointer group w-full h-full p-1`}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, trackRef.participant)}
    >
      {/* Container - Enforce Aspect Ratio in Grid, Full in Spotlight */}
      <div 
        className={`relative w-full bg-gray-800 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center
          ${isScreenShare ? "border-blue-500" : ""} 
          ${isSpeaking && !isScreenShare ? "border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "border-transparent"}
          ${!isSpotlight && !isSpeaking ? "group-hover:border-white" : ""}
          h-full
        `}
      >
        {trackRef.publication ? (
          <VideoTrack
            trackRef={trackRef as TrackReference}
            className="w-full h-full object-contain bg-black"
            // Attach ref to the underlying video element
            ref={(el: HTMLElement | null) => {
              if (el) {
                const videoEl = el instanceof HTMLVideoElement ? el : el.querySelector('video');
                if (videoEl) {
                   onVideoElement(trackRef.publication!.trackSid, videoEl);
                }
              } else {
                onVideoElement(trackRef.publication!.trackSid, null);
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Camera Off</span>
          </div>
        )}
        
        {/* Overlay Info - Always visible with better contrast */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 z-10 pointer-events-none">
          {/* Connection Quality */}
          {getSignalIcon(connectionQuality)}

          {isScreenShare && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
          <span className="truncate max-w-[150px]">{trackRef.participant.identity} {isScreenShare ? "(Screen)" : ""}</span>
          {/* Admin Badge */}
          {JSON.parse(trackRef.participant.metadata || '{}').roles?.includes('admin') && (
            <span className="bg-red-600 text-white text-xs px-1 rounded ml-1 font-bold">ADMIN</span>
          )}
        </div>

        {/* Maximize/Minimize Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-full text-white z-10">
          {isSpotlight ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VideoLayout() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    participant: Participant;
  } | null>(null);

  // Get all video tracks (camera and screen share)
  const videoTracks = useTracks([
    Track.Source.Camera,
    Track.Source.ScreenShare,
  ]);

  // Spotlight state
  const [spotlightTrack, setSpotlightTrack] = useState<TrackReferenceOrPlaceholder | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const tracksPerPage = 4;

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  
  // Ref to track current layout state for the recording loop
  const layoutRef = useRef({
    videoTracks: [] as TrackReferenceOrPlaceholder[],
    spotlightTrack: null as TrackReferenceOrPlaceholder | null,
    visibleTracks: [] as TrackReferenceOrPlaceholder[]
  });

  // Get all tracks for recording (including audio)
  const allTracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
    Track.Source.ScreenShare,
    Track.Source.ScreenShareAudio,
  ]);

  const totalTracks = videoTracks.length;
  const totalPages = Math.ceil(totalTracks / tracksPerPage);

  // Get tracks for current page (Grid View)
  const startIndex = currentPage * tracksPerPage;
  const endIndex = startIndex + tracksPerPage;
  const visibleTracks = videoTracks.slice(startIndex, endIndex);

  // Update layout ref whenever state changes
  useEffect(() => {
    layoutRef.current = {
      videoTracks,
      spotlightTrack,
      visibleTracks
    };
  }, [videoTracks, spotlightTrack, visibleTracks]);

  // Fix: Auto-switch to previous page if current page becomes empty
  useEffect(() => {
    if (currentPage > 0 && currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalTracks, totalPages, currentPage]);

  // Fix: Auto-exit spotlight if track is removed (e.g. screen share stops)
  useEffect(() => {
    if (spotlightTrack) {
      const trackStillExists = videoTracks.some(t => t.publication?.trackSid === spotlightTrack.publication?.trackSid);
      if (!trackStillExists) {
        setSpotlightTrack(null);
      }
    }
  }, [videoTracks, spotlightTrack]);

  // Check for admin role
  useEffect(() => {
    if (localParticipant) {
      const checkAdmin = () => {
        const metadata = JSON.parse(localParticipant.metadata || '{}');
        setIsAdmin(metadata.roles?.includes('admin') || false);
      };
      
      checkAdmin();
      localParticipant.on(RoomEvent.ParticipantMetadataChanged, checkAdmin);
      return () => {
        localParticipant.off(RoomEvent.ParticipantMetadataChanged, checkAdmin);
      };
    }
  }, [localParticipant]);

  // Listen for disconnects to claim admin
  useEffect(() => {
    const handleDisconnect = async () => {
      let hasAdmin = false;
      Array.from(room.remoteParticipants.values()).forEach((p: RemoteParticipant) => {
        const md = JSON.parse(p.metadata || '{}');
        if (md.roles?.includes('admin')) hasAdmin = true;
      });

      if (!hasAdmin && localParticipant) {
        await fetch('/api/room/claim-admin', {
          method: 'POST',
          body: JSON.stringify({
            room: room.name,
            identity: localParticipant.identity
          })
        });
      }
    };

    room.on(RoomEvent.ParticipantDisconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, handleDisconnect);
    };
  }, [room, localParticipant]);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleEndRoom = async () => {
    if (!confirm("Are you sure you want to end the room for everyone?")) return;
    
    if (localParticipant) {
      await fetch('/api/room/end', {
        method: 'POST',
        body: JSON.stringify({
          room: room.name,
          identity: localParticipant.identity
        })
      });
    }
  };

  const handlePromote = async (targetIdentity: string) => {
    if (localParticipant) {
      await fetch('/api/room/promote', {
        method: 'POST',
        body: JSON.stringify({
          room: room.name,
          identity: localParticipant.identity,
          targetIdentity
        })
      });
      setContextMenu(null);
    }
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Canvas Recording Implementation
  const startRecording = async () => {
    try {
      // 1. Setup Canvas (720p for performance)
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not get canvas context");

      // 2. Setup Audio Mixing
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const audioDestination = audioContext.createMediaStreamDestination();
      audioContextRef.current = audioContext;
      audioDestinationRef.current = audioDestination;

      // Connect all existing audio tracks
      allTracks.forEach(trackRef => {
        if (trackRef.publication?.track?.mediaStreamTrack.kind === 'audio') {
          const stream = new MediaStream([trackRef.publication.track.mediaStreamTrack]);
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(audioDestination);
        }
      });

      // 3. Start Drawing Loop (setInterval for background reliability)
      const drawFrame = () => {
        if (!canvasRef.current || !ctx) return;

        // Get latest state from ref
        const { videoTracks: currentVideoTracks, spotlightTrack: currentSpotlightTrack, visibleTracks: currentVisibleTracks } = layoutRef.current;

        // Clear canvas
        ctx.fillStyle = '#111827'; // gray-900 background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Determine layout to draw
        if (currentSpotlightTrack && currentSpotlightTrack.publication) {
          // --- SPOTLIGHT LAYOUT (720p) ---
          // Main video (large)
          const mainVideoEl = videoElementsRef.current.get(currentSpotlightTrack.publication.trackSid);
          if (mainVideoEl && mainVideoEl.readyState >= 2) {
            const { width, height } = calculateAspectRatioFit(
              mainVideoEl.videoWidth, 
              mainVideoEl.videoHeight, 
              canvas.width, 
              canvas.height - 140 // Leave space for thumbnails
            );
            const x = (canvas.width - width) / 2;
            const y = 10; // Top padding
            ctx.drawImage(mainVideoEl, x, y, width, height);
            drawLabel(ctx, currentSpotlightTrack.participant.identity, x + 10, y + height - 30);
          }

          // Thumbnails (bottom strip)
          const thumbnails = currentVideoTracks.filter(t => t.publication?.trackSid !== currentSpotlightTrack.publication?.trackSid);
          const thumbWidth = 213; // Scaled down for 720p
          const thumbHeight = 120;
          const gap = 10;
          const totalWidth = thumbnails.length * (thumbWidth + gap) - gap;
          let startX = (canvas.width - totalWidth) / 2;
          const startY = canvas.height - thumbHeight - 10;

          thumbnails.forEach((track) => {
            if (track.publication) {
              const vidEl = videoElementsRef.current.get(track.publication.trackSid);
              if (vidEl && vidEl.readyState >= 2) {
                 ctx.drawImage(vidEl, startX, startY, thumbWidth, thumbHeight);
                 drawLabel(ctx, track.participant.identity, startX + 5, startY + thumbHeight - 20, 14);
                 startX += thumbWidth + gap;
              }
            }
          });

        } else {
          // --- GRID LAYOUT (720p) ---
          const count = currentVisibleTracks.length;
          
          currentVisibleTracks.forEach((track, index) => {
            if (track.publication) {
              const vidEl = videoElementsRef.current.get(track.publication.trackSid);
              if (vidEl && vidEl.readyState >= 2) {
                let x, y, w, h;

                // Grid Logic for 1280x720
                if (count === 1) {
                  w = 1280; h = 720; x = 0; y = 0;
                } else if (count === 2) {
                  w = 640; h = 720; x = index * 640; y = 0;
                } else {
                  // 3 or 4 items: 2x2 grid
                  w = 640; h = 360;
                  x = (index % 2) * 640;
                  y = Math.floor(index / 2) * 360;
                  
                  if (count === 3) {
                    if (index === 0) {
                      w = 1280; h = 360; x = 0; y = 0;
                    } else {
                      w = 640; h = 360; 
                      x = (index - 1) * 640; 
                      y = 360;
                    }
                  }
                }

                const { width: drawW, height: drawH } = calculateAspectRatioFit(
                  vidEl.videoWidth, vidEl.videoHeight, w, h
                );
                const drawX = x + (w - drawW) / 2;
                const drawY = y + (h - drawH) / 2;

                ctx.drawImage(vidEl, drawX, drawY, drawW, drawH);
                drawLabel(ctx, track.participant.identity, drawX + 10, drawY + drawH - 30);
              }
            }
          });
        }
      };

      // Helper to fit video in box
      const calculateAspectRatioFit = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) => {
        const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return { width: srcWidth * ratio, height: srcHeight * ratio };
      };

      // Helper to draw text label
      const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize = 20) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const padding = 6;
        ctx.font = `${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, y - fontSize, textWidth + padding * 2, fontSize + padding);
        ctx.fillStyle = 'white';
        ctx.fillText(text, x + padding, y + padding / 2);
      };

      // Start loop (30 FPS)
      intervalRef.current = setInterval(drawFrame, 33);

      // 4. Capture Stream & Mix Audio
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);

      // 5. Start Recorder
      let options: MediaRecorderOptions = { mimeType: "video/webm;codecs=vp9" };
      if (!MediaRecorder.isTypeSupported(options.mimeType || "")) {
        options = { mimeType: "video/webm" };
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `call-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        recordedChunksRef.current = [];
        
        // Cleanup
        if (intervalRef.current) clearInterval(intervalRef.current);
        canvasStream.getTracks().forEach(track => track.stop());
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Determine layout class based on number of visible tracks
  const getLayoutClass = (count: number) => {
    if (count === 1) {
      return "grid-cols-1 grid-rows-1";
    } else if (count === 2) {
      return "grid-cols-2 grid-rows-1";
    } else if (count === 3) {
      return "grid-cols-2 grid-rows-2"; 
    } else {
      return "grid-cols-2 grid-rows-2";
    }
  };

  const handleVideoElement = (sid: string, el: HTMLVideoElement | null) => {
    if (el) {
      videoElementsRef.current.set(sid, el);
    } else {
      videoElementsRef.current.delete(sid);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900 flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        
        {spotlightTrack ? (
          // SPOTLIGHT VIEW
          <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
            {/* Spotlighted Track (Large) */}
            <div className="flex-1 relative min-h-0 w-full flex items-center justify-center">
              <TrackTile
                trackRef={spotlightTrack}
                isSpotlight={true}
                onClick={() => setSpotlightTrack(null)}
                onContextMenu={(e, p) => {
                  if (!isAdmin || p.identity === localParticipant.identity) return;
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, participant: p });
                }}
                onVideoElement={handleVideoElement}
              />
            </div>

            {/* Thumbnail Strip */}
            <div className="h-32 flex gap-4 overflow-x-auto pb-2 px-2 snap-x flex-shrink-0">
              {videoTracks
                .filter(t => t.publication?.trackSid !== spotlightTrack.publication?.trackSid)
                .map(track => (
                  <div key={track.publication?.trackSid || track.participant.identity} className="w-48 flex-shrink-0 snap-start">
                    <TrackTile
                      trackRef={track}
                      isSpotlight={false}
                      onClick={() => setSpotlightTrack(track)}
                      onContextMenu={(e, p) => {
                        if (!isAdmin || p.identity === localParticipant.identity) return;
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, participant: p });
                      }}
                      onVideoElement={handleVideoElement}
                    />
                  </div>
                ))
              }
            </div>
          </div>
        ) : (
          // GRID VIEW
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className={`grid ${getLayoutClass(visibleTracks.length)} gap-4 w-full h-full max-w-6xl mx-auto`}>
              {visibleTracks.map((track, index) => {
                // For 3 tracks, make first one span 2 columns
                const isFirstOfThree = visibleTracks.length === 3 && index === 0;
                
                return (
                  <div 
                    key={track.publication?.trackSid || track.participant.identity} 
                    className={`min-h-0 min-w-0 ${isFirstOfThree ? "col-span-2 row-span-1" : "col-span-1 row-span-1"}`}
                  >
                     <TrackTile
                      trackRef={track}
                      isSpotlight={false}
                      onClick={() => setSpotlightTrack(track)}
                      onContextMenu={(e, p) => {
                        if (!isAdmin || p.identity === localParticipant.identity) return;
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, participant: p });
                      }}
                      onVideoElement={handleVideoElement}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls - Only show in Grid View and if needed */}
      {!spotlightTrack && totalPages > 1 && (
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none z-20">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="pointer-events-auto bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full shadow-lg transition-all"
            aria-label="Previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            className="pointer-events-auto bg-gray-800/80 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white p-4 rounded-full shadow-lg transition-all"
            aria-label="Next page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Page Indicator - Only show in Grid View */}
      {!spotlightTrack && totalPages > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white px-4 py-2 rounded-full text-sm z-20">
          Page {currentPage + 1} of {totalPages}
        </div>
      )}

      {/* Control Bar with Recording Button */}
      <div className="bg-gray-900 relative flex-shrink-0">
        <div className="flex items-center justify-center gap-4 py-2">
          {/* End Room Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={handleEndRoom}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-red-800 hover:bg-red-900 text-white mr-4"
              title="End Room for Everyone"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">End Room</span>
            </button>
          )}

          {/* Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-gray-700 hover:bg-gray-600 text-white"
            }`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <circle cx="10" cy="10" r="6" />
            </svg>
            <span className="text-sm">
              {isRecording ? "Stop Recording" : "Start Recording"}
            </span>
          </button>
        </div>
        <ControlBar variation="minimal" />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handlePromote(contextMenu.participant.identity)}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Make Admin
          </button>
        </div>
      )}
    </div>
  );
}
