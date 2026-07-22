import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCheck, CreditCard, FileText, Image, MoreVertical, Paperclip, Send, UploadCloud } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { Loader } from "../../components/common/UI";
import api from "../../services/api";

const formatTime = (value) => value
  ? new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
  : "";

function Attachment({ message }) {
  if (message.file_type === "image") {
    return (
      <a href={message.file_url} target="_blank" rel="noreferrer" className="block mb-1 overflow-hidden rounded-lg">
        <img src={message.file_url} alt="Shared attachment" className="max-h-64 w-full object-cover" />
      </a>
    );
  }
  if (message.file_type === "video") {
    return <video src={message.file_url} controls className="mb-1 max-h-64 w-full rounded-lg" />;
  }
  return (
    <a href={message.file_url} target="_blank" rel="noreferrer" className="mb-1 flex items-center gap-3 rounded-lg bg-black/15 p-3 hover:bg-black/25">
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
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

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

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, otherTyping]);

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

  const deliverFinal = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
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
          {!isEditor ? (
            <button onClick={() => navigate(`/payment/${requestId}`)} className="chat-action flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white sm:px-4 sm:text-sm">
              <CreditCard size={17} /><span className="hidden sm:inline">Payment</span>
            </button>
          ) : (
            <label className="chat-action flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white sm:px-4 sm:text-sm">
              <UploadCloud size={17} /><span className="hidden sm:inline">{uploading ? "Uploading…" : "Final file"}</span>
              <input type="file" hidden onChange={deliverFinal} disabled={uploading} />
            </label>
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
        <textarea value={text} onChange={(event) => updateText(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendText(event); }
        }} rows={1} placeholder={connected ? "Type a message" : "Waiting for connection…"} disabled={!connected} className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/30 focus:bg-white/[0.09]" />
        <button type="submit" disabled={!connected || !text.trim()} aria-label="Send message" className="chat-action grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"><Send size={19} /></button>
      </form>
    </div>
  );
}
