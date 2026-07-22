import { useEffect, useState } from "react";
import EditorNavbar from "../../components/navbar/EditorNavbar";
import RequestNotificationCard from "../../components/cards/RequestNotificationCard";
import { Loader } from "../../components/common/UI";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";

const TABS = [
  { id: "pending", label: "New Requests" },
  { id: "active", label: "Active Projects" },
  { id: "completed", label: "Completed" },
];

export default function EditorDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [error, setError] = useState("");
  const { notifications } = useSocket() || {};

  const load = () => {
    setLoading(true);
    setError("");
    api.get("/requests/mine")
      .then((res) => setRequests(res.data.requests))
      .catch((err) => setError(err.response?.data?.message || "Unable to load projects"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const respond = async (id, action) => {
    try {
      await api.patch(`/requests/${id}/respond`, { action });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond");
    }
  };

  const filtered = requests.filter((r) => {
    if (tab === "pending") return r.status === "pending";
    if (tab === "active") return ["accepted", "in_progress", "delivered"].includes(r.status);
    if (tab === "completed") return ["completed", "rejected"].includes(r.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-brand-dark">
      <EditorNavbar />
      <section className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-6">Editor Dashboard</h1>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                tab === t.id ? "bg-brand-gradient text-white border-transparent" : "border-brand-border text-gray-300 hover:border-brand-blue"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Nothing here yet.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <RequestNotificationCard key={r.id} req={r} onRespond={respond} />
            ))}
          </div>
        )}

        {notifications?.length > 0 && (
          <div className="glass rounded-xl p-5 mt-8">
            <h3 className="font-semibold mb-3">Recent Notifications</h3>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="text-sm text-gray-400 border-b border-brand-border pb-2 last:border-0">
                  <span className="text-white font-medium">{n.title}</span> — {n.body}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
