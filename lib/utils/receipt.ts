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
  receipt_footer?: string | null;
  receipt_tagline?: string | null;
  receipt_show_logo?: boolean | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_whatsapp?: string | null;
}

export function generateReceiptHTML(
  sale: ReceiptSale,
  business: ReceiptBusiness
): string {
  const currency = business.currency || "NGN";
  const fmt = (n: number) => formatCurrency(n, currency);
  const accent = "#1a9c38";

  const date = new Date(sale.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = new Date(sale.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const showLogo = business.receipt_show_logo !== false;
  const footerText = business.receipt_footer?.trim() || "Thank you for your business!";

  const itemsHTML = sale.items
    .map(
      (item, i) => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 8px;color:#64748b;font-size:13px">${i + 1}</td>
      <td style="padding:10px 8px;color:#111827;font-weight:500">
        ${item.product_name}
        ${item.variant_name ? `<span style="color:#94a3b8;font-size:12px;font-weight:400"> — ${item.variant_name}</span>` : ""}
      </td>
      <td style="padding:10px 8px;text-align:center;color:#374151">${item.quantity}</td>
      <td style="padding:10px 8px;text-align:right;color:#374151">${fmt(item.unit_price)}</td>
      <td style="padding:10px 8px;text-align:right;color:#111827;font-weight:600">${fmt(item.line_total)}</td>
    </tr>`
    )
    .join("");

  const socials = [
    business.social_instagram ? `Instagram: @${business.social_instagram}` : "",
    business.social_twitter ? `X / Twitter: @${business.social_twitter}` : "",
    business.social_whatsapp ? `WhatsApp: ${business.social_whatsapp}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  const paymentMethod =
    sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1);

  const pdfTitle = `${business.name} - Receipt - ${date}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pdfTitle}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size:14px; color:#374151; background:#fff; }
    @page { size:A4; margin:0; }
    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body style="padding:48px;max-width:794px;margin:0 auto;min-height:1123px;display:flex;flex-direction:column">

  <!-- ── Header ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px">
    <div>
      ${showLogo && business.logo_url
        ? `<img src="${business.logo_url}" alt="${business.name}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;margin-bottom:12px;display:block" />`
        : ""}
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.3px">${business.name}</h1>
      ${business.receipt_tagline
        ? `<p style="color:#64748b;font-size:13px;margin-top:2px">${business.receipt_tagline}</p>`
        : ""}
      ${business.address
        ? `<p style="color:#64748b;font-size:13px;margin-top:6px">${business.address}</p>`
        : ""}
      ${business.phone
        ? `<p style="color:#64748b;font-size:13px">${business.phone}</p>`
        : ""}
      ${business.email
        ? `<p style="color:#64748b;font-size:13px">${business.email}</p>`
        : ""}
    </div>
    <div style="text-align:right">
      <p style="font-size:38px;font-weight:900;color:#0f172a;letter-spacing:-2px;line-height:1">RECEIPT</p>
      <p style="font-size:15px;font-weight:600;color:${accent};margin-top:6px">${sale.sale_number}</p>
      <p style="color:#64748b;font-size:13px;margin-top:3px">${date}</p>
      <p style="color:#94a3b8;font-size:12px">${time}</p>
      <span style="display:inline-block;margin-top:10px;padding:4px 14px;background:#dcfce7;color:#1a9c38;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">
        PAID
      </span>
    </div>
  </div>

  <!-- ── Accent divider ── -->
  <div style="height:3px;background:linear-gradient(to right,${accent},#86efac,#f0fdf4);border-radius:2px;margin-bottom:32px"></div>

  ${sale.customer_name ? `
  <!-- ── Customer ── -->
  <div style="display:flex;justify-content:space-between;margin-bottom:28px">
    <div>
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8;margin-bottom:5px">Sold To</p>
      <p style="font-weight:600;color:#0f172a;font-size:15px">${sale.customer_name}</p>
    </div>
  </div>` : ""}

  <!-- ── Items table ── -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;width:32px">#</th>
        <th style="padding:10px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8">Item</th>
        <th style="padding:10px 8px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;width:60px">Qty</th>
        <th style="padding:10px 8px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;width:120px">Unit Price</th>
        <th style="padding:10px 8px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;width:120px">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <!-- ── Totals + Payment block ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:32px">

    <!-- Payment method pill -->
    <div style="flex:1;background:#f8fafc;border-radius:12px;padding:16px 20px;align-self:flex-end">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8;margin-bottom:8px">Payment Method</p>
      <p style="font-size:15px;font-weight:700;color:#0f172a">${paymentMethod}</p>
      ${sale.change_amount > 0
        ? `<p style="font-size:12px;color:#64748b;margin-top:4px">Cash tendered: ${fmt(sale.amount_paid)}</p>
           <p style="font-size:12px;color:#64748b">Change given: ${fmt(sale.change_amount)}</p>`
        : ""}
    </div>

    <!-- Totals -->
    <div style="min-width:264px">
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9">
        <span style="color:#64748b;font-size:13px">Subtotal</span>
        <span style="font-weight:500;color:#0f172a;font-size:13px">${fmt(sale.subtotal)}</span>
      </div>
      ${sale.discount_amount > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9">
        <span style="color:#64748b;font-size:13px">Discount</span>
        <span style="font-weight:500;color:#1a9c38;font-size:13px">-${fmt(sale.discount_amount)}</span>
      </div>` : ""}
      ${sale.tax_amount > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9">
        <span style="color:#64748b;font-size:13px">Tax</span>
        <span style="font-weight:500;color:#374151;font-size:13px">${fmt(sale.tax_amount)}</span>
      </div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:12px 14px;background:${accent};border-radius:10px;margin-top:8px">
        <span style="font-size:15px;font-weight:800;color:#fff">TOTAL</span>
        <span style="font-size:18px;font-weight:900;color:#fff">${fmt(sale.total_amount)}</span>
      </div>
    </div>
  </div>

  <!-- ── Footer ── -->
  <div style="margin-top:auto;border-top:1px solid #e2e8f0;padding-top:20px;text-align:center">
    <p style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:4px">${footerText}</p>
    ${socials
      ? `<p style="font-size:12px;color:#64748b;margin-bottom:8px">${socials}</p>`
      : ""}
    <p style="font-size:11px;color:#cbd5e1;margin-top:8px">Generated by VANTAGE &nbsp;·&nbsp; ${sale.sale_number}</p>
  </div>

</body>
</html>`;
}
