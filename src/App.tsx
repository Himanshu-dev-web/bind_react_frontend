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
  Sparkles,
  User as UserIcon,
  Landmark,
  Layers
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
}

export function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("billing_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return localStorage.getItem("billing_year") || "2026-27";
  });

  const [company, setCompany] = useState<CompanyProfile>({
    companyName: "BILLING ENTERPRISE",
    address1: "",
    address2: "",
    city: "",
    gst: 5,
    invoiceCondition: "2026-27"
  });

  const [activeTab, setActiveTab] = useState<NavTab>("create-invoice");

  useEffect(() => {
    loadInitialConfig();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadCompanyProfile(selectedYear);
      localStorage.setItem("billing_year", selectedYear);
    }
  }, [selectedYear]);

  const loadInitialConfig = async () => {
    try {
      const years = await apiClient.getFinancialYears();
      setFinancialYears(years);
      if (!selectedYear || !years.includes(selectedYear)) {
        if (years.includes("2026-27")) {
          setSelectedYear("2026-27");
        } else if (years.length > 0) {
          setSelectedYear(years[0]);
        }
      }
    } catch (err) {
      console.error("Config load error:", err);
    }
  };

  const loadCompanyProfile = async (year: string) => {
    try {
      const comp = await apiClient.getCompanyProfile(year);
      setCompany(comp);
    } catch (err) {
      console.error("Company profile error:", err);
    }
  };

  const handleLoginSuccess = (user: UserSession, year: string) => {
    setCurrentUser(user);
    setSelectedYear(year);
    localStorage.setItem("billing_user", JSON.stringify(user));
    localStorage.setItem("billing_year", year);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("billing_user");
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
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white">{company.companyName}</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  <Sparkles className="w-2.5 h-2.5" /> Modern Core
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Enterprise Multi-Firm Billing, Inventory & Accounts</p>
            </div>
          </div>

          {/* Right Controls: Financial Year & User Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-primary-400 focus:outline-none cursor-pointer"
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

        {/* Navigation Tabs */}
        <nav className="bg-slate-850 border-t border-slate-800/60 overflow-x-auto">
          <div className="max-w-[1700px] mx-auto px-3 sm:px-4 lg:px-6 flex space-x-1 py-1">
            {[
              { id: "create-invoice", label: "Create Invoice", icon: ReceiptText },
              { id: "invoice-list", label: "Invoice History", icon: FileText },
              { id: "itc-book", label: "ITC Book", icon: Layers },
              { id: "firms", label: "Billing Firms", icon: Landmark },
              { id: "customers", label: "Customers", icon: Users },
              { id: "suppliers", label: "Suppliers", icon: Building2 },
              { id: "items", label: "Items & Books", icon: BookOpen },
              { id: "units", label: "Units & Rates", icon: Scale },
              { id: "ledger", label: "Party Ledger", icon: BookMarked },
              { id: "receipts", label: "Payment Receipts", icon: Banknote }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-4">
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
