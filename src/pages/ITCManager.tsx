import React, { useState, useEffect, useRef } from "react";
import {
  Inbox,
  Send,
  BookOpen,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PackageCheck,
  PackageX
} from "lucide-react";
import { apiClient } from "../api/client.js";
import { ITCRecord, ITCLedgerSummary, Item } from "../types/index.js";
import { F2LookupModal } from "../components/F2LookupModal.js";

interface ITCManagerProps {
  currentYear: string;
}

type ITCTab = "received" | "delivered" | "ledger";

export const ITCManager: React.FC<ITCManagerProps> = ({ currentYear }) => {
  const [activeTab, setActiveTab] = useState<ITCTab>("received");

  // Masters
  const [itemGroups, setItemGroups] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isItemLookupOpen, setIsItemLookupOpen] = useState(false);

  // Form State
  const [entryNo, setEntryNo] = useState<number>(1);
  const [entDate, setEntDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedBookName, setSelectedBookName] = useState<string>("");
  const [innerPaperCover, setInnerPaperCover] = useState<string>("Cover");
  const [challanNo, setChallanNo] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [descr, setDescr] = useState<string>("");

  // Records Table & Pagination
  const [records, setRecords] = useState<ITCRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Ledger Statement State
  const [ledgerSummary, setLedgerSummary] = useState<ITCLedgerSummary | null>(null);
  const [ledgerGroup, setLedgerGroup] = useState<string>("ALL");
  const [ledgerBook, setLedgerBook] = useState<string>("");
  const [ledgerFromDate, setLedgerFromDate] = useState<string>("");
  const [ledgerToDate, setLedgerToDate] = useState<string>("");
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    loadMasters();
  }, [currentYear]);

  useEffect(() => {
    if (activeTab === "received" || activeTab === "delivered") {
      loadNextNo();
      loadRecords();
    } else if (activeTab === "ledger") {
      loadLedger();
    }
  }, [currentYear, activeTab, filterGroup]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGroup, pageSize, activeTab]);

  const loadMasters = async () => {
    try {
      const [groups, its] = await Promise.all([
        apiClient.getItemGroups(currentYear),
        apiClient.getItems(currentYear)
      ]);
      setItemGroups(groups);
      setAllItems(its);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNextNo = async () => {
    try {
      const next = await apiClient.getNextITCEntryNo(currentYear);
      setEntryNo(next);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const issueRec = activeTab === "received" ? "R" : "D";
      const data = await apiClient.getITCRecords(currentYear, issueRec, filterGroup, undefined, searchTerm);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async () => {
    setLoadingLedger(true);
    try {
      const data = await apiClient.getITCLedger(
        currentYear,
        ledgerGroup,
        ledgerBook,
        ledgerFromDate,
        ledgerToDate
      );
      setLedgerSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookName.trim()) {
      setStatusMessage({ type: "error", text: "Please select a Book Title." });
      return;
    }
    const numQty = parseFloat(qty);
    if (isNaN(numQty) || numQty <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid Quantity." });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const payload: ITCRecord = {
      entryNo,
      entDate,
      bookName: selectedBookName,
      bgp: selectedGroup,
      innerPaperCover: activeTab === "received" ? innerPaperCover : undefined,
      challanNo,
      qty: numQty,
      descr,
      issueRec: activeTab === "received" ? "R" : "D"
    };

    try {
      await apiClient.saveITCRecord(currentYear, payload);
      setStatusMessage({
        type: "success",
        text: `ITC ${activeTab === "received" ? "Received" : "Delivered"} Entry #${entryNo} saved successfully!`
      });
      handleClear();
      loadRecords();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save ITC record." });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    loadNextNo();
    setSelectedBookName("");
    setChallanNo("");
    setQty("");
    setDescr("");
  };

  const handleDelete = async (rec: ITCRecord) => {
    if (!window.confirm(`Are you sure you want to delete Entry #${rec.entryNo} (${rec.bookName})?`)) return;
    try {
      await apiClient.deleteITCRecord(currentYear, rec.entryNo);
      setStatusMessage({ type: "success", text: `Entry #${rec.entryNo} deleted.` });
      loadRecords();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete record." });
    }
  };

  const handleSelectBook = (it: Item) => {
    setSelectedBookName(it.itemName);
    setSelectedGroup(it.itemGp || selectedGroup);
    setIsItemLookupOpen(false);
  };

  // Filtered items based on selected group
  const availableItems = selectedGroup && selectedGroup !== "ALL"
    ? allItems.filter((it) => it.itemGp === selectedGroup)
    : allItems;

  // Pagination
  const totalRecords = records.length;
  const effectivePageSize = pageSize === -1 ? totalRecords : pageSize;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalRecords);
  const currentRecords = records.slice(startIndex, endIndex);
  const totalQtySum = records.reduce((acc, r) => acc + (r.qty || 0), 0);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Header & Sub-Tabs Navigation */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">I.T.C. Book Management (Input Tax Credit / Job Work)</h2>
            <p className="text-[11px] text-slate-500">Track Inward Material Received, Outward Book Deliveries & Job Work Ledger</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab("received")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "received"
                ? "bg-white text-indigo-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-emerald-600" />
            I.T.C. Received ...
          </button>
          <button
            onClick={() => setActiveTab("delivered")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "delivered"
                ? "bg-white text-indigo-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-600" />
            I.T.C. Delivered ...
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === "ledger"
                ? "bg-white text-indigo-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            I.T.C. Book Ledger...
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "bg-red-50 text-red-800 border border-red-300"
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

      {/* VIEW 1 & 2: RECEIVED / DELIVERED ENTRY & HISTORY */}
      {(activeTab === "received" || activeTab === "delivered") && (
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* LEFT: Entry Form */}
          <form
            onSubmit={handleSave}
            className="col-span-12 lg:col-span-4 bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                {activeTab === "received" ? (
                  <>
                    <PackageCheck className="w-4 h-4 text-emerald-600" /> Inward Material Received Entry
                  </>
                ) : (
                  <>
                    <PackageX className="w-4 h-4 text-sky-600" /> Outward Book Delivery Entry
                  </>
                )}
              </span>
              <span className="font-mono text-slate-500 font-bold text-[11px]">#{entryNo}</span>
            </div>

            {/* Entry No & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Entry No :</label>
                <input
                  type="number"
                  value={entryNo}
                  onChange={(e) => setEntryNo(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Date :</label>
                <input
                  type="date"
                  value={entDate}
                  onChange={(e) => setEntDate(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px]"
                />
              </div>
            </div>

            {/* Book Group */}
            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Book Group :</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">-- Select Group --</option>
                {itemGroups.map((gp) => (
                  <option key={gp} value={gp}>
                    {gp}
                  </option>
                ))}
              </select>
            </div>

            {/* Book Title (with F2 Search) */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-slate-700">Book Name / Title * :</span>
                <button
                  type="button"
                  onClick={() => setIsItemLookupOpen(true)}
                  className="text-[10px] text-indigo-700 hover:underline font-bold"
                >
                  F2 Search
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={selectedBookName}
                  onChange={(e) => setSelectedBookName(e.target.value)}
                  onKeyDown={(e) => e.key === "F2" && setIsItemLookupOpen(true)}
                  placeholder="Select or search title..."
                  className="w-full pl-2 pr-7 py-1 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setIsItemLookupOpen(true)}
                  className="absolute right-1.5 p-0.5 text-slate-400 hover:text-indigo-600"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Material Type (Only for Received: Inner / Cover / Paper) */}
            {activeTab === "received" && (
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Inner / Cover / Paper :</label>
                <select
                  value={innerPaperCover}
                  onChange={(e) => setInnerPaperCover(e.target.value)}
                  className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 rounded font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Cover">Cover</option>
                  <option value="Inner">Inner</option>
                  <option value="Paper">Paper</option>
                  <option value="I+P">I+P (Inner + Paper)</option>
                  <option value="I+C">I+C (Inner + Cover)</option>
                  <option value="P+C">P+C (Paper + Cover)</option>
                  <option value="I+P+C">I+P+C (Inner + Paper + Cover)</option>
                </select>
              </div>
            )}

            {/* Challan No & Quantity */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Challan No :</label>
                <input
                  type="text"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  placeholder="Slip / Challan"
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Quantity * :</label>
                <input
                  type="number"
                  required
                  step="any"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1 bg-yellow-50 border border-yellow-400 rounded font-mono font-bold text-slate-900 text-right"
                />
              </div>
            </div>

            {/* Description / Slip Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-0.5">Description / Slip Remarks :</label>
              <textarea
                rows={2}
                value={descr}
                onChange={(e) => setDescr(e.target.value)}
                placeholder="e.g. 12X20+3 SLIP NO-87"
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-slate-900 text-xs"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving..." : "Save Entry"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </form>

          {/* RIGHT: Records History Table */}
          <div className="col-span-12 lg:col-span-8 bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadRecords()}
                    placeholder="Search title, challan, desc..."
                    className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Group Filter */}
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Book Groups</option>
                  {itemGroups.map((gp) => (
                    <option key={gp} value={gp}>
                      {gp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Summary Badge */}
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-md font-mono font-bold text-[11px]">
                  Total Qty: {totalQtySum.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={loadRecords}
                  disabled={loading}
                  className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto relative min-h-[300px]">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span className="text-xs font-bold">Loading ITC Records...</span>
                  </div>
                </div>
              )}

              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 w-12 text-center">Entry</th>
                    <th className="py-2 px-2.5 w-24">Date</th>
                    <th className="py-2 px-2.5">Book Title</th>
                    <th className="py-2 px-2.5">Book Group</th>
                    {activeTab === "received" && <th className="py-2 px-2.5 w-20">Type</th>}
                    <th className="py-2 px-2.5 w-20">Challan</th>
                    <th className="py-2 px-2.5 w-20 text-right">Qty</th>
                    <th className="py-2 px-2.5">Description</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        {loading ? "Loading..." : "No ITC records found."}
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((r) => (
                      <tr key={r.entryNo} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-2.5 text-center font-mono font-bold text-indigo-700">{r.entryNo}</td>
                        <td className="py-1.5 px-2.5 text-slate-600 font-mono">{r.entDate}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{r.bookName}</td>
                        <td className="py-1.5 px-2.5 text-slate-600 text-[11px] truncate max-w-[150px]">{r.bgp}</td>
                        {activeTab === "received" && (
                          <td className="py-1.5 px-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              {r.innerPaperCover || "Cover"}
                            </span>
                          </td>
                        )}
                        <td className="py-1.5 px-2.5 font-mono">{r.challanNo || "—"}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">{r.qty}</td>
                        <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[11px]">{r.descr || "—"}</td>
                        <td className="py-1.5 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalRecords > 0 && (
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                <div>
                  Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-slate-900">{endIndex}</span> of{" "}
                  <span className="font-bold text-slate-900">{totalRecords}</span> entries
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-bold text-slate-800">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ITC BOOK LEDGER / STATEMENT */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Book Group :</label>
                <select
                  value={ledgerGroup}
                  onChange={(e) => setLedgerGroup(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800 text-xs cursor-pointer"
                >
                  <option value="ALL">All Book Groups</option>
                  {itemGroups.map((gp) => (
                    <option key={gp} value={gp}>
                      {gp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Book Title / Item :</label>
                <input
                  type="text"
                  value={ledgerBook}
                  onChange={(e) => setLedgerBook(e.target.value)}
                  placeholder="Filter specific book..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">From Date :</label>
                <input
                  type="date"
                  value={ledgerFromDate}
                  onChange={(e) => setLedgerFromDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">To Date :</label>
                <input
                  type="date"
                  value={ledgerToDate}
                  onChange={(e) => setLedgerToDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={loadLedger}
                disabled={loadingLedger}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer text-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLedger ? "animate-spin" : ""}`} />
                Generate Statement
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Statement
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {ledgerSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <div className="text-[11px] font-semibold text-emerald-800">Total Material Received</div>
                <div className="text-xl font-mono font-extrabold text-emerald-950 mt-0.5">
                  {ledgerSummary.totalReceived.toLocaleString()} Qty
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl">
                <div className="text-[11px] font-semibold text-sky-800">Total Books Delivered</div>
                <div className="text-xl font-mono font-extrabold text-sky-950 mt-0.5">
                  {ledgerSummary.totalDelivered.toLocaleString()} Qty
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl">
                <div className="text-[11px] font-semibold text-indigo-800">Net Pending Balance Qty</div>
                <div className="text-xl font-mono font-extrabold text-indigo-950 mt-0.5">
                  {ledgerSummary.balanceQty.toLocaleString()} Qty
                </div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden relative">
            {loadingLedger && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span className="text-xs font-bold">Calculating ITC Ledger...</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-24">Date</th>
                    <th className="py-2.5 px-3 w-20">Challan</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Book Group</th>
                    <th className="py-2.5 px-3">Particulars / Description</th>
                    <th className="py-2.5 px-3 w-24 text-right bg-emerald-50/50">Received Qty</th>
                    <th className="py-2.5 px-3 w-24 text-right bg-sky-50/50">Delivered Qty</th>
                    <th className="py-2.5 px-3 w-24 text-right bg-indigo-50/50">Balance Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!ledgerSummary || ledgerSummary.entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {loadingLedger ? "Calculating..." : "No ledger entries found for selected criteria."}
                      </td>
                    </tr>
                  ) : (
                    ledgerSummary.entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono text-slate-600">{entry.date}</td>
                        <td className="py-2 px-3 font-mono font-semibold">{entry.challanNo || "—"}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{entry.bookName}</td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[150px]">{entry.bgp}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          <span className="font-semibold text-slate-700 mr-1">[{entry.type}]</span>
                          {entry.descr}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          {entry.receivedQty > 0 ? entry.receivedQty : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-sky-700 bg-sky-50/30">
                          {entry.deliveredQty > 0 ? entry.deliveredQty : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-indigo-900 bg-indigo-50/30">
                          {entry.balanceQty}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Book Title F2 Lookup Modal */}
      <F2LookupModal
        title="Select Book Title (F2)"
        isOpen={isItemLookupOpen}
        onClose={() => setIsItemLookupOpen(false)}
        onSelect={handleSelectBook}
        items={availableItems.map((it) => ({
          id: String(it.autoId || it.itemName),
          primary: it.itemName,
          secondary: `${it.itemGp || ""} | Rate: ₹${it.rate.toFixed(2)}`,
          data: it
        }))}
      />
    </div>
  );
};

