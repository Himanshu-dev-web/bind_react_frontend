import React, { useState, useEffect } from "react";
import { Plus, Edit2, Save, X, RefreshCw, Building2, Landmark, ShieldCheck } from "lucide-react";
import { apiClient } from "../api/client.js";
import { Firm } from "../types/index.js";

interface FirmListProps {
  currentYear: string;
}

export const FirmList: React.FC<FirmListProps> = ({ currentYear }) => {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<Partial<Firm>>({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    gstin: "",
    pan: "",
    bank: "",
    account: "",
    ifsc: ""
  });

  useEffect(() => {
    loadFirms();
  }, [currentYear]);

  const loadFirms = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getFirms(currentYear);
      setFirms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm.name?.trim()) return;

    try {
      await apiClient.saveFirm(currentYear, editingFirm);
      setIsModalOpen(false);
      loadFirms();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingFirm({
      name: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      gstin: "",
      pan: "",
      bank: "",
      account: "",
      ifsc: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (f: Firm) => {
    setEditingFirm({ ...f });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 text-primary-700 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-800">Billing Firms & Sister Concerns</h3>
            <p className="text-xs text-slate-500">
              Manage multiple billing company letterheads, GSTINs, and banking credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadFirms} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Billing Firm
          </button>
        </div>
      </div>

      {/* Firms Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {firms.map((f, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 relative flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-tight">{f.name}</h4>
                <button
                  onClick={() => openEditModal(f)}
                  className="p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1">{f.address}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">GSTIN:</span>
                  <span className="font-mono font-bold text-slate-800">{f.gstin || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PAN:</span>
                  <span className="font-mono font-semibold text-slate-800">{f.pan || "—"}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                <Landmark className="w-3.5 h-3.5 text-primary-600" />
                <span>{f.bank || "Bank Not Configured"}</span>
              </div>
              {f.account && (
                <div className="flex justify-between text-[11px]">
                  <span>A/C:</span>
                  <span className="font-mono font-medium">{f.account}</span>
                </div>
              )}
              {f.ifsc && (
                <div className="flex justify-between text-[11px]">
                  <span>IFSC:</span>
                  <span className="font-mono font-medium">{f.ifsc}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="flex flex-col w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-base text-slate-800">
                {editingFirm.name ? "Edit Billing Firm" : "New Billing Firm"}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Firm / Company Name *</label>
                <input
                  type="text"
                  required
                  value={editingFirm.name || ""}
                  onChange={(e) => setEditingFirm({ ...editingFirm, name: e.target.value })}
                  placeholder="e.g. SUNIL BOOK BINDING HOUSE"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Registered Address</label>
                <input
                  type="text"
                  value={editingFirm.address || ""}
                  onChange={(e) => setEditingFirm({ ...editingFirm, address: e.target.value })}
                  placeholder="Factory / Office Street"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editingFirm.gstin || ""}
                    onChange={(e) => setEditingFirm({ ...editingFirm, gstin: e.target.value })}
                    placeholder="09ABLPT3658D1Z9"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={editingFirm.pan || ""}
                    onChange={(e) => setEditingFirm({ ...editingFirm, pan: e.target.value })}
                    placeholder="ABLPT3658D"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editingFirm.bank || ""}
                    onChange={(e) => setEditingFirm({ ...editingFirm, bank: e.target.value })}
                    placeholder="PUNJAB NATIONAL BANK"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account No</label>
                  <input
                    type="text"
                    value={editingFirm.account || ""}
                    onChange={(e) => setEditingFirm({ ...editingFirm, account: e.target.value })}
                    placeholder="Account No"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={editingFirm.ifsc || ""}
                    onChange={(e) => setEditingFirm({ ...editingFirm, ifsc: e.target.value })}
                    placeholder="PUNB0253400"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save Firm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

