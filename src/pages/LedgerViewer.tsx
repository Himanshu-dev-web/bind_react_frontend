import React, { useState, useEffect } from "react";
import { Search, Printer, Download, RefreshCw, Calendar, ArrowRight, User } from "lucide-react";
import { apiClient } from "../api/client.js";
import { PartyLedgerStatement, Customer, Supplier, CompanyProfile } from "../types/index.js";
import { F2LookupModal } from "../components/F2LookupModal.js";

interface LedgerViewerProps {
  currentYear: string;
  company: CompanyProfile;
}

export const LedgerViewer: React.FC<LedgerViewerProps> = ({ currentYear, company }) => {
  const [partyType, setPartyType] = useState<"customer" | "supplier">("customer");
  const [partyName, setPartyName] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("2026-04-01");
  const [toDate, setToDate] = useState<string>("2027-03-31");

  const [statement, setStatement] = useState<PartyLedgerStatement | null>(null);
  const [loading, setLoading] = useState(false);

  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  useEffect(() => {
    loadParties();
  }, [currentYear]);

  const loadParties = async () => {
    try {
      const [custs, supps] = await Promise.all([
        apiClient.getCustomers(currentYear),
        apiClient.getSuppliers(currentYear)
      ]);
      setAllCustomers(custs);
      setAllSuppliers(supps);
      if (custs.length > 0 && !partyName) {
        setPartyName(custs[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchLedger = async (targetParty?: string) => {
    const p = targetParty || partyName;
    if (!p) return;

    setLoading(true);
    try {
      const data = await apiClient.getPartyLedger(currentYear, p, partyType, fromDate, toDate);
      setStatement(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!statement) return;
    let csv = `Date,Narration,Debit (Rs),Credit (Rs),Balance (Rs),Type\n`;
    csv += `${statement.fromDate},OPENING BALANCE,0.00,0.00,${statement.openingBalance.toFixed(2)},${statement.openingDrCr}\n`;
    for (const e of statement.entries) {
      csv += `"${e.date}","${e.narration.replace(/"/g, '""')}",${e.debit.toFixed(2)},${e.credit.toFixed(2)},${e.runningBalance.toFixed(2)},${e.description || ""}\n`;
    }
    csv += `TOTALS,,${statement.totalDebit.toFixed(2)},${statement.totalCredit.toFixed(2)},${statement.closingBalance.toFixed(2)},${statement.closingDrCr}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Ledger_${statement.partyName}_${statement.fromDate}_${statement.toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden during Print) */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setPartyType("customer")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  partyType === "customer" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Customer Ledger
              </button>
              <button
                onClick={() => setPartyType("supplier")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  partyType === "supplier" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Supplier Ledger
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statement && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">
              {partyType === "customer" ? "Customer" : "Supplier"} Name (F2 Search)
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                onKeyDown={(e) => e.key === "F2" && setIsLookupOpen(true)}
                placeholder="Type or press F2 to search..."
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setIsLookupOpen(true)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-primary-600 rounded"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => handleFetchLedger()}
              disabled={loading}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5 h-[34px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              View
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Statement Sheet */}
      {statement ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 print:p-0 print:border-none print:shadow-none space-y-6">
          {/* Statement Header */}
          <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">{company.companyName}</h1>
              <p className="text-xs text-slate-500">{company.address1} {company.city}</p>
              <div className="mt-3">
                <span className="text-[11px] font-bold uppercase text-slate-400">Statement of Account For:</span>
                <h2 className="text-lg font-bold text-slate-900">{statement.partyName}</h2>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded font-bold uppercase text-xs">
                General Ledger
              </span>
              <div className="text-xs text-slate-600 mt-2">
                Period: <span className="font-semibold">{statement.fromDate}</span> to <span className="font-semibold">{statement.toDate}</span>
              </div>
              <div className="text-xs text-slate-600">Fiscal Year: {currentYear}</div>
            </div>
          </div>

          {/* Ledger Table */}
          <table className="w-full text-left text-xs divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-700">
              <tr>
                <th className="px-4 py-3 w-28">Date</th>
                <th className="px-4 py-3">Particulars / Narration</th>
                <th className="px-4 py-3 w-32 text-right">Debit (₹)</th>
                <th className="px-4 py-3 w-32 text-right">Credit (₹)</th>
                <th className="px-4 py-3 w-36 text-right">Balance (₹)</th>
                <th className="px-3 py-3 w-16 text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* Opening Balance Row */}
              <tr className="bg-slate-50/50 font-medium">
                <td className="px-4 py-2.5 text-slate-500">{statement.fromDate}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-800">OPENING BALANCE B/F</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-400">—</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-400">—</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                  ₹{statement.openingBalance.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-center font-bold text-slate-700">{statement.openingDrCr}</td>
              </tr>

              {/* Transactions */}
              {statement.entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No transactions recorded during this date range.
                  </td>
                </tr>
              ) : (
                statement.entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-slate-600">{entry.date}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{entry.narration}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                      {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                      {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                      ₹{entry.runningBalance.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-600">{entry.description}</td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals Footer */}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td colSpan={2} className="px-4 py-3 uppercase tracking-wider text-[11px]">
                  Closing Statement Totals
                </td>
                <td className="px-4 py-3 text-right font-mono">₹{statement.totalDebit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono">₹{statement.totalCredit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-primary-700 text-sm">
                  ₹{statement.closingBalance.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-center text-primary-700 text-sm font-bold">
                  {statement.closingDrCr}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Select a party and click <strong>View</strong> to compile the ledger.
        </div>
      )}

      {/* F2 Search Modal */}
      <F2LookupModal
        title={`Select ${partyType === "customer" ? "Customer" : "Supplier"} (F2)`}
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onSelect={(selected) => {
          setPartyName(selected.name);
          handleFetchLedger(selected.name);
        }}
        items={
          partyType === "customer"
            ? allCustomers.map((c) => ({
                id: c.code || c.name,
                primary: c.name,
                secondary: `${c.city || ""} ${c.state || ""}`,
                data: c
              }))
            : allSuppliers.map((s) => ({
                id: s.code || s.name,
                primary: s.name,
                secondary: `${s.city || ""} ${s.state || ""}`,
                data: s
              }))
        }
      />
    </div>
  );
};

