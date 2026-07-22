import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, MessageSquare, Star } from "lucide-react";
import UserNavbar from "../../components/navbar/UserNavbar";
import { Loader, Badge, PrimaryButton, OutlineButton } from "../../components/common/UI";
import api from "../../services/api";

const STATUS_TONE = {
  pending: "warning",
  accepted: "purple",
  rejected: "danger",
  in_progress: "purple",
  delivered: "warning",
  completed: "success",
};

function ReviewForm({ requestId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    if (comment.trim().length < 100) {
      setError(`Review must be at least 100 characters (currently ${comment.trim().length})`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reviews", { request_id: requestId, rating, comment });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-4 rounded-lg bg-brand-panel border border-brand-border">
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}>
            <Star size={20} className={n <= rating ? "text-yellow-400" : "text-gray-600"} fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        placeholder="Write a review (min 100 characters)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-brand-border text-white text-sm focus:outline-none focus:border-brand-blue"
      />
      <p className="text-[11px] text-gray-500 mt-1">{comment.trim().length}/100 characters minimum</p>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <PrimaryButton className="mt-2 text-sm px-4 py-2" onClick={submit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </PrimaryButton>
    </div>
  );
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());

  const load = () => {
    setLoading(true);
    api.get("/requests/mine").then((res) => setRequests(res.data.requests)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="min-h-screen bg-brand-dark">
      <UserNavbar />
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">Order History</h1>
          <OutlineButton onClick={() => navigate("/editors")} className="flex items-center gap-2 text-sm">
            <Home size={16} /> Back to Home
          </OutlineButton>
        </div>

        {loading ? (
          <Loader />
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No projects yet. Go find an editor to get started!</div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <div key={r.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-white">{r.project_title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{r.project_description}</p>
                    <p className="text-xs text-gray-500 mt-2">Ordered {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={STATUS_TONE[r.status] || "default"}>{r.status.replace("_", " ")}</Badge>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  {(r.status === "accepted" || r.status === "in_progress" || r.status === "delivered" || r.status === "completed") && (
                    <OutlineButton onClick={() => navigate(`/chat/${r.id}`)} className="text-sm px-4 py-2 flex items-center gap-2">
                      <MessageSquare size={14} /> Open Chat
                    </OutlineButton>
                  )}
                  {r.status === "accepted" && !r.paid && (
                    <PrimaryButton onClick={() => navigate(`/payment/${r.id}`)} className="text-sm px-4 py-2">
                      Pay Now
                    </PrimaryButton>
                  )}
                  {r.status === "rejected" && (
                    <PrimaryButton onClick={() => navigate("/editors")} className="text-sm px-4 py-2">
                      View More Editors
                    </PrimaryButton>
                  )}
                  {r.status === "completed" && !reviewedIds.has(r.id) && reviewingId !== r.id && (
                    <OutlineButton onClick={() => setReviewingId(r.id)} className="text-sm px-4 py-2 flex items-center gap-2">
                      <Star size={14} /> Leave a Review
                    </OutlineButton>
                  )}
                </div>

                {reviewingId === r.id && (
                  <ReviewForm
                    requestId={r.id}
                    onDone={() => {
                      setReviewedIds((prev) => new Set(prev).add(r.id));
                      setReviewingId(null);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
