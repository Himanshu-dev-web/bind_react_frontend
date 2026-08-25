import React, { useState } from "react";
import { X, Printer } from "lucide-react";
import { InvoiceHeader, CompanyProfile, Firm } from "../types/index.js";

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceHeader;
  company: CompanyProfile;
  firm?: Firm;
  amountInWords?: string;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
  company,
  firm,
  amountInWords
}) => {
  const [copyType, setCopyType] = useState<"ORIGINAL" | "DUPLICATE" | "TRIPLICATE" | "EXTRA COPY">("ORIGINAL");

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const firmName = firm?.name || invoice.firmName || company.companyName;
  const firmAddr = firm?.address || `${company.address1} ${company.address2}`;
  const firmGst = firm?.gstin || "09ABLPT3658D1Z9";
  const firmPan = firm?.pan || "ABLPT3658D";
  const firmBank = firm?.bank || "PUNJAB NATIONAL BANK";
  const firmAccount = firm?.account || "";
  const firmIfsc = firm?.ifsc || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="flex flex-col w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[92vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-800 text-white">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">Print Copy:</span>
            <div className="flex gap-1.5 bg-slate-700/80 p-1 rounded-lg">
              {(["ORIGINAL", "DUPLICATE", "TRIPLICATE", "EXTRA COPY"] as const).map((copy) => (
                <button
                  key={copy}
                  onClick={() => setCopyType(copy)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    copyType === copy ? "bg-primary-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {copy}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Document
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 overflow-y-auto bg-white print:p-0 print:m-0 text-slate-900 font-sans text-xs">
          {/* Header */}
          <div className="border border-slate-900 rounded-t-lg p-4">
            <div className="flex justify-between items-start border-b border-slate-300 pb-3">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white rounded">
                  {copyType} COPY
                </span>
                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 mt-1">
                  {firmName}
                </h1>
                <p className="text-slate-600 text-[11px]">{firmAddr}</p>
                <div className="flex gap-4 mt-1 text-[11px] font-semibold text-slate-700">
                  {firmGst && <span>GSTIN: <strong className="font-mono text-slate-900">{firmGst}</strong></span>}
                  {firmPan && <span>PAN: <strong className="font-mono text-slate-900">{firmPan}</strong></span>}
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold uppercase text-xs tracking-wider">
                  {invoice.invoiceType}
                </div>
                <div className="mt-2 text-slate-800 text-[11px]">
                  <span className="font-semibold">Invoice No:</span> <span className="font-mono font-bold">{invoice.formattedInvoiceNo || invoice.invoiceNo}</span>
                </div>
                <div className="text-slate-800 text-[11px]">
                  <span className="font-semibold">Date:</span> {invoice.invoiceDate}
                </div>
              </div>
            </div>

            {/* Bill To & Dispatch Details */}
            <div className="grid grid-cols-2 gap-4 pt-3 text-[11px]">
              <div className="border-r border-slate-200 pr-4">
                <div className="font-bold uppercase text-[10px] text-slate-500 mb-1">Billed To / Consignee:</div>
                <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
                <div className="text-slate-600">{invoice.address}</div>
                <div className="text-slate-600">{invoice.city} {invoice.state}</div>
                {invoice.gstin && <div className="mt-1"><span className="font-semibold">GSTIN:</span> {invoice.gstin}</div>}
                {invoice.phone && <div><span className="font-semibold">Phone:</span> {invoice.phone}</div>}
              </div>

              <div>
                <div className="font-bold uppercase text-[10px] text-slate-500 mb-1">Logistics & Bank Details:</div>
                {invoice.vehicleNo && <div><span className="font-semibold">Vehicle No:</span> {invoice.vehicleNo}</div>}
                {invoice.transMode && <div><span className="font-semibold">Mode of Transport:</span> {invoice.transMode}</div>}
                <div className="mt-2 pt-2 border-t border-slate-200 text-[10px]">
                  <div><span className="font-semibold">Bank:</span> {firmBank}</div>
                  {firmAccount && <div><span className="font-semibold">A/C No:</span> <span className="font-mono">{firmAccount}</span></div>}
                  {firmIfsc && <div><span className="font-semibold">IFSC:</span> <span className="font-mono">{firmIfsc}</span></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full border-x border-b border-slate-900 text-left text-[11px]">
            <thead className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 w-10 text-center border-r border-slate-300">#</th>
                <th className="p-2 border-r border-slate-300">Description of Goods</th>
                <th className="p-2 w-20 text-center border-r border-slate-300">HSN</th>
                <th className="p-2 w-20 text-right border-r border-slate-300">Qty</th>
                <th className="p-2 w-24 text-right border-r border-slate-300">Rate (₹)</th>
                <th className="p-2 w-28 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((it, idx) => (
                <tr key={idx} className="min-h-[28px]">
                  <td className="p-2 text-center text-slate-500 font-mono border-r border-slate-200">{it.sNo}</td>
                  <td className="p-2 font-medium border-r border-slate-200">
                    <div>{it.itemName}</div>
                    {it.remarks && <div className="text-[9px] text-slate-500 italic">{it.remarks}</div>}
                  </td>
                  <td className="p-2 text-center font-mono text-[10px] border-r border-slate-200">{it.hsnCode}</td>
                  <td className="p-2 text-right font-medium border-r border-slate-200">{it.qty}</td>
                  <td className="p-2 text-right font-mono border-r border-slate-200">₹{it.rate.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono font-semibold">₹{it.amount.toFixed(2)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 4 - invoice.items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-6">
                  <td className="p-2 border-r border-slate-200"></td>
                  <td className="p-2 border-r border-slate-200"></td>
                  <td className="p-2 border-r border-slate-200"></td>
                  <td className="p-2 border-r border-slate-200"></td>
                  <td className="p-2 border-r border-slate-200"></td>
                  <td className="p-2"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations & Totals */}
          <div className="border-x border-b border-slate-900 grid grid-cols-12 text-[11px]">
            <div className="col-span-7 p-4 border-r border-slate-900 flex flex-col justify-between">
              <div>
                <div className="font-bold text-[10px] uppercase text-slate-500 mb-1">Amount Chargeable in Words:</div>
                <div className="font-semibold text-slate-800 leading-snug">{amountInWords || "RUPEES ONLY"}</div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 text-[9px] text-slate-500">
                Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </div>
            </div>

            <div className="col-span-5 p-3 divide-y divide-slate-200">
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Sub Total:</span>
                <span className="font-mono font-semibold">₹{invoice.subTotal.toFixed(2)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">GST ({invoice.taxRate}%):</span>
                  <span className="font-mono font-semibold">₹{invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.loadingUnloading > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Loading / Labor:</span>
                  <span className="font-mono">₹{invoice.loadingUnloading.toFixed(2)}</span>
                </div>
              )}
              {invoice.otherCharges > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Other Charges:</span>
                  <span className="font-mono">₹{invoice.otherCharges.toFixed(2)}</span>
                </div>
              )}
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between py-1 text-slate-500">
                  <span>Round Off:</span>
                  <span className="font-mono">{invoice.roundOff > 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm font-bold text-slate-900 border-t border-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono">₹{invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="border-x border-b border-slate-900 rounded-b-lg p-4 flex justify-between items-end text-[10px]">
            <div>
              <span>Customer Signature / Acknowledgement</span>
            </div>
            <div className="text-right">
              <div className="font-bold uppercase text-[11px] mb-10">For {firmName}</div>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
