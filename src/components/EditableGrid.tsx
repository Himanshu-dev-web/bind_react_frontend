import React, { useRef, useEffect } from "react";
import { Trash2, Plus, Search } from "lucide-react";
import { InvoiceLineItem, Item } from "../types/index.js";

interface EditableGridProps {
  items: InvoiceLineItem[];
  onChange: (items: InvoiceLineItem[]) => void;
  onOpenItemLookup: (index: number) => void;
  bookGroups?: string[];
  allItems?: Item[];
}

const TYPE_OPTIONS = [
  "Title",
  "Book",
  "Inner",
  "HB",
  "I+P",
  "I+C+P",
  "I+C",
  "P+C",
  "Paper",
  "Stich",
  "CD",
  "Supp.",
  "Cutting",
  "Booklet",
  "Poster"
];

export const EditableGrid: React.FC<EditableGridProps> = ({
  items,
  onChange,
  onOpenItemLookup,
  bookGroups = [],
  allItems = []
}) => {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleCellChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === "qty" || field === "rate") {
      const qty = field === "qty" ? parseFloat(value) || 0 : item.qty || 0;
      const rate = field === "rate" ? parseFloat(value) || 0 : item.rate || 0;
      item.amount = Number((qty * rate).toFixed(2));
    } else if (field === "amount") {
      item.amount = parseFloat(value) || 0;
    } else if (field === "itemName" && value && allItems.length > 0) {
      // Auto-populate group & rate if matched from catalog
      const match = allItems.find(
        (it) => it.itemName.trim().toLowerCase() === String(value).trim().toLowerCase()
      );
      if (match) {
        if (!item.description) item.description = match.itemGp || "";
        if (!item.rate || item.rate === 1) {
          item.rate = match.rate || 1;
          item.amount = Number(((item.qty || 0) * (match.rate || 1)).toFixed(2));
        }
      }
    }

    updated[index] = item;
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
    if (e.key === "F2") {
      e.preventDefault();
      onOpenItemLookup(index);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (field === "amount" || field === "qty") {
        if (index === items.length - 1) {
          addRow();
        } else {
          inputRefs.current[`${index + 1}_description`]?.focus();
        }
      }
    }
  };

  const addRow = () => {
    const nextSNo = items.length > 0 ? Math.max(...items.map((i) => i.sNo || 0)) + 1 : 1;
    onChange([
      ...items,
      {
        sNo: nextSNo,
        remarks: "Title",
        description: items[items.length - 1]?.description || "",
        itemName: "",
        hsnCode: "",
        rate: 1,
        qty: 0,
        amount: 0
      }
    ]);
    setTimeout(() => {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) {
      onChange([
        {
          sNo: 1,
          remarks: "Title",
          description: "",
          itemName: "",
          hsnCode: "",
          rate: 1,
          qty: 0,
          amount: 0
        }
      ]);
      return;
    }
    const updated = items.filter((_, i) => i !== index).map((it, idx) => ({ ...it, sNo: idx + 1 }));
    onChange(updated);
  };

  return (
    <div className="border border-emerald-600 rounded-lg shadow-sm overflow-hidden bg-white">
      {/* Autocomplete datalist for Book Groups */}
      <datalist id="book-groups-datalist">
        {bookGroups.map((grp) => (
          <option key={grp} value={grp} />
        ))}
      </datalist>

      {/* Scrollable Table Viewport with Sticky Header */}
      <div
        ref={tableContainerRef}
        className="max-h-[380px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-slate-100"
      >
        <table className="w-full text-left text-xs border-collapse bg-white">
          {/* Sticky Green Header matching legacy VB6 VSFlexGrid */}
          <thead className="bg-[#bbf7d0] text-emerald-950 font-bold border-b border-emerald-600 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="py-2 px-2.5 w-12 text-center border-r border-emerald-400 bg-[#bbf7d0]">S.No</th>
              <th className="py-2 px-2.5 w-24 text-left border-r border-emerald-400 bg-[#bbf7d0]">Type</th>
              <th className="py-2 px-2.5 w-48 text-left border-r border-emerald-400 bg-[#bbf7d0]">Book Group</th>
              <th className="py-2 px-2.5 text-left border-r border-emerald-400 bg-[#bbf7d0]">Books Name (F2 Search)</th>
              <th className="py-2 px-2.5 w-16 text-center border-r border-emerald-400 bg-[#bbf7d0]">Farm</th>
              <th className="py-2 px-2.5 w-20 text-right border-r border-emerald-400 bg-[#bbf7d0]">Rate</th>
              <th className="py-2 px-2.5 w-20 text-right border-r border-emerald-400 bg-[#bbf7d0]">Qty</th>
              <th className="py-2 px-2.5 w-24 text-right border-r border-emerald-400 bg-[#bbf7d0]">Amount</th>
              <th className="py-2 px-1 w-8 text-center bg-[#bbf7d0]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                {/* S.No */}
                <td className="py-1 px-2 text-center font-mono text-slate-600 bg-slate-50/80 border-r border-slate-200">
                  {item.sNo || idx + 1}
                </td>

                {/* Type */}
                <td className="py-1 px-1 border-r border-slate-200">
                  <select
                    value={item.remarks || "Title"}
                    onChange={(e) => handleCellChange(idx, "remarks", e.target.value)}
                    className="w-full px-1 py-1 bg-transparent border-0 font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 rounded"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Book Group */}
                <td className="py-1 px-1 border-r border-slate-200">
                  <input
                    ref={(el) => (inputRefs.current[`${idx}_description`] = el)}
                    type="text"
                    list="book-groups-datalist"
                    value={item.description || ""}
                    onChange={(e) => handleCellChange(idx, "description", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, "description")}
                    placeholder="Book Group..."
                    className="w-full px-2 py-1 bg-transparent border-0 font-medium text-slate-800 uppercase focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 rounded"
                  />
                </td>

                {/* Books Name (F2 Search) */}
                <td className="py-1 px-1 border-r border-slate-200">
                  <div className="relative flex items-center">
                    <input
                      ref={(el) => (inputRefs.current[`${idx}_itemName`] = el)}
                      type="text"
                      value={item.itemName || ""}
                      onChange={(e) => handleCellChange(idx, "itemName", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "itemName")}
                      placeholder="Press F2 to search title..."
                      className="w-full pl-2 pr-6 py-1 bg-transparent border-0 font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenItemLookup(idx)}
                      tabIndex={-1}
                      className="absolute right-1 p-0.5 text-slate-400 hover:text-primary-600 rounded cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>

                {/* Farm / HSN */}
                <td className="py-1 px-1 border-r border-slate-200">
                  <input
                    type="text"
                    value={item.hsnCode || ""}
                    onChange={(e) => handleCellChange(idx, "hsnCode", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, "hsnCode")}
                    placeholder=""
                    className="w-full px-1 py-1 text-center bg-transparent border-0 font-mono text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 rounded"
                  />
                </td>

                {/* Rate */}
                <td className="py-1 px-1 border-r border-slate-200">
                  <input
                    type="number"
                    step="any"
                    value={item.rate === 0 ? "" : item.rate}
                    onChange={(e) => handleCellChange(idx, "rate", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, "rate")}
                    placeholder="0.00"
                    className="w-full px-2 py-1 text-right bg-transparent border-0 font-mono font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 rounded"
                  />
                </td>

                {/* Qty */}
                <td className="py-1 px-1 border-r border-slate-200">
                  <input
                    type="number"
                    value={item.qty === 0 ? "" : item.qty}
                    onChange={(e) => handleCellChange(idx, "qty", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, "qty")}
                    placeholder="0"
                    className="w-full px-2 py-1 text-right bg-transparent border-0 font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 rounded"
                  />
                </td>

                {/* Amount */}
                <td className="py-1 px-1 border-r border-slate-200">
                  <input
                    type="number"
                    step="any"
                    value={item.amount === 0 ? "" : item.amount}
                    onChange={(e) => handleCellChange(idx, "amount", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, "amount")}
                    placeholder="0.00"
                    className="w-full px-2 py-1 text-right bg-slate-50 border-0 font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 rounded"
                  />
                </td>

                {/* Action Remove */}
                <td className="py-1 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    tabIndex={-1}
                    className="text-slate-300 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Footer Controls */}
      <div className="p-1.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px]">
        <span className="text-slate-500">
          Total Items: <strong>{items.length}</strong> | Press <strong>F2</strong> on Book Name for Title Lookup | <strong>ENTER</strong> on Amount to Add Row
        </span>
        <button
          type="button"
          onClick={addRow}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Row
        </button>
      </div>
    </div>
  );
};
