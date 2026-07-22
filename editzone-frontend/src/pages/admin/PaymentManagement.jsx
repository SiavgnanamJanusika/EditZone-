import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Loader, Badge } from "../../components/common/UI";
import api from "../../services/api";

export default function PaymentManagement() {
  const [payments, setPayments] = useState(null);

  const loadPayments = () => api.get("/admin/payments").then((res) => setPayments(res.data.payments));

  useEffect(() => { loadPayments(); }, []);

  const releaseAdminFee = async (paymentId) => {
    await api.patch(`/admin/payments/${paymentId}/release`);
    await loadPayments();
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Payment Management</h1>
      {!payments ? (
        <Loader />
      ) : (
        <div className="glass rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-gray-400 border-b border-brand-border">
                <th className="p-4">Project</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Commission</th>
                <th className="p-4">Editor Payout</th>
                <th className="p-4">Method</th>
                <th className="p-4">Escrow</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-brand-border last:border-0">
                  <td className="p-4 text-white">{p.project_name}</td>
                  <td className="p-4 text-gray-300">{p.currency || "LKR"} {p.amount}</td>
                  <td className="p-4 text-gray-400">{p.currency || "LKR"} {p.commission_amount ?? 0}</td>
                  <td className="p-4 text-gray-400">{p.currency || "LKR"} {p.editor_payout_amount ?? 0}</td>
                  <td className="p-4 text-gray-400 capitalize">{p.payment_method}</td>
                  <td className="p-4">
                    <Badge tone={p.escrow_status === "released" ? "success" : "warning"}>{p.escrow_status}</Badge>
                  </td>
                  <td className="p-4">
                    {p.payment_type === "monthly_admin_fee" && p.escrow_status === "held" ? (
                      <button onClick={() => releaseAdminFee(p.id)} className="text-brand-cyan hover:underline">Release</button>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
