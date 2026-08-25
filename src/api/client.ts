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

const api = axios.create({
  baseURL: "/api"
});

export const apiClient = {
  // Configuration & Firms
  getFinancialYears: async (): Promise<string[]> => {
    const res = await api.get("/config/financial-years");
    return res.data.years;
  },

  getCompanyProfile: async (year: string): Promise<CompanyProfile> => {
    const res = await api.get(`/config/company?year=${year}`);
    return res.data.company;
  },

  getFirms: async (year: string): Promise<Firm[]> => {
    const res = await api.get(`/config/firms?year=${year}`);
    return res.data.firms;
  },

  saveFirm: async (year: string, firm: Partial<Firm>): Promise<Firm> => {
    const res = await api.post(`/config/firms?year=${year}`, firm);
    return res.data.firm;
  },

  // Customers
  getCustomers: async (year: string, search?: string): Promise<Customer[]> => {
    const res = await api.get(`/customers?year=${year}${search ? `&search=${encodeURIComponent(search)}` : ""}`);
    return res.data.customers;
  },

  saveCustomer: async (year: string, customer: Partial<Customer>): Promise<Customer> => {
    const res = await api.post(`/customers?year=${year}`, customer);
    return res.data.customer;
  },

  // Suppliers
  getSuppliers: async (year: string, search?: string): Promise<Supplier[]> => {
    const res = await api.get(`/suppliers?year=${year}${search ? `&search=${encodeURIComponent(search)}` : ""}`);
    return res.data.suppliers;
  },

  saveSupplier: async (year: string, supplier: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.post(`/suppliers?year=${year}`, supplier);
    return res.data.supplier;
  },

  // Items
  getItems: async (year: string, group?: string, search?: string): Promise<Item[]> => {
    let url = `/items?year=${year}`;
    if (group && group !== "ALL") url += `&group=${encodeURIComponent(group)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data.items;
  },

  saveItem: async (year: string, item: Partial<Item>): Promise<Item> => {
    const res = await api.post(`/items?year=${year}`, item);
    return res.data.item;
  },

  getItemGroups: async (year: string): Promise<string[]> => {
    const res = await api.get(`/items/groups?year=${year}`);
    return res.data.groups;
  },

  // Units
  getUnits: async (year: string): Promise<UnitMaster[]> => {
    const res = await api.get(`/units?year=${year}`);
    return res.data.units;
  },

  saveUnit: async (year: string, unit: Partial<UnitMaster>): Promise<UnitMaster> => {
    const res = await api.post(`/units?year=${year}`, unit);
    return res.data.unit;
  },

  // Invoices
  getInvoices: async (year: string, type: InvoiceType, search?: string, firm?: string): Promise<InvoiceHeader[]> => {
    let url = `/invoices?year=${year}&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (firm && firm !== "ALL") url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data.invoices;
  },

  getNextInvoiceNo: async (year: string, type: InvoiceType, firm?: string): Promise<number> => {
    let url = `/invoices/next-number?year=${year}&type=${type}`;
    if (firm) url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data.nextNo;
  },

  getInvoiceByNo: async (year: string, invoiceNo: number, type: InvoiceType, firm?: string): Promise<{ invoice: InvoiceHeader; amountInWords: string }> => {
    let url = `/invoices/${invoiceNo}?year=${year}&type=${type}`;
    if (firm) url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data;
  },

  getNavInvoice: async (
    year: string,
    firm: string,
    action: "first" | "prev" | "next" | "last",
    currentNo?: number
  ): Promise<{ invoice: InvoiceHeader; amountInWords: string }> => {
    let url = `/invoices/nav?year=${year}&firm=${encodeURIComponent(firm)}&action=${action}`;
    if (currentNo) url += `&currentNo=${currentNo}`;
    const res = await api.get(url);
    return res.data;
  },

  saveInvoice: async (year: string, invoice: InvoiceHeader): Promise<{ invoice: InvoiceHeader; amountInWords: string }> => {
    const res = await api.post(`/invoices?year=${year}`, invoice);
    return res.data;
  },

  deleteInvoice: async (year: string, invoiceNo: number, type: InvoiceType, firm?: string): Promise<boolean> => {
    let url = `/invoices/${invoiceNo}?year=${year}&type=${type}`;
    if (firm) url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.delete(url);
    return res.data.success;
  },

  // ITC Book Module
  getITCRecords: async (
    year: string,
    issueRec?: "R" | "D" | "ALL",
    group?: string,
    bookName?: string,
    search?: string
  ): Promise<ITCRecord[]> => {
    let url = `/itc?year=${year}`;
    if (issueRec && issueRec !== "ALL") url += `&type=${issueRec}`;
    if (group && group !== "ALL") url += `&group=${encodeURIComponent(group)}`;
    if (bookName) url += `&bookName=${encodeURIComponent(bookName)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data.records;
  },

  getNextITCEntryNo: async (year: string): Promise<number> => {
    const res = await api.get(`/itc/next-number?year=${year}`);
    return res.data.nextNo;
  },

  saveITCRecord: async (year: string, record: Partial<ITCRecord>): Promise<ITCRecord> => {
    const res = await api.post(`/itc?year=${year}`, record);
    return res.data.record;
  },

  deleteITCRecord: async (year: string, entryNo: number): Promise<boolean> => {
    const res = await api.delete(`/itc/${entryNo}?year=${year}`);
    return res.data.success;
  },

  getITCLedger: async (
    year: string,
    group?: string,
    bookName?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<ITCLedgerSummary> => {
    let url = `/itc/ledger?year=${year}`;
    if (group && group !== "ALL") url += `&group=${encodeURIComponent(group)}`;
    if (bookName && bookName !== "ALL") url += `&bookName=${encodeURIComponent(bookName)}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    const res = await api.get(url);
    return res.data.ledger;
  },

  // Accounts & Ledgers
  getPartyLedger: async (
    year: string,
    partyName: string,
    partyType: "customer" | "supplier",
    fromDate: string,
    toDate: string,
    firm?: string
  ): Promise<PartyLedgerStatement> => {
    let url = `/reports/ledger?year=${year}&partyName=${encodeURIComponent(partyName)}&partyType=${partyType}&fromDate=${fromDate}&toDate=${toDate}`;
    if (firm && firm !== "ALL") url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data.ledger;
  },

  getReceipts: async (year: string, search?: string, firm?: string): Promise<Receipt[]> => {
    let url = `/receipts?year=${year}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    if (firm && firm !== "ALL") url += `&firm=${encodeURIComponent(firm)}`;
    const res = await api.get(url);
    return res.data.receipts;
  },

  saveReceipt: async (year: string, receipt: Partial<Receipt>): Promise<Receipt> => {
    const res = await api.post(`/receipts?year=${year}`, receipt);
    return res.data.receipt;
  }
};
