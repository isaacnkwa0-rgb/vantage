"use client";

import { useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { Printer, Usb, CheckCircle, XCircle, ReceiptText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
}

interface SaleItem {
  quantity: number;
  unit_price: number;
  products: { name: string } | null;
}

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  customers: { name: string } | null;
  sale_items: SaleItem[];
}

interface Props {
  business: Business;
  recentSales: Sale[];
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: object): Promise<SerialPort>;
    };
  }
  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    writable: WritableStream<Uint8Array>;
  }
}

const ESC = 0x1b;
const GS = 0x1d;

function buildReceipt(business: Business, sale: Sale, currency: string): Uint8Array {
  const fmt = (n: number) => formatCurrency(n, currency);
  const lines: number[] = [];

  const push = (bytes: number[]) => lines.push(...bytes);
  const text = (s: string) => { for (const c of s) lines.push(c.charCodeAt(0) & 0xff); };
  const nl = () => lines.push(0x0a);
  const center = () => push([ESC, 0x61, 0x01]);
  const left = () => push([ESC, 0x61, 0x00]);
  const bold = (on: boolean) => push([ESC, 0x45, on ? 1 : 0]);
  const doubleHeight = (on: boolean) => push([ESC, 0x21, on ? 0x10 : 0x00]);
  const divider = () => { text("--------------------------------"); nl(); };
  const cut = () => push([GS, 0x56, 0x42, 0x00]);

  // Init
  push([ESC, 0x40]);

  // Header
  center(); bold(true); doubleHeight(true);
  text(business.name.toUpperCase().slice(0, 24)); nl();
  doubleHeight(false); bold(false);
  if (business.address) { text(business.address.slice(0, 32)); nl(); }
  if (business.city) { text(business.city.slice(0, 32)); nl(); }
  if (business.phone) { text("Tel: " + business.phone); nl(); }
  nl();

  // Receipt info
  left(); divider();
  text("Receipt: " + sale.sale_number); nl();
  text("Date: " + new Date(sale.created_at).toLocaleString()); nl();
  if (sale.customers?.name) { text("Customer: " + sale.customers.name.slice(0, 24)); nl(); }
  divider();

  // Items
  for (const item of sale.sale_items) {
    const name = (item.products?.name ?? "Item").slice(0, 20);
    const price = fmt(item.quantity * item.unit_price);
    const line = `${item.quantity}x ${name}`;
    const padLen = 32 - line.length - price.length;
    text(line + " ".repeat(Math.max(1, padLen)) + price); nl();
  }
  divider();

  // Total
  bold(true);
  const totalLine = "TOTAL";
  const totalVal = fmt(sale.total_amount);
  const padLen = 32 - totalLine.length - totalVal.length;
  text(totalLine + " ".repeat(Math.max(1, padLen)) + totalVal); nl();
  bold(false);
  text("Payment: " + sale.payment_method.toUpperCase()); nl();
  divider();

  // Footer
  center();
  text("Thank you for your business!"); nl();
  nl(); nl(); nl();
  cut();

  return new Uint8Array(lines);
}

