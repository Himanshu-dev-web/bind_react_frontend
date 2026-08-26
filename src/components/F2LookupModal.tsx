import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface LookupItem {
  id: string | number;
  primary: string;
  secondary?: string;
  meta?: string;
  data: any;
}

interface F2LookupModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  items: LookupItem[];
  placeholder?: string;
}

export const F2LookupModal: React.FC<F2LookupModalProps> = ({
  title,
  isOpen,
  onClose,
  onSelect,
  items = [],
  placeholder = "Type to search..."
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const safeItems = Array.isArray(items) ? items : [];

  const filteredItems = safeItems.filter((item) => {
    if (!item) return false;
    const q = (searchTerm || "").toLowerCase().trim();
    const primary = String(item.primary || "").toLowerCase();
    const secondary = String(item.secondary || "").toLowerCase();
    const meta = String(item.meta || "").toLowerCase();
    return primary.includes(q) || secondary.includes(q) || meta.includes(q);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        onSelect(filteredItems[selectedIndex].data);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement && listRef.current) {
      const list = listRef.current;
      const top = selectedElement.offsetTop;
      const bottom = top + selectedElement.offsetHeight;
      if (top < list.scrollTop) {
        list.scrollTop = top;
      } else if (bottom > list.scrollTop + list.offsetHeight) {
        list.scrollTop = bottom - list.offsetHeight;
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-primary-400" />
            <h3 className="font-bold text-sm tracking-wide">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 px-1">
            <span>↑↓ to navigate, ENTER to select, ESC to exit</span>
            <span>{filteredItems.length} match{filteredItems.length === 1 ? "" : "es"}</span>
          </div>
        </div>

        {/* List */}
        <div ref={listRef} className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[50vh]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No matching records found.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => {
                  onSelect(item.data);
                  onClose();
                }}
                className={`px-4 py-2.5 cursor-pointer flex flex-col transition-colors ${
                  idx === selectedIndex
                    ? "bg-primary-50 text-primary-900 border-l-4 border-primary-600 pl-3"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{item.primary}</span>
                  {item.meta && (
                    <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.meta}
                    </span>
                  )}
                </div>
                {item.secondary && (
                  <span className="text-xs text-slate-500 mt-0.5">{item.secondary}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
