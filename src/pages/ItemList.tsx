import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Save, X, RefreshCw, BookOpen, Layers } from "lucide-react";
import { apiClient } from "../api/client.js";
import { Item } from "../types/index.js";

interface ItemListProps {
  currentYear: string;
}

export const ItemList: React.FC<ItemListProps> = ({ currentYear }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Item>>({
    itemName: "",
    itemGp: "Books",
    unit: "Pcs",
    rate: 0,
    openingStock: 0,
    hsnCode: "",
    remarks: ""
  });

  useEffect(() => {
    loadGroups();
  }, [currentYear]);

  useEffect(() => {
    loadItems();
  }, [currentYear, selectedGroup]);

  const loadGroups = async () => {
    try {
      const g = await apiClient.getItemGroups(currentYear);
      setGroups(g);
    } catch (err) {
      console.error(err);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getItems(currentYear, selectedGroup, searchTerm);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.itemName?.trim()) return;

    try {
      await apiClient.saveItem(currentYear, editingItem);
      setIsModalOpen(false);
      loadItems();
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingItem({
      itemName: "",
      itemGp: groups[0] || "Books",
      unit: "Pcs",
      rate: 0,
      openingStock: 0,
      hsnCode: "",
      remarks: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters & Group Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadItems()}
              placeholder="Search item, title, or HSN code..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              <option value="ALL">All Item Groups ({items.length})</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadItems}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item / Book
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3">Item / Book Title</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">HSN Code</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3 text-right">Default Rate (₹)</th>
                <th className="px-4 py-3 text-right">Opening Stock</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {loading ? "Loading items..." : "No items found for selected group."}
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.autoId || it.itemName} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{it.autoId}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{it.itemName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        {it.itemGp}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{it.hsnCode || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{it.unit || "Pcs"}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                      ₹{it.rate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{it.openingStock}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEditModal(it)}
                        title="Edit Item"
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
                {editingItem.autoId ? "Edit Item / Book Title" : "New Item Master"}
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
                <label className="block text-slate-600 font-semibold mb-1">Item Description / Title Name *</label>
                <input
                  type="text"
                  required
                  value={editingItem.itemName || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  placeholder="e.g. ITC FOCUS GANIT-IX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Item Group</label>
                  <input
                    type="text"
                    value={editingItem.itemGp || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, itemGp: e.target.value })}
                    placeholder="e.g. Books, Paper, Plates"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={editingItem.hsnCode || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, hsnCode: e.target.value })}
                    placeholder="e.g. 998898"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    value={editingItem.unit || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    placeholder="Pcs, Reams"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Standard Rate (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.rate || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.openingStock || 0}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, openingStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

