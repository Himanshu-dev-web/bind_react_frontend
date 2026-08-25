import React, { useState, useEffect } from "react";
import { Search, Printer, Trash2, RefreshCw, Building2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { apiClient } from "../api/client.js";
import { InvoiceHeader, InvoiceType, CompanyProfile, Firm } from "../types/index.js";
import { InvoicePrintModal } from "../components/InvoicePrintModal.js";

interface InvoiceListProps {
  currentYear: string;
  company: CompanyProfile;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ currentYear, company }) => {
  const [invoices, setInvoices] = useState<InvoiceHeader[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<InvoiceType>("TAXINVOICE");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Pagination State (Default 10 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHeader | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [amountInWords, setAmountInWords] = useState<string>("");

  useEffect(() => {
    loadFirms();
  }, [currentYear]);

  useEffect(() => {
    loadInvoices();
  }, [currentYear, selectedType, selectedFirm]);

  // Reset page when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFirm, selectedType, searchTerm, pageSize]);

  const loadFirms = async () => {
    try {
      const f = await apiClient.getFirms(currentYear);
      setFirms(f);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getInvoices(currentYear, selectedType, searchTerm, selectedFirm);
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (inv: InvoiceHeader) => {
    try {
      const data = await apiClient.getInvoiceByNo(currentYear, inv.invoiceNo, inv.invoiceType, inv.firmName);
      setSelectedInvoice(data.invoice);
      setAmountInWords(data.amountInWords);
      setIsPrintModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (inv: InvoiceHeader) => {
    if (!window.confirm(`Are you sure you want to delete Invoice #${inv.formattedInvoiceNo || inv.invoiceNo}?`)) {
      return;
    }
    try {
      await apiClient.deleteInvoice(currentYear, inv.invoiceNo, inv.invoiceType, inv.firmName);
      loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination Calculations
  const totalRecords = invoices.length;
  const effectivePageSize = pageSize === -1 ? totalRecords : pageSize;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalRecords);
  const currentInvoices = invoices.slice(startIndex, endIndex);

  const currentFirmObj = firms.find((f) => f.name === selectedInvoice?.firmName);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Firm Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Firm:</span>
            <select
              value={selectedFirm}
              onChange={(e) => setSelectedFirm(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Firms</option>
              {firms.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as InvoiceType)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="TAXINVOICE">TAX INVOICE (GST)</option>
            <option value="SALEINVOICE">SALE INVOICE</option>
            <option value="BILL">BILL</option>
            <option value="CASH MEMO">CASH MEMO</option>
            <option value="CHALLAN/TRANSFER INVOICE">CHALLAN / TRANSFER</option>
            <option value="PERFORMAINVOICE">PERFORMA INVOICE</option>
          </select>

          {/* Records per page dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-600 font-semibold">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
              <option value={-1}>All records</option>
            </select>
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadInvoices()}
              placeholder="Search invoice or customer..."
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>
          <button
            onClick={loadInvoices}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3">Inv No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Billing Firm</th>
                <th className="px-4 py-3">Customer / Consignee</th>
                <th className="px-4 py-3 text-right">Taxable (₹)</th>
                <th className="px-4 py-3 text-right">GST (₹)</th>
                <th className="px-4 py-3 text-right">Grand Total (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {loading ? "Loading invoices..." : "No invoices found for this criteria."}
                  </td>
                </tr>
              ) : (
                currentInvoices.map((inv) => (
                  <tr key={`${inv.firmName}-${inv.invoiceNo}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary-700">
                      {inv.formattedInvoiceNo || `#${inv.invoiceNo}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold">
                        {inv.firmName || "SUNIL BOOK BINDING HOUSE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">₹{inv.subTotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">₹{inv.taxAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrint(inv)}
                          title="Print / View Invoice"
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv)}
                          title="Delete Invoice"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalRecords > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-slate-900">{endIndex}</span> of{" "}
              <span className="font-bold text-slate-900">{totalRecords}</span> invoices
            </div>

            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                            currentPage === page
                              ? "bg-primary-600 text-white shadow-sm"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

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

      {/* Print / View Modal */}
      {selectedInvoice && (
        <InvoicePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          invoice={selectedInvoice}
          company={company}
          firm={currentFirmObj}
          amountInWords={amountInWords}
        />
      )}
    </div>
  );
};
