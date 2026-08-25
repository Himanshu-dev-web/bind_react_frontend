export interface CompanyProfile {
  companyName: string;
  address1: string;
  address2: string;
  city: string;
  gst: number;
  invoiceCondition: string;
}

export interface Firm {
  name: string;
  address: string;
  city?: string;
  state?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  bankName?: string;
  bankBranch?: string;
  accountNo?: string;
  ifscCode?: string;
  bank?: string;
  account?: string;
  ifsc?: string;
}

export interface Customer {
  code?: string;
  name: string;
  address1?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  tin?: string;
  cst?: string;
  opBal?: number;
  drCr?: "Dr" | "Cr";
}

export interface Supplier {
  code?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  mobile?: string;
  gstin?: string;
  pan?: string;
  opBal?: number;
  drCr?: "Dr" | "Cr";
}

export interface Item {
  autoId?: number;
  itemGp: string;
  itemName: string;
  unit: string;
  rate: number;
  rate1?: number;
  rate2?: number;
  rate3?: number;
  rate4?: number;
  hsnCode?: string;
  openingStock?: number;
  remarks?: string;
}

export interface UnitMaster {
  autoId?: number;
  name: string;
  rate: number;
}

export type InvoiceType = 
  | "TAXINVOICE"
  | "SALEINVOICE"
  | "BILL"
  | "CASH MEMO"
  | "CHALLAN/TRANSFER INVOICE"
  | "PERFORMAINVOICE";

export interface InvoiceLineItem {
  sNo: number;
  itemName: string;
  hsnCode: string;
  qty: number;
  rate: number;
  amount: number;
  description?: string;
  remarks?: string;
}

export interface InvoiceHeader {
  invoiceNo: number;
  bookNo?: string;
  formattedInvoiceNo?: string;
  invoiceType: InvoiceType;
  firmName?: string;
  invoiceDate: string;
  customerName: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  vehicleNo?: string;
  transMode?: string;
  dateOfSupply?: string;
  placeOfSupply?: string;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  loadingUnloading: number;
  otherCharges: number;
  totalAmount: number;
  roundOff: number;
  remarks?: string;
  items: InvoiceLineItem[];
}

export interface LedgerEntry {
  date: string;
  voucherType?: string;
  voucherNo?: string;
  particulars?: string;
  narration?: string;
  description?: string;
  debit: number;
  credit: number;
  balance?: number;
  runningBalance?: number;
}

export interface PartyLedgerStatement {
  partyName: string;
  fromDate?: string;
  toDate?: string;
  openingBalance: number;
  openingDrCr?: string;
  closingBalance: number;
  closingDrCr?: string;
  totalDebit: number;
  totalCredit: number;
  entries: LedgerEntry[];
}

export interface Receipt {
  recNo: number;
  recDate: string;
  date?: string;
  partyName: string;
  customerName?: string;
  amount: number;
  payMode: "Cash" | "Bank" | "Cheque";
  bankCash?: string;
  bankName?: string;
  chequeNo?: string;
  remarks?: string;
}

export interface ITCRecord {
  entryNo: number;
  entDate: string;
  partyName?: string;
  bookName: string;
  bgp: string;
  innerPaperCover?: string;
  challanNo: string;
  qty: number;
  descr?: string;
  issueRec: "R" | "D";
  stno?: string;
  st?: string;
}

export interface ITCLedgerEntry {
  date: string;
  challanNo: string;
  bookName: string;
  bgp: string;
  descr: string;
  type: string;
  receivedQty: number;
  deliveredQty: number;
  balanceQty: number;
}

export interface ITCLedgerSummary {
  bookName: string;
  bgp: string;
  totalReceived: number;
  totalDelivered: number;
  balanceQty: number;
  entries: ITCLedgerEntry[];
}
