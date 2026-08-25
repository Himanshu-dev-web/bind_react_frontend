import React, { useState, useEffect } from "react";
import { Search, Plus, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "../api/client.js";
import { Receipt, Customer } from "../types/index.js";
import { F2LookupModal } from "../components/F2LookupModal.js";

interface ReceiptEntryProps {
  currentYear: string;
}

export const ReceiptEntry: React.FC<ReceiptEntryProps> = ({ currentYear }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bankCash, setBankCash] = useState<"Cash" | "Bank">("Cash");
  const [chequeNo, setChequeNo] = useState("");
  const [bankName, setBankName] = useState("");
  const [remarks, setRemarks] = useState("");

  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isCustLookupOpen, setIsCustLookupOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [currentYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recs, custs] = await Promise.all([
        apiClient.getReceipts(currentYear, searchTerm),
        apiClient.getCustomers(currentYear)
      ]);
      setReceipts(recs);
      setAllCustomers(custs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || amount <= 0) {
      setStatusMessage({ type: "error", text: "Please enter customer and a valid receipt amount." });
      return;
    }

    try {
      await apiClient.saveReceipt(currentYear, {
        customerName,
        amount,
        date,
        bankCash,
        chequeNo,
        bankName,
        remarks
      });
      setStatusMessage({ type: "success", text: `Receipt for ₹${amount.toFixed(2)} recorded successfully!` });
      // Reset
      setAmount(0);
      setChequeNo("");
      setRemarks("");
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save receipt" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Entry Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-base text-slate-800 border-b border-slate-100 pb-3">
          Customer Payment Receipt Voucher
        </h3>

        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            {statusMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">
              Customer Name (F2 Search) *
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === "F2" && setIsCustLookupOpen(true)}
                placeholder="Select customer..."
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setIsCustLookupOpen(true)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-primary-600 rounded"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">Amount (₹) *</label>
            <input
              type="number"
              step="any"
              required
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">Payment Mode</label>
            <select
              value={bankCash}
              onChange={(e) => setBankCash(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Cash">Cash Receipt</option>
              <option value="Bank">Bank (Cheque / NEFT / RTGS)</option>
            </select>
          </div>

          {bankCash === "Bank" && (
            <>
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">Cheque / Ref No</label>
                <input
                  type="text"
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  placeholder="Cheque No / UTR"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Drawee Bank"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          <div className={bankCash === "Bank" ? "md:col-span-4" : "md:col-span-3"}>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">Narration / Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. In settlement of bill #1042"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Receipt Voucher
          </button>
        </div>
      </form>

      {/* Recent Receipts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-semibold text-sm text-slate-800">Recent Receipts</h4>
          <button onClick={loadData} className="p-1 text-slate-400 hover:text-slate-600">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">Rec No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Ref / Cheque</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No receipts found.</td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.recNo} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">#{r.recNo}</td>
                    <td className="px-4 py-3 text-slate-600">{r.date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.customerName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.bankCash === "Bank" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {r.bankCash}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{r.chequeNo || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{r.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Lookup */}
      <F2LookupModal
        title="Select Customer (F2)"
        isOpen={isCustLookupOpen}
        onClose={() => setIsCustLookupOpen(false)}
        onSelect={(c) => setCustomerName(c.name)}
        items={allCustomers.map((c) => ({
          id: c.code || c.name,
          primary: c.name,
          secondary: `${c.city || ""} ${c.state || ""}`,
          data: c
        }))}
      />
    </div>
  );
};

