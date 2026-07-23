import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCheck, CircleCheck, Clock3, CreditCard, FileText, Image, Mic, MoreVertical, Paperclip, Phone, PhoneOff, Send, Square, UploadCloud, Video, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { Loader } from "../../components/common/UI";
import api from "../../services/api";
import { resolveMediaUrl } from "../../services/media";

const formatTime = (value) => value
  ? new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
  : "";

const VOICE_MAX_SECONDS = 5 * 60;
const VOICE_AUDIO_BITS_PER_SECOND = 128_000;
const VOICE_CONSTRAINTS = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
const RTC_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
if (import.meta.env.VITE_TURN_URL) {
  RTC_ICE_SERVERS.push({
    urls: import.meta.env.VITE_TURN_URL,
    username: import.meta.env.VITE_TURN_USERNAME || "",
    credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
  });
}
const RTC_CONFIG = { iceServers: RTC_ICE_SERVERS };

function Attachment({ message }) {
  const source = resolveMediaUrl(message.file_url);
  if (message.file_type === "audio") {
    return (
      <div className="mb-1 min-w-[230px] rounded-xl bg-black/15 p-2">
        <audio src={source} controls preload="metadata" className="h-10 w-full" aria-label="Voice message" />
      </div>
    );
  }
  if (message.file_type === "image") {
    return (
      <a href={source} target="_blank" rel="noreferrer" className="block mb-1 overflow-hidden rounded-lg">
        <img src={source} alt="Shared attachment" className="max-h-64 w-full object-cover" />
      </a>
    );
  }
  if (message.file_type === "video") {
    return <video src={source} controls className="mb-1 max-h-64 w-full rounded-lg" />;
  }
  return (
    <a href={source} target="_blank" rel="noreferrer" className="mb-1 flex items-center gap-3 rounded-lg bg-black/15 p-3 hover:bg-black/25">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
        {message.file_type === "image" ? <Image size={19} /> : <FileText size={19} />}
      </span>
      <span className="text-sm font-medium capitalize">{message.file_type || "File"} attachment</span>
    </a>
  );
}

