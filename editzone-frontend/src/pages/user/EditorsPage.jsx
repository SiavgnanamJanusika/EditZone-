import { useEffect, useState } from "react";
import UserNavbar from "../../components/navbar/UserNavbar";
import EditorCard from "../../components/cards/EditorCard";
import { Loader } from "../../components/common/UI";
import api from "../../services/api";

export default function EditorsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .get("/editors", { params: { category, search: search || undefined } })
        .then((res) => setEditors(res.data.editors))
        .catch((err) => {
          setEditors([]);
          setError(err.response?.data?.message || "Unable to load editors. Please try again.");
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <div className="min-h-screen bg-brand-dark">
      <UserNavbar search={search} setSearch={setSearch} category={category} setCategory={setCategory} />
      <section className="max-w-[1440px] mx-auto px-6 md:px-10 py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Find Your Editor</h1>

        {loading ? (
          <Loader label="Loading editors..." />
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : editors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No editors found. Try a different search or category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
            {editors.map((e) => (
              <EditorCard key={e.id} editor={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
