import axios from "axios";
import {
  Customer,
  Supplier,
  Item,
  UnitMaster,
  CompanyProfile,
  InvoiceHeader,
  InvoiceType,
  PartyLedgerStatement,
  Receipt,
  Firm,
  ITCRecord,
  ITCLedgerSummary
} from "../types/index.js";

const rawBaseUrl = import.meta.env.VITE_API_URL || "";
const apiBase = rawBaseUrl
  ? `${rawBaseUrl.replace(/\/+$/, "")}/api`
  : "/api";

const api = axios.create({
  baseURL: apiBase
});

function sanitizeYear(year?: string): string {
  if (!year || year === "undefined" || year === "null" || year.trim() === "") {
    return localStorage.getItem("billing_year") || "2026-27";
  }
  return year.trim();
}

// Attach tenant & auth headers automatically to all API calls
api.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem("billing_token");
  const company = localStorage.getItem("billing_company");
  const dbKey = localStorage.getItem("billing_database_key");
  const year = sanitizeYear(localStorage.getItem("billing_year") || undefined);

  if (token) {
    reqConfig.headers["Authorization"] = `Bearer ${token}`;
  }
  if (dbKey) {
    reqConfig.headers["x-database-key"] = dbKey;
  }
  if (company) {
    reqConfig.headers["x-company-code"] = company;
  }
  if (year) {
    reqConfig.headers["x-financial-year"] = year;
  }
  return reqConfig;
});

