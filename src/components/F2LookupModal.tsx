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
  items,
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

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.primary.toLowerCase().includes(q) ||
      (item.secondary && item.secondary.toLowerCase().includes(q)) ||
      (item.meta && item.meta.toLowerCase().includes(q))
    );
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">Press ↑ ↓ to navigate, Enter to select, Esc to close</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-[300px]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No matching records found.</div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.data);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-6 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected ? "bg-primary-50 text-primary-900 border-l-4 border-primary-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm text-slate-900">{item.primary}</div>
                    {item.secondary && <div className="text-xs text-slate-500 mt-0.5">{item.secondary}</div>}
                  </div>
                  {item.meta && (
                    <div className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                      {item.meta}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