export function ThermalPrinterClient({ business, recentSales }: Props) {
  const fmt = (n: number) => formatCurrency(n, business.currency);
  const [port, setPort] = useState<SerialPort | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [printing, setPrinting] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<"ok" | "error" | null>(null);

  const supportsSerial = typeof navigator !== "undefined" && !!navigator.serial;

  async function connectPrinter() {
    if (!navigator.serial) return;
    setConnecting(true);
    try {
      const p = await navigator.serial.requestPort({ filters: [] });
      await p.open({ baudRate: 9600 });
      setPort(p);
      setLastStatus("ok");
    } catch {
      setLastStatus("error");
    }
    setConnecting(false);
  }

  async function disconnectPrinter() {
    if (!port) return;
    try { await port.close(); } catch {}
    setPort(null);
  }

  async function printReceipt(sale: Sale) {
    const bytes = buildReceipt(business, sale, business.currency);

    if (port) {
      // Print via Web Serial
      setPrinting(sale.id);
      try {
        const writer = port.writable.getWriter();
        await writer.write(bytes);
        writer.releaseLock();
        setLastStatus("ok");
      } catch {
        setLastStatus("error");
      }
      setPrinting(null);
    } else {
      // Fallback: open print window with receipt-style HTML
      const win = window.open("", "_blank", "width=400,height=700");
      if (!win) return;
      const items = sale.sale_items.map((item) =>
        `<tr><td>${item.quantity}x ${(item.products?.name ?? "Item").slice(0, 24)}</td><td style="text-align:right">${fmt(item.quantity * item.unit_price)}</td></tr>`
      ).join("");
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title>
        <style>
          body{font-family:'Courier New',monospace;font-size:12px;width:300px;margin:0 auto;padding:10px}
          h2{text-align:center;font-size:14px;margin:0 0 4px}
          p{text-align:center;margin:2px 0;font-size:11px}
          hr{border:none;border-top:1px dashed #000;margin:6px 0}
          table{width:100%;border-collapse:collapse}
          td{padding:2px 0;vertical-align:top}
          .total td{font-weight:bold;font-size:13px;border-top:1px dashed #000;padding-top:4px}
          .footer{text-align:center;margin-top:8px;font-size:11px}
          @media print{button{display:none}}
        </style></head><body>
        <h2>${business.name.toUpperCase()}</h2>
        ${business.address ? `<p>${business.address}</p>` : ""}
        ${business.phone ? `<p>Tel: ${business.phone}</p>` : ""}
        <hr/>
        <p style="text-align:left">Receipt: ${sale.sale_number}</p>
        <p style="text-align:left">Date: ${new Date(sale.created_at).toLocaleString()}</p>
        ${sale.customers?.name ? `<p style="text-align:left">Customer: ${sale.customers.name}</p>` : ""}
        <hr/>
        <table>${items}</table>
        <table><tr class="total"><td>TOTAL</td><td style="text-align:right">${fmt(sale.total_amount)}</td></tr></table>
        <p style="text-align:left">Payment: ${sale.payment_method.toUpperCase()}</p>
        <hr/>
        <p class="footer">Thank you for your business!</p>
        <br/><button onclick="window.print()">Print</button>
      </body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  }

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Thermal Printer (ESC/POS)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Print receipts directly to a USB/serial thermal printer</p>
        </div>
      </div>

      {/* Printer connection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", port ? "bg-green-100" : "bg-slate-100")}>
              <Usb className={cn("w-5 h-5", port ? "text-green-600" : "text-slate-400")} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">
                {port ? "Printer connected" : "No printer connected"}
              </p>
              <p className="text-xs text-slate-400">
                {supportsSerial
                  ? port ? "Ready to print ESC/POS receipts" : "Connect via Web Serial API (Chrome / Edge)"
                  : "Web Serial not supported — receipts will open in print window"}
              </p>
            </div>
          </div>
          {supportsSerial && (
            port
              ? <button onClick={disconnectPrinter} className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">Disconnect</button>
              : <button onClick={connectPrinter} disabled={connecting} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  <Usb className="w-4 h-4" /> {connecting ? "Connecting..." : "Connect Printer"}
                </button>
          )}
        </div>
        {lastStatus && (
          <div className={cn("mt-3 flex items-center gap-2 text-sm", lastStatus === "ok" ? "text-green-600" : "text-red-500")}>
            {lastStatus === "ok" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {lastStatus === "ok" ? "Last operation successful" : "Last operation failed — check printer connection"}
          </div>
        )}
      </div>

      {/* Receipt list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-[#0F172A]">Recent Receipts</h3>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-center">
            <ReceiptText className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-[#0F172A]">No recent sales</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition group">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{sale.sale_number}</p>
                  <p className="text-xs text-slate-400">
                    {sale.customers?.name ?? "Walk-in"} · {new Date(sale.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-numeric text-sm font-bold text-[#0F172A]">{fmt(sale.total_amount)}</span>
                  <button
                    onClick={() => printReceipt(sale)}
                    disabled={printing === sale.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {printing === sale.id ? "Printing..." : "Print"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
