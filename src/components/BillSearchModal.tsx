import React, { useState, useEffect, useRef } from "react";
import { InvoiceHeader } from "../types/index.js";

interface BillSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (invoice: InvoiceHeader) => void;
  invoices: InvoiceHeader[];
}

export const BillSearchModal: React.FC<BillSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  invoices
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    const invNoStr = String(inv.invoiceNo);
    const formattedStr = (inv.formattedInvoiceNo || "").toLowerCase();
    const dateStr = (inv.invoiceDate || "").toLowerCase();
    const firmStr = (inv.firmName || "").toLowerCase();
    const custStr = (inv.customerName || "").toLowerCase();

    return (
      invNoStr.startsWith(q) ||
      invNoStr.includes(q) ||
      formattedStr.includes(q) ||
      custStr.includes(q) ||
      firmStr.includes(q) ||
      dateStr.includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredInvoices.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredInvoices[selectedIndex]) {
        onSelect(filteredInvoices[selectedIndex]);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden border-2 border-slate-600 animate-in fade-in zoom-in-95 duration-100 font-sans">
        {/* Legacy-matching Title Bar (Select Item) */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold text-xs select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-300 inline-block"></span>
            <span>Select Item</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Bar matching screenshot */}
        <div className="p-2 bg-slate-100 border-b border-slate-300">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type Bill No, Customer, or Firm to filter..."
              className="w-full px-3 py-1.5 bg-white border border-blue-500 rounded font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tabular Grid matching screenshot */}
        <div ref={tableRef} className="max-h-[380px] min-h-[260px] overflow-y-auto bg-white">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead className="bg-slate-200 text-slate-800 font-bold border-b border-slate-400 sticky top-0 z-10">
              <tr>
                <th className="py-1.5 px-3 w-24 border-r border-slate-300">INVOICENO</th>
                <th className="py-1.5 px-3 w-32 border-r border-slate-300">INVOICEDA...</th>
                <th className="py-1.5 px-3 w-56 border-r border-slate-300">SUBLEDGER</th>
                <th className="py-1.5 px-3">Party</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    No matching bills found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <tr
                      key={`${inv.firmName}-${inv.invoiceNo}`}
                      onClick={() => {
                        onSelect(inv);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`cursor-pointer select-none transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white font-semibold"
                          : "hover:bg-blue-50 text-slate-900"
                      }`}
                    >
                      <td className={`py-1.5 px-3 font-mono font-bold border-r ${isSelected ? "border-blue-500 text-white" : "border-slate-200 text-blue-900"}`}>
                        {inv.invoiceNo}
                      </td>
                      <td className={`py-1.5 px-3 border-r ${isSelected ? "border-blue-500 text-white" : "border-slate-200 text-slate-700"}`}>
                        {inv.invoiceDate ? inv.invoiceDate.split("-").reverse().join("/") : "—"}
                      </td>
                      <td className={`py-1.5 px-3 font-semibold border-r truncate max-w-[180px] ${isSelected ? "border-blue-500 text-white" : "border-slate-200 text-slate-800"}`}>
                        {inv.firmName || "SUNIL BOOK BINDING HOUSE"}
                      </td>
                      <td className={`py-1.5 px-3 truncate max-w-[240px] font-medium ${isSelected ? "text-white" : "text-slate-900"}`}>
                        {inv.customerName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-600">
          <span>
            Total: <strong>{filteredInvoices.length}</strong> records (Press ↑ ↓ to navigate, <strong>Enter</strong> to select)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold border border-slate-400 cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

