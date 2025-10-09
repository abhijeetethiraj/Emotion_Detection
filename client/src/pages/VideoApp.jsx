import React, { useEffect, useState, useRef, useContext } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  Loader2,
  Users,
  Copy,
  Check,
  Settings,
  Grid3x3,
  Maximize2,
  Smile,
  Frown,
  Meh,
} from "lucide-react";
import { Appcontext } from "../context/Appcontext";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// Video Player Component with Emotion Display Logic
const VideoPlayer = ({
  user,
  isLocal,
  isSpeaking,
  isSpotlight,
  emotionData,
}) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (user.videoTrack) {
      user.videoTrack.play(containerRef.current, { fit: "cover" });
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user.videoTrack]);
  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      Interested: <Smile className="w-4 h-4 text-yellow-300" />,
      Bored: <Frown className="w-4 h-4 text-blue-300" />,
      Confused: "🤔",
    };
    return emojiMap[emotion] || null;
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl transition-all duration-300 ${
        isSpotlight ? "col-span-2 row-span-2 h-full" : "h-56"
      } ${isSpeaking ? "ring-4 ring-green-500" : "ring-2 ring-gray-700"} ${
        isHovered ? "scale-105 z-10" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={containerRef} className="w-full h-full"></div>

      {!user.hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm">
          <div
            className={`${
              isSpotlight ? "w-32 h-32" : "w-20 h-20"
            } bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-2xl transform transition-transform ${
              isSpeaking ? "scale-110" : ""
            }`}
          >
            <span
              className={`${
                isSpotlight ? "text-5xl" : "text-3xl"
              } font-bold text-white`}
            >
              {user.displayName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <p
            className={`${
              isSpotlight ? "text-2xl" : "text-lg"
            } font-semibold text-white`}
          >
            {user.displayName}
          </p>
        </div>
      )}

      {/* Emotion Display Overlay (only for local user) */}
      {isLocal && emotionData && emotionData.emotion !== "N/A" && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
          {getEmotionEmoji(emotionData.emotion)}
          <span>
            {emotionData.emotion}: {emotionData.confidence?.toFixed(0)}%
          </span>
        </div>
      )}

      <div className="absolute top-3 right-3 flex gap-2">
        {isLocal && !emotionData && (
          <span className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            You
          </span>
        )}
        {isSpeaking && (
          <span className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            Speaking
          </span>
        )}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-lg">
        <span className="font-medium truncate">{user.displayName}</span>
        <div className="flex gap-2 ml-2">
          {!user.hasAudio && (
            <div className="bg-red-500 p-1.5 rounded-full">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          )}
          {!user.hasVideo && (
            <div className="bg-gray-600 p-1.5 rounded-full">
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const VideoApp = () => {
  const [users, setUsers] = useState([]);
  const [localUser, setLocalUser] = useState(null);
  const [joined, setJoined] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [userName, setUserName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const localTracksRef = useRef({ audioTrack: null, videoTrack: null });

  const { user } = useContext(Appcontext);

  // State and refs for emotion detection
  const [emotionData, setEmotionData] = useState({
    emotion: "...",
    confidence: 0,
  });
  const ws = useRef(null);
  const canvasRef = useRef(null);
  const emotionIntervalRef = useRef(null);

  // Effect for handling Agora user events

  useEffect(() => {
    const handleUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        setUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);
      }
      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    };

    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === "video") {
        setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      }
    };

    const handleUserLeft = (user) => {
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
    };
  }, []);

  // Effect for WebSocket connection and frame sending
  // Replace the WebSocket connection useEffect with this fixed version:

  useEffect(() => {
    if (joined && localTracksRef.current.videoTrack && user) {
      console.log("🔌 Connecting to Python WebSocket server...");
      console.log("👤 User data:", { id: user._id, email: user.email });

      // Use the correct WebSocket URL based on environment
      const WS_URL =
        import.meta.env.VITE_PYTHON_WS_URL ||
        (import.meta.env.MODE === "production"
          ? "wss://your-python-server.onrender.com:8766"
          : "ws://localhost:8766");
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log("✅ Connected to Python emotion server");
        // Start sending frames every 2 seconds
        emotionIntervalRef.current = setInterval(sendFrameToServer, 2000);
      };

      ws.current.onmessage = (event) => {
        console.log("📨 Received from Python:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.success && data.face_detected) {
            setEmotionData({
              emotion: data.emotion,
              confidence: data.confidence,
            });
            console.log(
              `😊 Emotion detected: ${data.emotion} (${data.confidence.toFixed(
                1
              )}%)`
            );
          } else if (!data.face_detected) {
            console.log("⚠️ No face detected in frame");
            setEmotionData({ emotion: "N/A", confidence: 0 });
          } else {
            console.error("❌ Python error:", data.error);
          }
        } catch (err) {
          console.error("❌ Failed to parse response:", err);
        }
      };

      ws.current.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        console.error("Make sure Python server is running on:", WS_URL);
      };

      ws.current.onclose = (event) => {
        console.log("🔌 Disconnected from Python server");
        console.log("Close code:", event.code, "Reason:", event.reason);
        clearInterval(emotionIntervalRef.current);
      };
    }

    return () => {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [joined, user]); // Important: include 'user' in dependencies

  // Updated sendFrameToServer function:
  const sendFrameToServer = () => {
    // Check WebSocket connection
    if (ws.current?.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket not open. State:", ws.current?.readyState);
      return;
    }

    // Check video track
    if (!localTracksRef.current.videoTrack) {
      console.warn("⚠️ No video track available");
      return;
    }

    // Check user data
    if (!user?._id && !user?.email) {
      console.error("❌ No user data available!");
      console.log("User object:", user);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("❌ Canvas not found");
      return;
    }

    try {
      const mediaStreamTrack =
        localTracksRef.current.videoTrack.getMediaStreamTrack();
      const imageCapture = new ImageCapture(mediaStreamTrack);

      imageCapture
        .grabFrame()
        .then((imageBitmap) => {
          canvas.width = imageBitmap.width;
          canvas.height = imageBitmap.height;
          canvas.getContext("2d").drawImage(imageBitmap, 0, 0);

          // Convert to base64 JPEG (compressed)
          const imageData = canvas.toDataURL("image/jpeg", 0.6);

          // Prepare payload
          const payload = {
            userId: user._id || "unknown",
            email: user.email || "unknown@example.com",
            image: imageData,
          };

          console.log("📤 Sending frame - User:", payload.userId);
          ws.current.send(JSON.stringify(payload));
        })
        .catch((error) => {
          console.error("❌ Error grabbing frame:", error);
        });
    } catch (error) {
      console.error("❌ Error in sendFrameToServer:", error);
    }
  };

  const joinRoom = async () => {
    if (!userName.trim() || !meetingId.trim()) {
      return alert("Please enter your name and a meeting ID.");
    }
    setIsJoining(true);
    try {
      const uid = await client.join(APP_ID, meetingId, null, null);
      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = { audioTrack, videoTrack };

      setLocalUser({
        uid,
        displayName: userName,
        videoTrack,
        audioTrack,
        hasVideo: true,
        hasAudio: true,
      });

      await client.publish([audioTrack, videoTrack]);
      setJoined(true);
    } catch (err) {
      console.error(err);
      alert(`Failed to join the meeting. Error: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const leaveRoom = async () => {
    localTracksRef.current.audioTrack?.close();
    localTracksRef.current.videoTrack?.close();
    await client.leave();
    setUsers([]);
    setLocalUser(null);
    setJoined(false);
    setMeetingId("");
  };

  const toggleMic = async () => {
    if (localUser && localTracksRef.current.audioTrack) {
      const enabled = !localUser.hasAudio;
      await localTracksRef.current.audioTrack.setEnabled(enabled);
      setLocalUser((prev) => ({ ...prev, hasAudio: enabled }));
    }
  };

  const toggleCamera = async () => {
    if (localUser && localTracksRef.current.videoTrack) {
      const enabled = !localUser.hasVideo;
      await localTracksRef.current.videoTrack.setEnabled(enabled);
      setLocalUser((prev) => ({ ...prev, hasVideo: enabled }));
    }
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all hover:scale-105">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-xl">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Video Meeting
            </h1>
            <p className="text-gray-300 text-lg">
              Connect with your team instantly
            </p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-4 bg-white/10 text-white rounded-xl border-2 border-white/20 focus:border-blue-400 outline-none backdrop-blur-sm placeholder-gray-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meeting ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter or generate ID"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="flex-1 p-4 bg-white/10 text-white rounded-xl border-2 border-white/20 focus:border-blue-400 outline-none backdrop-blur-sm placeholder-gray-400 transition-all"
                />
                <button
                  onClick={() => setMeetingId(generateRandomId())}
                  className="px-4 bg-white/10 hover:bg-white/20 rounded-xl border-2 border-white/20 transition-all backdrop-blur-sm"
                  title="Generate random ID"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={joinRoom}
              disabled={isJoining}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Join Meeting</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const participantCount = (localUser ? 1 : 0) + users.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col text-white">
      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm text-gray-400">Meeting ID</h1>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-400">
                  {meetingId}
                </span>
                <button
                  onClick={copyMeetingId}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy meeting ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">{participantCount}</span>
          </div>
          <button
            onClick={() =>
              setViewMode(viewMode === "grid" ? "spotlight" : "grid")
            }
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Toggle view mode"
          >
            {viewMode === "grid" ? (
              <Maximize2 className="w-5 h-5" />
            ) : (
              <Grid3x3 className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div
          className={`grid gap-4 h-full ${
            viewMode === "spotlight"
              ? "grid-cols-1 md:grid-cols-3"
              : participantCount <= 2
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          }`}
        >
          {localUser && (
            <VideoPlayer
              key={localUser.uid}
              user={localUser}
              isLocal={true}
              isSpotlight={viewMode === "spotlight" && participantCount > 1}
              emotionData={emotionData}
            />
          )}
          {users.map((user, index) => (
            <VideoPlayer
              key={user.uid}
              user={user}
              isLocal={false}
              isSpotlight={viewMode === "spotlight" && index > 0}
            />
          ))}
        </div>
      </main>

      <footer className="bg-black/30 backdrop-blur-xl border-t border-white/10 px-6 py-5 shadow-lg">
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={toggleMic}
            className={`p-4 rounded-2xl transition-all shadow-lg transform hover:scale-110 ${
              localUser?.hasAudio
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-500"
            }`}
            title={
              localUser?.hasAudio ? "Mute microphone" : "Unmute microphone"
            }
          >
            {localUser?.hasAudio ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={toggleCamera}
            className={`p-4 rounded-2xl transition-all shadow-lg transform hover:scale-110 ${
              localUser?.hasVideo
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-500"
            }`}
            title={localUser?.hasVideo ? "Turn off camera" : "Turn on camera"}
          >
            {localUser?.hasVideo ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={leaveRoom}
            className="p-4 rounded-2xl bg-red-600 hover:bg-red-500 transition-all shadow-lg transform hover:scale-110"
            title="Leave meeting"
          >
            <Phone className="w-6 h-6 rotate-135" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default VideoApp;