export default function ChatPage({ role }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket() || {};
  const [request, setRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const [call, setCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api.get(`/requests/${requestId}`), api.get(`/chat/${requestId}/messages`)])
      .then(([reqRes, msgRes]) => {
        setRequest(reqRes.data);
        setMessages(msgRes.data.messages);
      })
      .catch((err) => setError(err.response?.data?.message || "Unable to load this conversation"))
      .finally(() => setLoading(false));
  }, [requestId]);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit("join_chat", { request_id: requestId });
    const onNewMessage = (message) => {
      if (message.request_id === requestId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        setOtherTyping(false);
      }
    };
    const onTyping = (data) => {
      if (data.user_id !== user?.id) {
        setOtherTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setOtherTyping(false), 1800);
      }
    };
    socket.on("new_message", onNewMessage);
    socket.on("user_typing", onTyping);
    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("user_typing", onTyping);
      clearTimeout(typingTimerRef.current);
    };
  }, [socket, connected, requestId, user?.id]);

  const releaseCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    setCall(null);
    setIncomingCall(null);
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection(RTC_CONFIG);
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit("ice_candidate", { request_id: requestId, candidate: candidate.toJSON() });
    };
    peer.ontrack = ({ streams }) => {
      const [remoteStream] = streams;
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setCall((current) => current && { ...current, status: "connected" });
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(peer.connectionState)) releaseCall();
    };
    peerRef.current = peer;
    return peer;
  };

  const attachLocalMedia = async (callType, peer) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const endActiveCall = (notify = true) => {
    if (notify) socket?.emit("end_call", { request_id: requestId });
    releaseCall();
  };

  const startCall = async (callType) => {
    if (!connected || call || incomingCall || !navigator.mediaDevices?.getUserMedia) return;
    setError("");
    try {
      const peer = createPeer();
      setCall({ type: callType, status: "calling" });
      await attachLocalMedia(callType, peer);
      const description = await peer.createOffer();
      await peer.setLocalDescription(description);
      socket.emit("call_offer", { request_id: requestId, call_type: callType, description });
    } catch (err) {
      releaseCall();
      setError(err.name === "NotAllowedError" ? "Camera or microphone permission was denied" : "Unable to start the call");
    }
  };

  const acceptCall = async () => {
    const incoming = incomingCall;
    if (!incoming) return;
    setIncomingCall(null);
    setError("");
    try {
      const peer = createPeer();
      setCall({ type: incoming.call_type, status: "connecting" });
      await attachLocalMedia(incoming.call_type, peer);
      await peer.setRemoteDescription(incoming.description);
      for (const candidate of pendingCandidatesRef.current) await peer.addIceCandidate(candidate);
      pendingCandidatesRef.current = [];
      const description = await peer.createAnswer();
      await peer.setLocalDescription(description);
      socket.emit("call_answer", { request_id: requestId, description });
    } catch (err) {
      endActiveCall();
      setError(err.name === "NotAllowedError" ? "Camera or microphone permission was denied" : "Unable to answer the call");
    }
  };

  useEffect(() => {
    if (!socket || !connected) return;
    const onOffer = (data) => {
      if (data.request_id === requestId && !call && !incomingCall) setIncomingCall(data);
    };
    const onAnswer = async (data) => {
      if (data.request_id !== requestId || !peerRef.current) return;
      await peerRef.current.setRemoteDescription(data.description);
      for (const candidate of pendingCandidatesRef.current) await peerRef.current.addIceCandidate(candidate);
      pendingCandidatesRef.current = [];
    };
    const onCandidate = async (data) => {
      if (data.request_id !== requestId || !data.candidate) return;
      if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(data.candidate);
      else pendingCandidatesRef.current.push(data.candidate);
    };
    const onEndCall = (data) => {
      if (data.request_id === requestId) releaseCall();
    };
    socket.on("call_offer", onOffer);
    socket.on("call_answer", onAnswer);
    socket.on("ice_candidate", onCandidate);
    socket.on("end_call", onEndCall);
    return () => {
      socket.off("call_offer", onOffer);
      socket.off("call_answer", onAnswer);
      socket.off("ice_candidate", onCandidate);
      socket.off("end_call", onEndCall);
    };
  }, [socket, connected, requestId, call, incomingCall]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, otherTyping]);

  useEffect(() => {
    if (!call) return;
    if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    if (remoteVideoRef.current && remoteStreamRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
  }, [call]);

  useEffect(() => () => {
    clearInterval(recordingTimerRef.current);
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const updateText = (value) => {
    setText(value);
    if (value.trim() && socket && connected) socket.emit("typing", { request_id: requestId });
  };

  const sendText = (event) => {
    event.preventDefault();
    if (!text.trim() || !socket || !connected) return;
    socket.emit("send_message", { request_id: requestId, text: text.trim() }, (result) => {
      if (result && !result.success) setError(result.message);
    });
    setText("");
  };

  const upload = async (file) => {
    const body = new FormData();
    body.append("file", file);
    return api.post("/uploads", body, { headers: { "Content-Type": "multipart/form-data" } });
  };

  const handleFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const response = await upload(file);
      socket.emit("send_message", { request_id: requestId, file_url: response.data.file_url, file_type: response.data.file_type });
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const uploadVoiceMessage = async (blob, mimeType) => {
    if (!blob.size || !socket || !connected) return;
    setUploading(true);
    setError("");
    try {
      const extension = mimeType.includes("ogg") ? "ogg" : "weba";
      const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType });
      const response = await upload(file);
      socket.emit("send_message", { request_id: requestId, file_url: response.data.file_url, file_type: "audio" }, (result) => {
        if (result && !result.success) setError(result.message);
      });
    } catch (err) {
      setError(err.response?.data?.message || "Voice message upload failed");
    } finally {
      setUploading(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  };

  const startRecording = async () => {
    if (!connected || uploading || recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported by this browser");
      return;
    }
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: VOICE_CONSTRAINTS });
      const preferredTypes = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: VOICE_AUDIO_BITS_PER_SECOND,
      });
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => event.data.size && recordingChunksRef.current.push(event.data);
      recorder.onerror = () => {
        setError("Voice recording stopped unexpectedly");
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(recordingTimerRef.current);
        setRecording(false);
        setRecordingSeconds(0);
      };
      recorder.onstop = () => {
        const recordedType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(recordingChunksRef.current, { type: recordedType });
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recordingChunksRef.current = [];
        clearInterval(recordingTimerRef.current);
        setRecording(false);
        setRecordingSeconds(0);
        uploadVoiceMessage(blob, recordedType);
      };
      recorder.start(250);
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((value) => {
        if (value + 1 >= VOICE_MAX_SECONDS) {
          setTimeout(stopRecording, 0);
          return VOICE_MAX_SECONDS;
        }
        return value + 1;
      }), 1000);
    } catch (err) {
      setError(err.name === "NotAllowedError" ? "Microphone permission was denied" : "Unable to start voice recording");
    }
  };

  const deliverFinal = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!["accepted", "in_progress"].includes(request?.status)) {
      event.target.value = "";
      return;
    }
    setUploading(true);
    setError("");
    try {
      const response = await upload(file);
      await api.post(`/requests/${requestId}/deliver`, null, { params: { file_url: response.data.file_url } });
      const requestResponse = await api.get(`/requests/${requestId}`);
      setRequest(requestResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deliver the final file");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (loading) return <div className="min-h-screen bg-[#07111f]"><Loader label="Opening conversation..." /></div>;
  if (error && !request) return <div className="grid min-h-screen place-items-center bg-[#07111f] px-6 text-red-300">{error}</div>;
  if (!request) return null;

  const isEditor = role === "editor";
  const canDeliver = ["accepted", "in_progress"].includes(request.status);
  const backPath = isEditor ? "/editor/dashboard" : "/editors";
  const initials = (request.project_title || "EZ").slice(0, 2).toUpperCase();

  return (
    <div className="chat-shell flex h-dvh flex-col text-[#edf5ff]">
      <header className="liquid-chat-bar z-10 m-2 flex min-h-[72px] items-center justify-between gap-3 rounded-2xl px-3 shadow-xl sm:m-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => navigate(backPath)} aria-label="Back" className="rounded-full p-2 text-[#aebac1] hover:bg-white/10"><ArrowLeft size={21} /></button>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 font-bold text-white shadow-lg shadow-cyan-500/20">{initials}</div>
          <div className="min-w-0">
            <p className="truncate rounded-md font-semibold text-white">{request.project_title}</p>
            <p className={`text-xs ${connected ? "text-[#8696a0]" : "text-amber-300"}`}>
              {otherTyping ? <span className="text-cyan-300">typing…</span> : connected ? `online · ${request.status}` : "reconnecting…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => startCall("audio")} disabled={!connected || !!call || !!incomingCall} aria-label="Start voice call" className="chat-action grid h-9 w-9 place-items-center rounded-full text-white disabled:opacity-40"><Phone size={17} /></button>
          <button type="button" onClick={() => startCall("video")} disabled={!connected || !!call || !!incomingCall} aria-label="Start video call" className="chat-action grid h-9 w-9 place-items-center rounded-full text-white disabled:opacity-40"><Video size={18} /></button>
          {!isEditor ? (
            <button onClick={() => navigate(`/payment/${requestId}`)} className="chat-action flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white sm:px-4 sm:text-sm">
              <CreditCard size={17} /><span className="hidden sm:inline">Payment</span>
            </button>
          ) : canDeliver ? (
            <label className="chat-action flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white sm:px-4 sm:text-sm">
              <UploadCloud size={17} /><span className="hidden sm:inline">{uploading ? "Uploading…" : "Final file"}</span>
              <input type="file" hidden onChange={deliverFinal} disabled={uploading} />
            </label>
          ) : request.status === "delivered" ? (
            <span className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-200 sm:px-4">
              <Clock3 size={16} /><span className="hidden sm:inline">Awaiting review</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-200 sm:px-4">
              <CircleCheck size={16} /><span className="hidden sm:inline">Completed</span>
            </span>
          )}
          <MoreVertical className="text-[#aebac1]" size={21} />
        </div>
      </header>

      <main className="whatsapp-wallpaper flex-1 overflow-y-auto px-3 py-5 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-1.5">
          <div className="liquid-glass mx-auto mb-5 w-fit rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-[.14em] text-slate-400 shadow">Messages are stored securely</div>
          {messages.map((message) => {
            const mine = message.sender_id === user?.id;
            return (
              <div key={message.id} className={`chat-message-in flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`relative max-w-[86%] rounded-2xl border px-3 pb-2 pt-2.5 shadow-lg backdrop-blur-xl sm:max-w-[68%] ${mine ? "chat-tail-right border-cyan-300/15 bg-gradient-to-br from-[#126b88]/90 to-[#3941a1]/90" : "chat-tail-left border-white/10 bg-[#17243a]/85"}`}>
                  {message.file_url && <Attachment message={message} />}
                  {message.text && <p className="whitespace-pre-wrap break-words pr-12 text-[14.5px] leading-[1.35] text-[#e9edef]">{message.text}</p>}
                  <span className="ml-8 flex translate-y-0.5 items-center justify-end gap-1 text-[10px] text-[#aebac1]">
                    {formatTime(message.created_at)} {mine && <CheckCheck size={15} className="text-[#53bdeb]" />}
                  </span>
                </div>
              </div>
            );
          })}
          {otherTyping && <div className="chat-message-in w-fit rounded-2xl border border-white/10 bg-[#17243a]/85 px-4 py-3 shadow backdrop-blur-xl"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>}
          <div ref={bottomRef} />
        </div>
      </main>

      {error && <div className="bg-red-950/90 px-4 py-2 text-center text-xs text-red-200">{error}</div>}
      <form onSubmit={sendText} className="liquid-chat-bar m-2 mt-0 flex min-h-[66px] items-center gap-2 rounded-2xl px-3 py-2.5 sm:m-3 sm:mt-0 sm:px-5">
        <label className={`mb-2 cursor-pointer rounded-full p-1 text-[#aebac1] hover:text-white ${uploading ? "animate-pulse" : ""}`}>
          <Paperclip size={23} />
          <input type="file" hidden onChange={handleFile} disabled={uploading || !connected} />
        </label>
        {recording ? (
          <div className="flex min-h-11 flex-1 items-center gap-3 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 text-sm text-red-100">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
            <span className="font-semibold">Recording</span>
            <span className="ml-auto text-xs text-red-200/70">max 5 min</span>
            <span className="tabular-nums">{String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}</span>
          </div>
        ) : <textarea value={text} onChange={(event) => updateText(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendText(event); }
        }} rows={1} placeholder={connected ? "Type a message" : "Waiting for connection…"} disabled={!connected} className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/30 focus:bg-white/[0.09]" />}
        {text.trim() && !recording ? (
          <button type="submit" disabled={!connected} aria-label="Send message" className="chat-action grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"><Send size={19} /></button>
        ) : (
          <button type="button" onClick={recording ? stopRecording : startRecording} disabled={!connected || uploading} aria-label={recording ? "Stop and send voice message" : "Record voice message"} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 ${recording ? "bg-red-500 shadow-lg shadow-red-500/25" : "chat-action"}`}>
            {recording ? <Square size={16} fill="currentColor" /> : <Mic size={19} />}
          </button>
        )}
      </form>

      {incomingCall && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
          <div className="liquid-glass w-full max-w-sm rounded-3xl p-7 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600"><Phone size={28} /></div>
            <h2 className="mt-5 text-xl font-bold">Incoming {incomingCall.call_type === "video" ? "video" : "voice"} call</h2>
            <p className="mt-2 text-sm text-slate-400">{request.project_title}</p>
            <div className="mt-7 flex justify-center gap-5">
              <button type="button" onClick={() => endActiveCall()} aria-label="Decline call" className="grid h-14 w-14 place-items-center rounded-full bg-red-500"><PhoneOff size={22} /></button>
              <button type="button" onClick={acceptCall} aria-label="Accept call" className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500"><Phone size={22} /></button>
            </div>
          </div>
        </div>
      )}

      {call && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#050a13]/95 p-4">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between py-2">
            <div><p className="font-semibold">{call.type === "video" ? "Video" : "Voice"} call</p><p className="text-xs text-slate-400">{call.status}</p></div>
            <button type="button" onClick={() => endActiveCall()} aria-label="End call" className="rounded-full p-2 text-slate-300 hover:bg-white/10"><X size={22} /></button>
          </div>
          <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[#101b2b]">
            <video ref={remoteVideoRef} autoPlay playsInline className={`h-full w-full object-contain ${call.type === "audio" ? "hidden" : ""}`} />
            {call.type === "audio" && <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600"><Phone size={44} /></div>}
            <video ref={localVideoRef} autoPlay playsInline muted className={`absolute bottom-4 right-4 h-36 w-24 rounded-2xl border border-white/20 bg-black object-cover shadow-2xl sm:h-48 sm:w-36 ${call.type === "audio" ? "hidden" : ""}`} />
          </div>
          <button type="button" onClick={() => endActiveCall()} className="mx-auto mt-5 grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/20" aria-label="End call"><PhoneOff size={23} /></button>
        </div>
      )}
    </div>
  );
}
