import React, { useState, useEffect } from "react";
import { Plus, Edit2, Save, X, RefreshCw } from "lucide-react";
import { apiClient } from "../api/client.js";
import { UnitMaster } from "../types/index.js";

interface UnitListProps {
  currentYear: string;
}

export const UnitList: React.FC<UnitListProps> = ({ currentYear }) => {
  const [units, setUnits] = useState<UnitMaster[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Partial<UnitMaster>>({
    name: "",
    rate: 0
  });

  useEffect(() => {
    loadUnits();
  }, [currentYear]);

  const loadUnits = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getUnits(currentYear);
      setUnits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit.name?.trim()) return;

    try {
      await apiClient.saveUnit(currentYear, editingUnit);
      setIsModalOpen(false);
      loadUnits();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-semibold text-base text-slate-800">Units & Labor Rates</h3>
          <p className="text-xs text-slate-500">Defines measurement units and default sheet folding piece rates.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadUnits} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setEditingUnit({ name: "", rate: 0 });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl">
        <table className="w-full text-left text-sm divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3">Unit / Job Name</th>
              <th className="px-4 py-3 text-right">Standard Rate (₹)</th>
              <th className="px-4 py-3 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-xs">
            {units.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">No units defined.</td>
              </tr>
            ) : (
              units.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                    ₹{u.rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setEditingUnit({ ...u });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-primary-600 rounded-md"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="flex flex-col w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-base text-slate-800">Unit Master</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Unit / Description *</label>
                <input
                  type="text"
                  required
                  value={editingUnit.name || ""}
                  onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                  placeholder="e.g. 16 PAGE FOLDING, REAMS"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Rate (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editingUnit.rate || 0}
                  onChange={(e) => setEditingUnit({ ...editingUnit, rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
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
                Save Unit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

