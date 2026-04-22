import { formatCurrency } from "./currency";

interface ReceiptItem {
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ReceiptSale {
  sale_number: string;
  created_at: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  customer_name?: string | null;
  items: ReceiptItem[];
}

interface ReceiptBusiness {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  currency: string;
  logo_url?: string | null;
}

export function generateReceiptHTML(
  sale: ReceiptSale,
  business: ReceiptBusiness
): string {
  const currency = business.currency || "NGN";
  const fmt = (n: number) => formatCurrency(n, currency);
  const date = new Date(sale.created_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const itemsHTML = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${fmt(item.unit_price)}</td>
        <td style="text-align:right">${fmt(item.line_total)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${sale.sale_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; max-width: 320px; margin: 0 auto; padding: 16px; }
    h1 { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 4px; }
    .center { text-align: center; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-weight: bold; padding: 4px 0; border-bottom: 1px solid #000; }
    th:not(:first-child) { text-align: right; }
    .total-row td { font-weight: bold; padding-top: 8px; }
    .footer { text-align: center; margin-top: 16px; font-size: 11px; }
  </style>
</head>
<body>
  ${business.logo_url ? `<div class="center" style="margin-bottom:8px"><img src="${business.logo_url}" alt="Logo" style="width:64px;height:64px;object-fit:cover;border-radius:8px;display:inline-block" /></div>` : ""}
  <h1>${business.name}</h1>
  ${business.address ? `<p class="center">${business.address}</p>` : ""}
  ${business.phone ? `<p class="center">${business.phone}</p>` : ""}
  <div class="divider"></div>
  <p><strong>Receipt:</strong> ${sale.sale_number}</p>
  <p><strong>Date:</strong> ${date}</p>
  ${sale.customer_name ? `<p><strong>Customer:</strong> ${sale.customer_name}</p>` : ""}
  <div class="divider"></div>
  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${fmt(sale.subtotal)}</td></tr>
    ${sale.discount_amount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${fmt(sale.discount_amount)}</td></tr>` : ""}
    ${sale.tax_amount > 0 ? `<tr><td>Tax</td><td style="text-align:right">${fmt(sale.tax_amount)}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${fmt(sale.total_amount)}</td></tr>
    <tr><td>Paid (${sale.payment_method})</td><td style="text-align:right">${fmt(sale.amount_paid)}</td></tr>
    ${sale.change_amount > 0 ? `<tr><td>Change</td><td style="text-align:right">${fmt(sale.change_amount)}</td></tr>` : ""}
  </table>
  <div class="divider"></div>
  <p class="footer">Thank you for your business!<br>Powered by VANTAGE</p>
</body>
</html>`;
}
