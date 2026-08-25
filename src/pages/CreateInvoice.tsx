import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Save,
  Trash2,
  Edit2,
  Undo2,
  Printer,
  FileText,
  Search,
  Building2,
  Calendar,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  UserCheck,
  Loader2,
  RotateCw
} from "lucide-react";
import { apiClient } from "../api/client.js";
import { InvoiceHeader, InvoiceLineItem, Customer, Item, CompanyProfile, Firm } from "../types/index.js";
import { EditableGrid } from "../components/EditableGrid.js";
import { F2LookupModal } from "../components/F2LookupModal.js";
import { BillSearchModal } from "../components/BillSearchModal.js";
import { InvoicePrintModal } from "../components/InvoicePrintModal.js";

interface CreateInvoiceProps {
  currentYear: string;
  company: CompanyProfile;
}

export const CreateInvoice: React.FC<CreateInvoiceProps> = ({ currentYear, company }) => {
  // Firms
  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirmName, setSelectedFirmName] = useState<string>("DEVA BOOK BINDING HOUSE");
  const [isFirmLookupOpen, setIsFirmLookupOpen] = useState<boolean>(false);

  // Bill Header Form
  const [billNoInput, setBillNoInput] = useState<string>("1");
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("MEERUT");
  const [reverseCharge, setReverseCharge] = useState<string>("No");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [transMode, setTransMode] = useState<string>("");
  const [dateOfSupp, setDateOfSupp] = useState<string>("");

  // Billed To
  const [billedToName, setBilledToName] = useState<string>("");
  const [billedToAddress, setBilledToAddress] = useState<string>("");
  const [billedToGstin, setBilledToGstin] = useState<string>("");
  const [billedToPan, setBilledToPan] = useState<string>("");

  // Shipped To
  const [shippedToName, setShippedToName] = useState<string>("");
  const [shippedToAddress, setShippedToAddress] = useState<string>("");
  const [shippedToGstin, setShippedToGstin] = useState<string>("");
  const [shippedToPan, setShippedToPan] = useState<string>("");
  const [itemWiseTotal, setItemWiseTotal] = useState<boolean>(false);

  // Grid Items
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { sNo: 1, remarks: "Title", description: "", itemName: "", hsnCode: "", rate: 1, qty: 0, amount: 0 }
  ]);

  // Tax & Totals Breakdown
  const [isIgst, setIsIgst] = useState<boolean>(false);
  const [cgstRate, setCgstRate] = useState<number>(2.5);
  const [sgstRate, setSgstRate] = useState<number>(2.5);
  const [igstRate, setIgstRate] = useState<number>(0);

  const [totalValue, setTotalValue] = useState<number>(0);
  const [cgstAmt, setCgstAmt] = useState<number>(0);
  const [sgstAmt, setSgstAmt] = useState<number>(0);
  const [igstAmt, setIgstAmt] = useState<number>(0);
  const [totalGst, setTotalGst] = useState<number>(0);
  const [addLessRounding, setAddLessRounding] = useState<number>(0);
  const [totalAmountAfterTax, setTotalAmountAfterTax] = useState<number>(0);

  // Lookups
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceHeader[]>([]);
  const [isCustomerLookupOpen, setIsCustomerLookupOpen] = useState(false);
  const [isShippedLookupOpen, setIsShippedLookupOpen] = useState(false);
  const [isBillSearchOpen, setIsBillSearchOpen] = useState(false);
  const [isItemLookupOpen, setIsItemLookupOpen] = useState(false);
  const [activeItemRowIndex, setActiveItemRowIndex] = useState<number | null>(null);

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<InvoiceHeader | null>(null);
  const [amountInWords, setAmountInWords] = useState<string>("");

  // Loading States
  const [isLoadingBill, setIsLoadingBill] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const billNoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, [currentYear]);

  useEffect(() => {
    recalcGST();
  }, [items, isIgst, cgstRate, sgstRate, igstRate]);

  const loadInitialData = async () => {
    setIsLoadingBill(true);
    try {
      const [firmsData, custs, its, invs] = await Promise.all([
        apiClient.getFirms(currentYear),
        apiClient.getCustomers(currentYear),
        apiClient.getItems(currentYear),
        apiClient.getInvoices(currentYear, "TAXINVOICE")
      ]);
      setFirms(firmsData);
      setAllCustomers(custs);
      setAllItems(its);
      setAllInvoices(invs);

      let firmToUse = "DEVA BOOK BINDING HOUSE";
      if (firmsData.length > 0) {
        const deva = firmsData.find((f) => f.name.includes("DEVA")) || firmsData[0];
        firmToUse = deva.name;
        setSelectedFirmName(deva.name);
      }

      // Automatically open the LAST created bill on section open (matching legacy VB6 behavior)
      try {
        const lastInvRes = await apiClient.getNavInvoice(currentYear, firmToUse, "last");
        if (lastInvRes?.invoice) {
          loadInvoiceIntoForm(lastInvRes.invoice);
        } else {
          loadNextNo(firmToUse);
        }
      } catch {
        loadNextNo(firmToUse);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBill(false);
    }
  };

  const loadNextNo = async (firmNameParam?: string) => {
    try {
      const targetFirm = firmNameParam || selectedFirmName;
      const next = await apiClient.getNextInvoiceNo(currentYear, "TAXINVOICE", targetFirm);
      setBillNoInput(String(next));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSpecificBill = async (noToSearch?: string) => {
    const raw = noToSearch || billNoInput;
    const num = parseInt(raw, 10);
    if (isNaN(num) || num <= 0) return;

    setIsLoadingBill(true);
    setStatusMessage(null);
    try {
      const data = await apiClient.getInvoiceByNo(currentYear, num, "TAXINVOICE", selectedFirmName);
      if (data?.invoice) {
        loadInvoiceIntoForm(data.invoice);
      } else {
        // If not exist, prepare form for creating new bill with this number smoothly without error
        prepareForNewBillNumber(num);
      }
    } catch (err) {
      // Allow making a new bill for this number without blocking error
      prepareForNewBillNumber(num);
    } finally {
      setIsLoadingBill(false);
    }
  };

  const prepareForNewBillNumber = (num: number) => {
    setBillNoInput(String(num));
    setBilledToName("");
    setBilledToAddress("");
    setBilledToGstin("");
    setBilledToPan("");
    setShippedToName("");
    setShippedToAddress("");
    setShippedToGstin("");
    setShippedToPan("");
    setVehicleNo("");
    setTransMode("");
    setDateOfSupp("");
    setItems([
      { sNo: 1, remarks: "Title", description: "", itemName: "", hsnCode: "", rate: 1, qty: 0, amount: 0 }
    ]);
    setSavedInvoice(null);
    setStatusMessage({
      type: "success",
      text: `Ready to create new Bill #${num} under ${selectedFirmName}.`
    });
  };

  const recalcGST = () => {
    const rawVal = items.reduce((acc, it) => acc + (it.amount || 0), 0);
    setTotalValue(Number(rawVal.toFixed(2)));

    let cg = 0;
    let sg = 0;
    let ig = 0;

    if (isIgst) {
      ig = Number(((rawVal * igstRate) / 100).toFixed(2));
      setCgstRate(0);
      setSgstRate(0);
    } else {
      cg = Number(((rawVal * cgstRate) / 100).toFixed(2));
      sg = Number(((rawVal * sgstRate) / 100).toFixed(2));
    }

    const tg = Number((cg + sg + ig).toFixed(2));
    const gross = rawVal + tg;
    const rounded = Math.round(gross);
    const roundDiff = Number((rounded - gross).toFixed(2));

    setCgstAmt(cg);
    setSgstAmt(sg);
    setIgstAmt(ig);
    setTotalGst(tg);
    setAddLessRounding(roundDiff);
    setTotalAmountAfterTax(rounded);
  };

  const handleToggleIGST = (checked: boolean) => {
    setIsIgst(checked);
    if (checked) {
      setIgstRate(5);
      setCgstRate(0);
      setSgstRate(0);
    } else {
      setIgstRate(0);
      setCgstRate(2.5);
      setSgstRate(2.5);
    }
  };

  const handleNavigate = async (action: "first" | "prev" | "next" | "last") => {
    setIsNavigating(true);
    setIsLoadingBill(true);
    setStatusMessage(null);
    try {
      const cur = parseInt(billNoInput, 10) || 1;
      const res = await apiClient.getNavInvoice(currentYear, selectedFirmName, action, cur);
      loadInvoiceIntoForm(res.invoice);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.response?.data?.error || "No invoice found in this direction." });
    } finally {
      setIsNavigating(false);
      setIsLoadingBill(false);
    }
  };

  const loadInvoiceIntoForm = (inv: InvoiceHeader) => {
    setBillNoInput(String(inv.invoiceNo));
    setBillDate(inv.invoiceDate || new Date().toISOString().split("T")[0]);
    setSelectedFirmName(inv.firmName || "DEVA BOOK BINDING HOUSE");
    setPlaceOfSupply(inv.placeOfSupply || "MEERUT");
    setVehicleNo(inv.vehicleNo || "");
    setTransMode(inv.transMode || "");
    setDateOfSupp(inv.dateOfSupply || "");

    setBilledToName(inv.customerName || "");
    setBilledToAddress(inv.address || "");
    setBilledToGstin(inv.gstin || "");
    setBilledToPan(inv.pan || "");

    setShippedToName(inv.customerName || "");
    setShippedToAddress(inv.address || "");
    setShippedToGstin(inv.gstin || "");
    setShippedToPan(inv.pan || "");

    if (inv.items && inv.items.length > 0) {
      setItems(inv.items);
    } else {
      setItems([{ sNo: 1, remarks: "Title", description: "", itemName: "", hsnCode: "", rate: 1, qty: 0, amount: 0 }]);
    }

    setSavedInvoice(inv);
    setStatusMessage({ type: "success", text: `Loaded Invoice #${inv.formattedInvoiceNo || inv.invoiceNo}` });
  };

  const handleSave = async () => {
    if (!billedToName.trim()) {
      setStatusMessage({ type: "error", text: "Please enter or select a customer." });
      return;
    }

    const validItems = items.filter((it) => it.itemName.trim() !== "");
    if (validItems.length === 0) {
      setStatusMessage({ type: "error", text: "Please enter at least one book title in the grid." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const parsedBillNo = parseInt(billNoInput, 10) || 1;
    const taxRate = isIgst ? igstRate : (cgstRate + sgstRate);

    const payload: InvoiceHeader = {
      invoiceNo: parsedBillNo,
      invoiceType: "TAXINVOICE",
      firmName: selectedFirmName,
      invoiceDate: billDate,
      customerName: billedToName,
      address: billedToAddress,
      city: placeOfSupply,
      state: "Uttar Pradesh",
      phone: "",
      gstin: billedToGstin,
      pan: billedToPan,
      vehicleNo,
      transMode,
      dateOfSupply: dateOfSupp,
      placeOfSupply,
      subTotal: totalValue,
      taxRate,
      taxAmount: totalGst,
      loadingUnloading: 0,
      otherCharges: 0,
      totalAmount: totalAmountAfterTax,
      roundOff: addLessRounding,
      items: validItems
    };

    try {
      const res = await apiClient.saveInvoice(currentYear, payload);
      setSavedInvoice(res.invoice);
      setAmountInWords(res.amountInWords);
      setStatusMessage({ type: "success", text: `Invoice #${res.invoice.invoiceNo} saved successfully!` });
      setIsPrintOpen(true);

      // Refresh invoice list
      const invs = await apiClient.getInvoices(currentYear, "TAXINVOICE");
      setAllInvoices(invs);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save invoice." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = () => {
    loadNextNo();
    setBilledToName("");
    setBilledToAddress("");
    setBilledToGstin("");
    setBilledToPan("");
    setShippedToName("");
    setShippedToAddress("");
    setShippedToGstin("");
    setShippedToPan("");
    setVehicleNo("");
    setTransMode("");
    setDateOfSupp("");
    setItems([
      { sNo: 1, remarks: "Title", description: "", itemName: "", hsnCode: "", rate: 1, qty: 0, amount: 0 }
    ]);
    setSavedInvoice(null);
    setStatusMessage({ type: "success", text: "Ready for new invoice entry." });
    billNoInputRef.current?.focus();
  };

  const handleDelete = async () => {
    const parsedNo = parseInt(billNoInput, 10);
    if (!parsedNo) return;
    if (!window.confirm(`Are you sure you want to delete Bill #${parsedNo}?`)) return;
    setIsLoadingBill(true);
    try {
      await apiClient.deleteInvoice(currentYear, parsedNo, "TAXINVOICE", selectedFirmName);
      setStatusMessage({ type: "success", text: `Bill #${parsedNo} deleted successfully.` });
      handleAddNew();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete bill." });
    } finally {
      setIsLoadingBill(false);
    }
  };

  const handleSelectItem = (it: Item) => {
    if (activeItemRowIndex !== null) {
      const updated = [...items];
      updated[activeItemRowIndex] = {
        ...updated[activeItemRowIndex],
        itemName: it.itemName,
        description: it.itemGp || updated[activeItemRowIndex].description,
        rate: it.rate || 1,
        amount: Number(((updated[activeItemRowIndex].qty || 0) * (it.rate || 1)).toFixed(2))
      };
      setItems(updated);
      setActiveItemRowIndex(null);
    }
  };

  const selectedFirmObj = firms.find((f) => f.name === selectedFirmName) || {
    name: selectedFirmName,
    address: "674/8 SUBHASH NAGAR , STREET NO-11,MEERUT",
    gstin: "09ABLPT3658D1Z9",
    pan: "ABLPT3658D"
  };

  const isBusy = isLoadingBill || isNavigating || isSaving;

  return (
    <div className="space-y-3 font-sans text-xs relative">
      {/* Top Application Status Bar */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all shadow-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
              : "bg-red-50 text-red-900 border border-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          {isBusy && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
        </div>
      )}

      {/* Split Main Screen Layout */}
      <div className="grid grid-cols-12 gap-4 items-start relative">
        {/* Loading Indicator Overlay */}
        {isBusy && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-30 flex items-center justify-center rounded-xl pointer-events-none">
            <div className="bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
              <span className="text-xs font-bold tracking-wide">
                {isSaving ? "Saving Invoice to Database..." : isNavigating ? "Loading Record..." : "Fetching Bill Details..."}
              </span>
            </div>
          </div>
        )}

        {/* ===================== LEFT COLUMN: BILL DETAILS, BILLED TO & SHIPPED TO ===================== */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {/* Bill & Firm Header Card */}
          <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-700" /> Bill Header
                {isLoadingBill && <Loader2 className="w-3 h-3 animate-spin text-blue-600 inline" />}
              </span>
              <button
                type="button"
                onClick={() => setIsBillSearchOpen(true)}
                className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer"
              >
                F2 For Search Bill
              </button>
            </div>

            {/* Bill No & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Bill No :</label>
                <div className="relative flex items-center">
                  <input
                    ref={billNoInputRef}
                    type="text"
                    disabled={isBusy}
                    value={billNoInput}
                    onChange={(e) => setBillNoInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSpecificBill();
                      else if (e.key === "F2") setIsBillSearchOpen(true);
                    }}
                    onBlur={() => {
                      if (billNoInput) handleSearchSpecificBill();
                    }}
                    placeholder="Bill No"
                    className="w-full px-2.5 py-1 bg-blue-50/50 border border-blue-400 rounded font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleSearchSpecificBill()}
                    className="absolute right-1 p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingBill ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Date :</label>
                <input
                  type="date"
                  disabled={isBusy}
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-[11px]"
                />
              </div>
            </div>

            {/* Firm Selector */}
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-slate-700">Firm Name :</span>
                <button
                  type="button"
                  onClick={() => setIsFirmLookupOpen(true)}
                  className="text-[10px] text-blue-700 hover:underline font-semibold cursor-pointer"
                >
                  F2 Firm
                </button>
              </div>
              <select
                disabled={isBusy}
                value={selectedFirmName}
                onChange={async (e) => {
                  const newFirm = e.target.value;
                  setSelectedFirmName(newFirm);
                  // Load last bill for this newly selected firm
                  try {
                    const lastRes = await apiClient.getNavInvoice(currentYear, newFirm, "last");
                    if (lastRes?.invoice) loadInvoiceIntoForm(lastRes.invoice);
                    else loadNextNo(newFirm);
                  } catch {
                    loadNextNo(newFirm);
                  }
                }}
                className="w-full px-2 py-1 bg-blue-50 border border-blue-400 rounded font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
              >
                {firms.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Firm Address, GSTIN, PAN */}
            <div className="bg-slate-50 p-2 border border-slate-200 rounded space-y-1 text-[11px]">
              <div className="text-slate-600 truncate">{selectedFirmObj.address}</div>
              <div className="grid grid-cols-2 gap-1 font-mono font-bold text-slate-800 text-[10px]">
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate">GST: {selectedFirmObj.gstin}</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate">PAN: {selectedFirmObj.pan}</span>
              </div>
            </div>

            {/* Place of Supply & Reverse Charge */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Place of Supply</label>
                <input
                  type="text"
                  disabled={isBusy}
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-medium text-slate-900 uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Reverse Charge</label>
                <select
                  disabled={isBusy}
                  value={reverseCharge}
                  onChange={(e) => setReverseCharge(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-slate-900"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Logistics Info */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
              <div>
                <label className="block font-semibold text-slate-500">Vehicle No</label>
                <input
                  type="text"
                  disabled={isBusy}
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="Vehicle"
                  className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500">Trans Mode</label>
                <input
                  type="text"
                  disabled={isBusy}
                  value={transMode}
                  onChange={(e) => setTransMode(e.target.value)}
                  placeholder="Road"
                  className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500">Date of Supp</label>
                <input
                  type="text"
                  disabled={isBusy}
                  value={dateOfSupp}
                  onChange={(e) => setDateOfSupp(e.target.value)}
                  placeholder="DD/MM"
                  className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded"
                />
              </div>
            </div>
          </div>

          {/* Billed To Card */}
          <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-1.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-1">
              <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" /> Billed To :
              </span>
              <button
                type="button"
                onClick={() => setIsCustomerLookupOpen(true)}
                className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer"
              >
                F2 Search
              </button>
            </div>
            <input
              type="text"
              disabled={isBusy}
              value={billedToName}
              onChange={(e) => setBilledToName(e.target.value)}
              onKeyDown={(e) => e.key === "F2" && setIsCustomerLookupOpen(true)}
              placeholder="Customer Name (Press F2)..."
              className="w-full px-2 py-1 border border-slate-300 rounded font-bold text-slate-900 bg-slate-50"
            />
            <input
              type="text"
              disabled={isBusy}
              value={billedToAddress}
              onChange={(e) => setBilledToAddress(e.target.value)}
              placeholder="Billing Address..."
              className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-slate-50 text-[11px]"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                disabled={isBusy}
                value={billedToGstin}
                onChange={(e) => setBilledToGstin(e.target.value)}
                placeholder="GSTIN"
                className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono text-[10px] bg-slate-50"
              />
              <input
                type="text"
                disabled={isBusy}
                value={billedToPan}
                onChange={(e) => setBilledToPan(e.target.value)}
                placeholder="PAN"
                className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono text-[10px] bg-slate-50"
              />
            </div>
          </div>

          {/* Shipped To Card */}
          <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-1.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-1">
              <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <Truck className="w-3.5 h-3.5 text-sky-700" /> Shipped To :
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isBusy}
                    checked={itemWiseTotal}
                    onChange={(e) => setItemWiseTotal(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 w-3 h-3"
                  />
                  Item Wise Total
                </label>
                <button
                  type="button"
                  onClick={() => setIsShippedLookupOpen(true)}
                  className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer"
                >
                  F2 Search
                </button>
              </div>
            </div>
            <input
              type="text"
              disabled={isBusy}
              value={shippedToName}
              onChange={(e) => setShippedToName(e.target.value)}
              placeholder="Shipped Party Name..."
              className="w-full px-2 py-1 border border-slate-300 rounded font-bold text-slate-900 bg-slate-50"
            />
            <input
              type="text"
              disabled={isBusy}
              value={shippedToAddress}
              onChange={(e) => setShippedToAddress(e.target.value)}
              placeholder="Shipped Address..."
              className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 bg-slate-50 text-[11px]"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                disabled={isBusy}
                value={shippedToGstin}
                onChange={(e) => setShippedToGstin(e.target.value)}
                placeholder="GSTIN"
                className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono text-[10px] bg-slate-50"
              />
              <input
                type="text"
                disabled={isBusy}
                value={shippedToPan}
                onChange={(e) => setShippedToPan(e.target.value)}
                placeholder="PAN"
                className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono text-[10px] bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* ===================== RIGHT COLUMN: DATA GRID, TOTALS & ACTIONS ===================== */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          {/* The High-Speed Green Billing Grid with fixed scrollable viewport */}
          <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-sm relative">
            <EditableGrid
              items={items}
              onChange={setItems}
              onOpenItemLookup={(idx) => {
                setActiveItemRowIndex(idx);
                setIsItemLookupOpen(true);
              }}
            />
          </div>

          {/* Bottom Navigation & Tax Totals Section */}
          <div className="grid grid-cols-12 gap-3 items-start">
            {/* Navigation & Bending Quantity */}
            <div className="col-span-12 md:col-span-5 bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Bending Qty For Bill :</span>
                <input
                  type="text"
                  readOnly
                  value={items.reduce((acc, it) => acc + (it.qty || 0), 0)}
                  className="w-24 px-2 py-1 bg-yellow-100 border border-yellow-400 rounded font-mono font-bold text-slate-900 text-right text-xs"
                />
              </div>

              {/* Record Movement Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleNavigate("first")}
                  className="px-2 py-1.5 bg-[#fef08a] hover:bg-[#fde047] text-slate-900 font-bold rounded border border-yellow-400 shadow-sm transition-colors text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <ChevronFirst className="w-3.5 h-3.5" /> Move First
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleNavigate("prev")}
                  className="px-2 py-1.5 bg-[#fef08a] hover:bg-[#fde047] text-slate-900 font-bold rounded border border-yellow-400 shadow-sm transition-colors text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Move Prev
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleNavigate("next")}
                  className="px-2 py-1.5 bg-[#fef08a] hover:bg-[#fde047] text-slate-900 font-bold rounded border border-yellow-400 shadow-sm transition-colors text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  Move Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleNavigate("last")}
                  className="px-2 py-1.5 bg-[#fef08a] hover:bg-[#fde047] text-slate-900 font-bold rounded border border-yellow-400 shadow-sm transition-colors text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  Move Last <ChevronLast className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tax & Totals Breakdown */}
            <div className="col-span-12 md:col-span-7 bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-1 font-bold text-slate-700 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    disabled={isBusy}
                    checked={isIgst}
                    onChange={(e) => handleToggleIGST(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 w-3.5 h-3.5"
                  />
                  Set IGST
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-600">Total CGST @</span>
                  <input
                    type="number"
                    disabled={isIgst || isBusy}
                    value={cgstRate}
                    onChange={(e) => setCgstRate(parseFloat(e.target.value) || 0)}
                    className="w-10 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono text-[11px]"
                  />
                  <span>% :</span>
                  <input
                    type="text"
                    readOnly
                    value={cgstAmt.toFixed(2)}
                    className="w-20 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono font-semibold text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-1.5">
                <span className="text-[11px] text-slate-600">Total SGST @</span>
                <input
                  type="number"
                  disabled={isIgst || isBusy}
                  value={sgstRate}
                  onChange={(e) => setSgstRate(parseFloat(e.target.value) || 0)}
                  className="w-10 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono text-[11px]"
                />
                <span>% :</span>
                <input
                  type="text"
                  readOnly
                  value={sgstAmt.toFixed(2)}
                  className="w-20 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono font-semibold text-[11px]"
                />
              </div>

              <div className="flex justify-end items-center gap-1.5">
                <span className="text-[11px] text-slate-600">Total IGST @</span>
                <input
                  type="number"
                  disabled={!isIgst || isBusy}
                  value={igstRate}
                  onChange={(e) => setIgstRate(parseFloat(e.target.value) || 0)}
                  className="w-10 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono text-[11px]"
                />
                <span>% :</span>
                <input
                  type="text"
                  readOnly
                  value={igstAmt.toFixed(2)}
                  className="w-20 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono font-semibold text-[11px]"
                />
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                <span className="text-slate-700">Total Amount: GST</span>
                <span className="font-mono font-bold text-slate-900">₹{totalGst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Total Value</span>
                <span className="font-mono font-bold text-slate-900">₹{totalValue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 text-[10px]">
                <span>Add/Less Rounding</span>
                <span className="font-mono">{addLessRounding > 0 ? `+${addLessRounding.toFixed(2)}` : addLessRounding.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-1.5 border-t-2 border-slate-300 text-xs font-bold text-slate-900">
                <span>Total Amount After Tax</span>
                <span className="font-mono text-sm text-blue-900 font-extrabold">₹{totalAmountAfterTax.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="bg-slate-200 p-2 rounded-lg border border-slate-400 flex flex-wrap items-center justify-center gap-1.5 shadow-inner">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleAddNew}
              className="px-4 py-1.5 bg-slate-100 hover:bg-white border border-slate-400 rounded font-bold text-slate-800 shadow-sm transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleSave}
              className="px-4 py-1.5 bg-slate-100 hover:bg-white border border-slate-400 rounded font-bold text-slate-800 shadow-sm transition-all disabled:opacity-50 cursor-pointer text-xs flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleDelete}
              className="px-4 py-1.5 bg-slate-100 hover:bg-white border border-slate-400 rounded font-bold text-slate-800 shadow-sm transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                if (savedInvoice) loadInvoiceIntoForm(savedInvoice);
              }}
              className="px-4 py-1.5 bg-slate-100 hover:bg-white border border-slate-400 rounded font-bold text-slate-800 shadow-sm transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleAddNew}
              className="px-4 py-1.5 bg-slate-100 hover:bg-white border border-slate-400 rounded font-bold text-slate-800 shadow-sm transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                if (savedInvoice) setIsPrintOpen(true);
                else handleSave();
              }}
              className="px-4 py-1.5 bg-slate-100 hover:bg-white border border-slate-400 rounded font-bold text-slate-800 shadow-sm transition-all cursor-pointer text-xs disabled:opacity-50"
            >
              Print
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                if (savedInvoice) setIsPrintOpen(true);
                else handleSave();
              }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white rounded font-bold shadow-sm transition-all cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              Print (Tax Inv.)
            </button>
          </div>
        </div>
      </div>

      {/* Legacy-matching F2 Bill Search Modal */}
      <BillSearchModal
        isOpen={isBillSearchOpen}
        onClose={() => setIsBillSearchOpen(false)}
        onSelect={async (inv) => {
          try {
            setIsLoadingBill(true);
            const data = await apiClient.getInvoiceByNo(currentYear, inv.invoiceNo, "TAXINVOICE", inv.firmName);
            loadInvoiceIntoForm(data.invoice);
          } catch (err) {
            console.error(err);
          } finally {
            setIsLoadingBill(false);
          }
        }}
        invoices={allInvoices}
      />

      {/* Customer Lookup */}
      <F2LookupModal
        title="Select Customer (F2)"
        isOpen={isCustomerLookupOpen}
        onClose={() => setIsCustomerLookupOpen(false)}
        onSelect={(c) => {
          setBilledToName(c.name);
          setBilledToAddress(c.address1 || "");
          setBilledToGstin(c.gstin || c.tin || "");
          setBilledToPan(c.pan || c.cst || "");
          setShippedToName(c.name);
          setShippedToAddress(c.address1 || "");
          setShippedToGstin(c.gstin || c.tin || "");
          setShippedToPan(c.pan || c.cst || "");
        }}
        items={allCustomers.map((c) => ({
          id: c.code || c.name,
          primary: c.name,
          secondary: `${c.city || ""} ${c.state || ""} | GSTIN: ${c.gstin || ""}`,
          data: c
        }))}
      />

      {/* Shipped To Lookup */}
      <F2LookupModal
        title="Select Consignee / Shipped To (F2)"
        isOpen={isShippedLookupOpen}
        onClose={() => setIsShippedLookupOpen(false)}
        onSelect={(c) => {
          setShippedToName(c.name);
          setShippedToAddress(c.address1 || "");
          setShippedToGstin(c.gstin || c.tin || "");
          setShippedToPan(c.pan || c.cst || "");
        }}
        items={allCustomers.map((c) => ({
          id: c.code || c.name,
          primary: c.name,
          secondary: `${c.city || ""} ${c.state || ""}`,
          data: c
        }))}
      />

      {/* Firm Search Lookup */}
      <F2LookupModal
        title="Select Billing Firm (F2)"
        isOpen={isFirmLookupOpen}
        onClose={() => setIsFirmLookupOpen(false)}
        onSelect={(f) => {
          setSelectedFirmName(f.name);
        }}
        items={firms.map((f) => ({
          id: f.name,
          primary: f.name,
          secondary: `${f.address || ""} | GSTIN: ${f.gstin || ""}`,
          data: f
        }))}
      />

      {/* Item Title Search Lookup */}
      <F2LookupModal
        title="Select Book Title (F2)"
        isOpen={isItemLookupOpen}
        onClose={() => setIsItemLookupOpen(false)}
        onSelect={handleSelectItem}
        items={allItems.map((it) => ({
          id: String(it.autoId || it.itemName),
          primary: it.itemName,
          secondary: `${it.itemGp || ""} | Rate: ₹${it.rate.toFixed(2)}`,
          data: it
        }))}
      />

      {/* Print Preview Modal */}
      {savedInvoice && (
        <InvoicePrintModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          invoice={savedInvoice}
          company={company}
          firm={selectedFirmObj}
          amountInWords={amountInWords}
        />
      )}
    </div>
  );
};
