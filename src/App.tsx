import React, { useState, useEffect } from "react";
import {
  ReceiptText,
  FileText,
  Users,
  Building2,
  BookOpen,
  Scale,
  BookMarked,
  Banknote,
  LogOut,
  User as UserIcon,
  Layers,
  Database
} from "lucide-react";
import { apiClient } from "./api/client.js";
import { CompanyProfile } from "./types/index.js";

// Pages
import { LoginPage } from "./pages/LoginPage.js";
import { CreateInvoice } from "./pages/CreateInvoice.js";
import { InvoiceList } from "./pages/InvoiceList.js";
import { CustomerList } from "./pages/CustomerList.js";
import { SupplierList } from "./pages/SupplierList.js";
import { ItemList } from "./pages/ItemList.js";
import { UnitList } from "./pages/UnitList.js";
import { FirmList } from "./pages/FirmList.js";
import { LedgerViewer } from "./pages/LedgerViewer.js";
import { ReceiptEntry } from "./pages/ReceiptEntry.js";
import { ITCManager } from "./pages/ITCManager.js";

type NavTab = 
  | "create-invoice"
  | "invoice-list"
  | "itc-book"
  | "firms"
  | "customers"
  | "suppliers"
  | "items"
  | "units"
  | "ledger"
  | "receipts";

interface UserSession {
  username: string;
  isAdmin: boolean;
  companyCode: string;
  databaseKey: string;
  companyName: string;
  selectedYear: string;
}

export function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("billing_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [financialYears, setFinancialYears] = useState<string[]>(() => {
    const saved = localStorage.getItem("billing_years_cache");
    return saved ? JSON.parse(saved) : ["2026-27"];
  });

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return localStorage.getItem("billing_year") || "2026-27";
  });

  const [company, setCompany] = useState<CompanyProfile>({
    companyName: currentUser?.companyName || "BILLING ENTERPRISE",
    address1: "",
    address2: "",
    city: "",
    gst: 5,
    invoiceCondition: "2026-27"
  });

  const [activeTab, setActiveTab] = useState<NavTab>("create-invoice");

  useEffect(() => {
    if (currentUser && selectedYear) {
      loadCompanyProfile(selectedYear);
      localStorage.setItem("billing_year", selectedYear);
    }
  }, [selectedYear, currentUser]);

  const loadCompanyProfile = async (year: string) => {
    try {
      const comp = await apiClient.getCompanyProfile(year);
      if (comp) {
        setCompany(comp);
      }
    } catch (err) {
      console.error("Company profile error:", err);
    }
  };

  const handleLoginSuccess = (user: UserSession, availableYears: any[], defaultYear: string) => {
    setCurrentUser(user);
    const yearList = availableYears.map((y: any) => (typeof y === "string" ? y : y.yearCode || "2026-27"));
    const finalYears = yearList.length > 0 ? yearList : ["2026-27"];
    setFinancialYears(finalYears);
    setSelectedYear(defaultYear || finalYears[0] || "2026-27");

    localStorage.setItem("billing_user", JSON.stringify(user));
    localStorage.setItem("billing_years_cache", JSON.stringify(finalYears));
    localStorage.setItem("billing_year", defaultYear || finalYears[0] || "2026-27");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("billing_user");
    localStorage.removeItem("billing_token");
    localStorage.removeItem("billing_database_key");
    localStorage.removeItem("billing_company");
    localStorage.removeItem("billing_year");
    localStorage.removeItem("billing_years_cache");
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center shadow-md shadow-primary-500/20">
              <ReceiptText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white">
                  {company.companyName || currentUser.companyName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Database className="w-2.5 h-2.5" /> Isolated PostgreSQL ({currentUser.databaseKey})
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Enterprise Invoicing & Job Work Management Engine</p>
            </div>
          </div>

          {/* Right Controls: Financial Year & User Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-sky-400 focus:outline-none cursor-pointer"
              >
                {financialYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white font-medium">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300">
              <UserIcon className="w-3.5 h-3.5 text-primary-400" />
              <span className="font-medium">{currentUser.username}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-800/90 border-t border-slate-700/60 px-3 sm:px-4 lg:px-6">
          <div className="max-w-[1700px] mx-auto flex items-center gap-1 overflow-x-auto py-1 text-xs font-medium no-scrollbar">
            <button
              onClick={() => setActiveTab("create-invoice")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "create-invoice"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>

            <button
              onClick={() => setActiveTab("invoice-list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "invoice-list"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Invoices</span>
            </button>

            <button
              onClick={() => setActiveTab("itc-book")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "itc-book"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Job Work (ITC)</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1 flex-shrink-0" />

            <button
              onClick={() => setActiveTab("firms")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "firms"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Billing Firms</span>
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "customers"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => setActiveTab("suppliers")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "suppliers"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Suppliers</span>
            </button>

            <button
              onClick={() => setActiveTab("items")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "items"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Item Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab("units")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "units"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Units</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1 flex-shrink-0" />

            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "ledger"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Party Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab("receipts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "receipts"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Receipts</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-4 lg:p-6 overflow-y-auto">
        {activeTab === "create-invoice" && <CreateInvoice currentYear={selectedYear} company={company} />}
        {activeTab === "invoice-list" && <InvoiceList currentYear={selectedYear} company={company} />}
        {activeTab === "itc-book" && <ITCManager currentYear={selectedYear} />}
        {activeTab === "firms" && <FirmList currentYear={selectedYear} />}
        {activeTab === "customers" && <CustomerList currentYear={selectedYear} />}
        {activeTab === "suppliers" && <SupplierList currentYear={selectedYear} />}
        {activeTab === "items" && <ItemList currentYear={selectedYear} />}
        {activeTab === "units" && <UnitList currentYear={selectedYear} />}
        {activeTab === "ledger" && <LedgerViewer currentYear={selectedYear} company={company} />}
        {activeTab === "receipts" && <ReceiptEntry currentYear={selectedYear} />}
      </main>
    </div>
  );
}
export default App;
