import { formatCurrency } from "./currency";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  status: string;
  client_name?: string | null;
  client_email?: string | null;
  client_address?: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  notes?: string | null;
  bank_details?: string | null;
  items: InvoiceItem[];
}

interface InvoiceBusiness {
  name: string;
  currency: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logo_url?: string | null;
}

export function generateInvoiceHTML(invoice: InvoiceData, business: InvoiceBusiness): string {
  const currency = business.currency || "NGN";
  const fmt = (n: number) => formatCurrency(n, currency);
  const issueDate = new Date(invoice.issue_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const statusColor: Record<string, string> = {
    draft: "#94a3b8",
    sent: "#3b82f6",
    paid: "#10b981",
    overdue: "#ef4444",
    cancelled: "#6b7280",
  };

  const itemsHTML = invoice.items
    .map(
      (item, i) => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 8px;color:#374151">${i + 1}</td>
      <td style="padding:10px 8px;color:#111827;font-weight:500">${item.description}</td>
      <td style="padding:10px 8px;text-align:right;color:#374151">${item.quantity}</td>
      <td style="padding:10px 8px;text-align:right;color:#374151">${fmt(item.unit_price)}</td>
      <td style="padding:10px 8px;text-align:right;color:#111827;font-weight:600">${fmt(item.line_total)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size:14px; color:#374151; background:#fff; }
    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body style="padding:40px;max-width:800px;margin:0 auto">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
    <div>
      ${business.logo_url ? `<img src="${business.logo_url}" alt="Logo" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-bottom:12px;display:block" />` : ""}
      <h1 style="font-size:24px;font-weight:800;color:#0f172a">${business.name}</h1>
      ${business.address ? `<p style="color:#64748b;margin-top:4px">${business.address}</p>` : ""}
      ${business.phone ? `<p style="color:#64748b">${business.phone}</p>` : ""}
      ${business.email ? `<p style="color:#64748b">${business.email}</p>` : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:32px;font-weight:900;color:#0f172a;letter-spacing:-1px">INVOICE</p>
      <p style="font-size:16px;font-weight:600;color:#3b82f6;margin-top:4px">${invoice.invoice_number}</p>
      <span style="display:inline-block;margin-top:8px;padding:4px 12px;background:${statusColor[invoice.status] ?? "#94a3b8"}20;color:${statusColor[invoice.status] ?? "#94a3b8"};border-radius:99px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">
        ${invoice.status}
      </span>
    </div>
  </div>

  <!-- Bill To + Dates -->
  <div style="display:flex;justify-content:space-between;margin-bottom:32px">
    <div>
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:6px">Bill To</p>
      ${invoice.client_name ? `<p style="font-weight:600;color:#0f172a;font-size:15px">${invoice.client_name}</p>` : "<p style='color:#94a3b8'>—</p>"}
      ${invoice.client_email ? `<p style="color:#64748b">${invoice.client_email}</p>` : ""}
      ${invoice.client_address ? `<p style="color:#64748b">${invoice.client_address}</p>` : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:6px">Dates</p>
      <p style="color:#374151"><strong>Issued:</strong> ${issueDate}</p>
      ${dueDate ? `<p style="color:#374151"><strong>Due:</strong> ${dueDate}</p>` : ""}
    </div>
  </div>

  <!-- Items table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f8fafc;border-radius:8px">
        <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">#</th>
        <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Description</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Qty</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Price</th>
        <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
    <div style="min-width:280px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9">
        <span style="color:#64748b">Subtotal</span>
        <span style="font-weight:600;color:#0f172a">${fmt(invoice.subtotal)}</span>
      </div>
      ${invoice.discount_amount > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9">
        <span style="color:#64748b">Discount</span>
        <span style="font-weight:600;color:#10b981">-${fmt(invoice.discount_amount)}</span>
      </div>` : ""}
      ${invoice.tax_amount > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9">
        <span style="color:#64748b">Tax</span>
        <span style="font-weight:600;color:#374151">${fmt(invoice.tax_amount)}</span>
      </div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #0f172a;margin-top:4px">
        <span style="font-size:16px;font-weight:800;color:#0f172a">Total</span>
        <span style="font-size:18px;font-weight:800;color:#0f172a">${fmt(invoice.total_amount)}</span>
      </div>
      ${invoice.amount_paid > 0 && invoice.amount_paid < invoice.total_amount ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;background:#fef2f2;border-radius:6px;padding:8px;margin-top:8px">
        <span style="color:#ef4444;font-weight:600">Balance Due</span>
        <span style="font-weight:700;color:#ef4444">${fmt(invoice.total_amount - invoice.amount_paid)}</span>
      </div>` : ""}
    </div>
  </div>

  ${invoice.bank_details ? `
  <!-- Bank details -->
  <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:24px">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:8px">Payment Details</p>
    <p style="white-space:pre-line;color:#374151;font-size:13px">${invoice.bank_details}</p>
  </div>` : ""}

  ${invoice.notes ? `
  <!-- Notes -->
  <div style="margin-bottom:24px">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:6px">Notes</p>
    <p style="color:#64748b;font-size:13px">${invoice.notes}</p>
  </div>` : ""}

  <div style="border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;color:#94a3b8;font-size:11px">
    Generated by VANTAGE
  </div>
</body>
</html>`;
}
