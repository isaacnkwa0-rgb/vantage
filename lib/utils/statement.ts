import { formatCurrency } from "./currency";

interface StatementEntry {
  date: string;
  description: string;
  type: "sale" | "invoice" | "payment" | "credit";
  debit: number;
  credit: number;
  balance: number;
}

interface StatementBusiness {
  name: string;
  currency: string;
  phone?: string | null;
  address?: string | null;
}

interface StatementCustomer {
  name: string;
  phone?: string | null;
  email?: string | null;
}

export function generateStatementHTML(
  business: StatementBusiness,
  customer: StatementCustomer,
  entries: StatementEntry[],
  openingBalance: number,
  fromDate: string,
  toDate: string
): string {
  const fmt = (n: number) => formatCurrency(n, business.currency);
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : openingBalance;

  const rows = entries.map((e) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#374151">
        ${new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#374151">${e.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;color:${e.debit > 0 ? "#dc2626" : "#9ca3af"}">${e.debit > 0 ? fmt(e.debit) : "—"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;color:${e.credit > 0 ? "#16a34a" : "#9ca3af"}">${e.credit > 0 ? fmt(e.credit) : "—"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;font-weight:600;color:${e.balance > 0 ? "#dc2626" : "#16a34a"}">${fmt(Math.abs(e.balance))} ${e.balance > 0 ? "DR" : "CR"}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Account Statement — ${customer.name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background:#fff; color:#0f172a; }
    @media print { @page { margin:16mm; } }
  </style>
</head>
<body style="padding:40px;max-width:800px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
    <div>
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-bottom:4px">Account Statement</p>
      <h1 style="font-size:24px;font-weight:800;color:#0f172a">${business.name}</h1>
      ${business.address ? `<p style="font-size:12px;color:#64748b;margin-top:4px">${business.address}</p>` : ""}
      ${business.phone ? `<p style="font-size:12px;color:#64748b">${business.phone}</p>` : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-bottom:4px">Statement for</p>
      <p style="font-size:16px;font-weight:700;color:#0f172a">${customer.name}</p>
      ${customer.phone ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${customer.phone}</p>` : ""}
      ${customer.email ? `<p style="font-size:12px;color:#64748b">${customer.email}</p>` : ""}
      <p style="font-size:12px;color:#64748b;margin-top:4px">
        ${new Date(fromDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} —
        ${new Date(toDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  </div>

  <!-- Summary -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:28px">
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b">Opening Balance</p>
      <p style="font-size:18px;font-weight:800;margin-top:4px;color:${openingBalance > 0 ? "#dc2626" : "#16a34a"}">${fmt(Math.abs(openingBalance))}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b">Total Charges</p>
      <p style="font-size:18px;font-weight:800;margin-top:4px;color:#dc2626">${fmt(entries.reduce((s, e) => s + e.debit, 0))}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b">Closing Balance</p>
      <p style="font-size:18px;font-weight:800;margin-top:4px;color:${closingBalance > 0 ? "#dc2626" : "#16a34a"}">${fmt(Math.abs(closingBalance))}</p>
    </div>
  </div>

  <!-- Transactions table -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:2px solid #e2e8f0">Date</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:2px solid #e2e8f0">Description</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:2px solid #e2e8f0">Charges</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:2px solid #e2e8f0">Payments</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:2px solid #e2e8f0">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${entries.length > 0 ? rows : `<tr><td colspan="5" style="padding:24px;text-align:center;color:#9ca3af;font-size:13px">No transactions in this period</td></tr>`}
    </tbody>
  </table>

  <div style="margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;display:flex;justify-content:space-between">
    <p style="font-size:11px;color:#94a3b8">Generated by VANTAGE · ${new Date().toLocaleDateString()}</p>
    ${closingBalance > 0
      ? `<p style="font-size:13px;font-weight:700;color:#dc2626">Amount Due: ${fmt(closingBalance)}</p>`
      : `<p style="font-size:13px;font-weight:700;color:#16a34a">Account clear</p>`}
  </div>
</body>
</html>`;
}
