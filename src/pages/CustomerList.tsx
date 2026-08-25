import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Save, X, RefreshCw, UserCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { apiClient } from "../api/client.js";
import { Customer } from "../types/index.js";

interface CustomerListProps {
  currentYear: string;
}

export const CustomerList: React.FC<CustomerListProps> = ({ currentYear }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({
    name: "",
    address1: "",
    city: "",
    state: "",
    phone: "",
    gstin: "",
    pan: "",
    opBal: 0,
    drCr: "Dr"
  });

  useEffect(() => {
    loadCustomers();
  }, [currentYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCustomers(currentYear, searchTerm);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer.name?.trim()) return;

    setSaving(true);
    try {
      await apiClient.saveCustomer(currentYear, editingCustomer);
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const openNewModal = () => {
    setEditingCustomer({
      name: "",
      address1: "",
      city: "",
      state: "",
      phone: "",
      gstin: "",
      pan: "",
      opBal: 0,
      drCr: "Dr"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer({ ...cust });
    setIsModalOpen(true);
  };

  // Pagination Calculations
  const totalRecords = customers.length;
  const effectivePageSize = pageSize === -1 ? totalRecords : pageSize;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalRecords);
  const currentCustomers = customers.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
              placeholder="Search customer by name, code, or city..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-600 font-semibold">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>All</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            disabled={loading}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary-600" : ""}`} />
          </button>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="bg-slate-900/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
              <span className="font-semibold text-xs">Loading Customers...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Customer Name</th>
                <th className="px-4 py-2.5">City / State</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">GSTIN / PAN</th>
                <th className="px-4 py-2.5 text-right">Opening Bal</th>
                <th className="px-4 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? "Loading customer master..." : "No customers found."}
                  </td>
                </tr>
              ) : (
                currentCustomers.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-mono text-slate-400">{cust.code || "—"}</td>
                    <td className="px-4 py-2 font-semibold text-slate-900">{cust.name}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {cust.city || cust.state ? `${cust.city || ""} ${cust.state ? `(${cust.state})` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{cust.phone || cust.email || "—"}</td>
                    <td className="px-4 py-2 font-mono text-slate-600">{cust.gstin || cust.pan || "—"}</td>
                    <td className="px-4 py-2 text-right font-mono font-medium text-slate-800">
                      {cust.opBal ? `₹${cust.opBal.toFixed(2)} ${cust.drCr || "Dr"}` : "₹0.00"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => openEditModal(cust)}
                        title="Edit Customer"
                        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors cursor-pointer"
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

        {/* Pagination Footer */}
        {totalRecords > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-slate-600">
              Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-slate-900">{endIndex}</span> of{" "}
              <span className="font-bold text-slate-900">{totalRecords}</span> customers
            </div>

            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                <span className="px-2 font-bold text-slate-800">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="flex flex-col w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-800">
                {editingCustomer.code ? "Edit Customer" : "New Customer Master"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer / Business Name *</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="Enter full customer name"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  value={editingCustomer.address1 || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address1: e.target.value })}
                  placeholder="Premises, Street, Area"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={editingCustomer.city || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={editingCustomer.state || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, state: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={editingCustomer.gstin || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, gstin: e.target.value })}
                    placeholder="15-digit GSTIN"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingCustomer.opBal || 0}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, opBal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Balance Type</label>
                  <select
                    value={editingCustomer.drCr || "Dr"}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, drCr: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Dr">Dr (Receivable from Customer)</option>
                    <option value="Cr">Cr (Payable / Advance)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
