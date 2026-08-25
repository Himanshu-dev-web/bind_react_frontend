import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Save, X, RefreshCw } from "lucide-react";
import { apiClient } from "../api/client.js";
import { Supplier } from "../types/index.js";

interface SupplierListProps {
  currentYear: string;
}

export const SupplierList: React.FC<SupplierListProps> = ({ currentYear }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier>>({
    name: "",
    address: "",
    city: "",
    phone: "",
    gstin: "",
    pan: "",
    opBal: 0,
    drCr: "Cr"
  });

  useEffect(() => {
    loadSuppliers();
  }, [currentYear]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSuppliers(currentYear, searchTerm);
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier.name?.trim()) return;

    try {
      await apiClient.saveSupplier(currentYear, editingSupplier);
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingSupplier({
      name: "",
      address: "",
      city: "",
      phone: "",
      gstin: "",
      pan: "",
      opBal: 0,
      drCr: "Cr"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supp: Supplier) => {
    setEditingSupplier({ ...supp });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadSuppliers()}
            placeholder="Search supplier / binder by name or city..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSuppliers}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Supplier / Binder
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Supplier / Binder Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Opening Bal</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {loading ? "Loading supplier master..." : "No suppliers found."}
                  </td>
                </tr>
              ) : (
                suppliers.map((supp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{supp.code || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{supp.name}</td>
                    <td className="px-4 py-3 text-slate-600">{supp.city || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{supp.phone || supp.mobile || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                      {supp.opBal ? `₹${supp.opBal.toFixed(2)} ${supp.drCr || "Cr"}` : "₹0.00"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEditModal(supp)}
                        title="Edit Supplier"
                        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                {editingSupplier.code ? "Edit Supplier / Binder" : "New Supplier Master"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Supplier / Binder Name *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  placeholder="Enter full vendor/contractor name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Address / Factory</label>
                <input
                  type="text"
                  value={editingSupplier.address || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                  placeholder="Factory location / Street"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={editingSupplier.city || ""}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ""}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