export const apiClient = {
  // Companies & Multi-Tenant Selection
  getCompanies: async (): Promise<{ companyCode: string; companyName: string }[]> => {
    const res = await api.get("/config/companies");
    return res.data.companies || [];
  },

  // Configuration & Firms
  getFinancialYears: async (): Promise<any[]> => {
    const res = await api.get("/config/financial-years");
    return res.data.years || [];
  },

  getCompanyProfile: async (year?: string): Promise<CompanyProfile> => {
    const y = sanitizeYear(year);
    const res = await api.get(`/config/company?year=${y}`);
    return res.data.company;
  },

  getFirms: async (year?: string): Promise<Firm[]> => {
    const y = sanitizeYear(year);
    const res = await api.get(`/config/firms?year=${y}`);
    return res.data.firms || [];
  },

  saveFirm: async (year: string | undefined, firm: Partial<Firm>): Promise<Firm> => {
    const y = sanitizeYear(year);
    const res = await api.post(`/config/firms?year=${y}`, firm);
    return res.data.firm;
  },

  // Customers
  getCustomers: async (year?: string, search?: string): Promise<Customer[]> => {
    const y = sanitizeYear(year);
    const res = await api.get(`/customers?year=${y}${search ? `&search=${encodeURIComponent(search)}` : ""}`);
    return res.data.customers || [];
  },

  saveCustomer: async (year: string | undefined, customer: Partial<Customer>): Promise<Customer> => {
    const y = sanitizeYear(year);
    const res = await api.post(`/customers?year=${y}`, customer);
    return res.data.customer;
  },

  // Suppliers
  getSuppliers: async (year?: string, search?: string): Promise<Supplier[]> => {
    const y = sanitizeYear(year);
    const res = await api.get(`/suppliers?year=${y}${search ? `&search=${encodeURIComponent(search)}` : ""}`);
    return res.data.suppliers || [];
  },

  saveSupplier: async (year: string | undefined, supplier: Partial<Supplier>): Promise<Supplier> => {
    const y = sanitizeYear(year);
    const res = await api.post(`/suppliers?year=${y}`, supplier);
    return res.data.supplier;
  },

  // Items
  getItems: async (year?: string, group?: string, search?: string): Promise<Item[]> => {
    const y = sanitizeYear(year);
    let url = `/items?year=${y}`;
    if (group && group !== "ALL") url += `&group=${encodeURIComponent(group)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data.items || [];
  },

  saveItem: async (year: string | undefined, item: Partial<Item>): Promise<Item> => {
    const y = sanitizeYear(year);
    const res = await api.post(`/items?year=${y}`, item);
    return res.data.item;
  },

  getItemGroups: async (year?: string): Promise<string[]> => {
    const y = sanitizeYear(year);
    const res = await api.get(`/items/groups?year=${y}`);
    return res.data.groups || [];
  },

  // Units
  getUnits: async (year?: string): Promise<UnitMaster[]> => {
    const y = sanitizeYear(year);
    const res = await api.get(`/units?year=${y}`);
    return res.data.units || [];
  },

  saveUnit: async (a: any, b?: any): Promise<UnitMaster> => {
    const unit = typeof a === "object" ? a : b;
    const rawYear = typeof a === "string" ? a : typeof b === "string" ? b : "";
    const y = sanitizeYear(rawYear);
    const res = await api.post(`/units?year=${y}`, unit);
    return res.data.unit;
  },

  // Invoices
  getInvoices: async (year?: string, type?: string, search?: string, firm?: string): Promise<InvoiceHeader[]> => {
    const y = sanitizeYear(year);
    let url = `/invoices?year=${y}`;
    if (type && type !== "ALL") url += `&type=${encodeURIComponent(type)}`;
    if (firm && firm !== "ALL") url += `&firm=${encodeURIComponent(firm)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data.invoices || [];
  },

  getInvoiceByNo: async (
    year: string | undefined,
    invoiceNo: number | string,
    type?: string,
    firm?: string
  ): Promise<{ invoice: InvoiceHeader; amountInWords: string }> => {
    const y = sanitizeYear(year);
    let url = `/invoices/${invoiceNo}?year=${y}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (firm) url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data;
  },

  getNavInvoice: async (...args: any[]): Promise<{ invoice: InvoiceHeader; amountInWords: string }> => {
    const y = sanitizeYear(args[0]);
    let firm = "";
    let direction = "first";
    let currentNo = 1;
    let type = "";

    if (typeof args[1] === "string" && ["first", "prev", "next", "last"].includes(args[2])) {
      // Form: (year, firm, direction, currentNo, type)
      firm = args[1];
      direction = args[2];
      currentNo = typeof args[3] === "number" ? args[3] : parseInt(args[3], 10) || 1;
      type = args[4] || "";
    } else {
      // Form: (year, currentNo, direction, type, firm)
      currentNo = typeof args[1] === "number" ? args[1] : parseInt(args[1], 10) || 1;
      direction = args[2] || "first";
      type = args[3] || "";
      firm = args[4] || "";
    }

    let url = `/invoices/nav?year=${y}&current=${currentNo}&direction=${direction}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (firm) url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data;
  },

  getNextInvoiceNo: async (year?: string, type?: string, firm?: string): Promise<number> => {
    const y = sanitizeYear(year);
    let url = `/invoices/next-number?year=${y}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (firm) url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data.nextNo;
  },

  saveInvoice: async (
    year: string | undefined,
    invoice: Partial<InvoiceHeader>
  ): Promise<{ invoice: InvoiceHeader; amountInWords: string }> => {
    const y = sanitizeYear(year);
    const res = await api.post(`/invoices?year=${y}`, invoice);
    return res.data;
  },

  deleteInvoice: async (year: string | undefined, invoiceNo: number | string, type?: string, firm?: string): Promise<boolean> => {
    const y = sanitizeYear(year);
    let url = `/invoices/${invoiceNo}?year=${y}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (firm) url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.delete(url);
    return res.data.success;
  },

  // Accounts & Receipts
  getReceipts: async (year?: string, search?: string, firm?: string): Promise<Receipt[]> => {
    const y = sanitizeYear(year);
    let url = `/receipts?year=${y}`;
    if (firm && firm !== "ALL") url += `&firm=${encodeURIComponent(firm)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data.receipts || [];
  },

  saveReceipt: async (year: string | undefined, receipt: Partial<Receipt>): Promise<Receipt> => {
    const y = sanitizeYear(year);
    const res = await api.post(`/receipts?year=${y}`, receipt);
    return res.data.receipt;
  },

  getPartyLedger: async (
    year: string | undefined,
    partyName: string,
    partyType: "CUSTOMER" | "SUPPLIER" | "customer" | "supplier",
    startDate?: string,
    endDate?: string
  ): Promise<PartyLedgerStatement> => {
    const y = sanitizeYear(year);
    const normalizedType = String(partyType).toUpperCase();
    let url = `/reports/ledger?year=${y}&partyName=${encodeURIComponent(partyName)}&partyType=${normalizedType}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const res = await api.get(url);
    return res.data.ledger;
  },

  // ITC Book
  getITCRecords: async (
    year?: string,
    issueRec?: "R" | "D" | "ALL" | string,
    group?: string,
    bookName?: string,
    search?: string
  ): Promise<ITCRecord[]> => {
    const y = sanitizeYear(year);
    let url = `/itc?year=${y}`;
    if (issueRec) url += `&type=${issueRec}`;
    if (group && group !== "ALL") url += `&group=${encodeURIComponent(group)}`;
    if (bookName) url += `&bookName=${encodeURIComponent(bookName)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data.records || [];
  },

  getNextITCEntryNo: async (year?: string): Promise<number> => {
    const y = sanitizeYear(year);
    const res = await api.get(`/itc/next-number?year=${y}`);
    return res.data.nextNo;
  },

  saveITCRecord: async (year: string | undefined, record: Partial<ITCRecord>): Promise<ITCRecord> => {
    const y = sanitizeYear(year);
    const res = await api.post(`/itc?year=${y}`, record);
    return res.data.record;
  },

  deleteITCRecord: async (year: string | undefined, entryNo: number | string, type?: "R" | "D" | string): Promise<boolean> => {
    const y = sanitizeYear(year);
    let url = `/itc/${entryNo}?year=${y}`;
    if (type) url += `&type=${type}`;
    const res = await api.delete(url);
    return res.data.success;
  },

  getITCLedger: async (...args: any[]): Promise<ITCLedgerSummary> => {
    const y = sanitizeYear(args[0]);
    const group = args[1] || "";
    const bookName = args[2] || "";
    const fromDate = args[3] || "";
    const toDate = args[4] || "";
    let url = `/itc/ledger?year=${y}`;
    if (group && group !== "ALL") url += `&group=${encodeURIComponent(group)}`;
    if (bookName && bookName !== "ALL") url += `&bookName=${encodeURIComponent(bookName)}`;
    if (fromDate) url += `&startDate=${fromDate}`;
    if (toDate) url += `&endDate=${toDate}`;
    const res = await api.get(url);
    return res.data.ledger;
  }
};
