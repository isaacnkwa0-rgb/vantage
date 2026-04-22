import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Calendar,
  AlertTriangle,
  Users,
  Scissors,
  Utensils,
  Star,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface Props {
  todayRevenue: number;
  todaySalesCount: number;
  todayExpenses: number;
  monthRevenue: number;
  lowStockCount: number;
  totalCustomers: number;
  avgTransactionValue: number;
  currency: string;
  businessType: "retail" | "service" | "restaurant";
}

export function DashboardStats({
  todayRevenue,
  todaySalesCount,
  todayExpenses,
  monthRevenue,
  lowStockCount,
  totalCustomers,
  avgTransactionValue,
  currency,
  businessType,
}: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);
  const month = new Date().toLocaleString("default", { month: "long" });

  const isService = businessType === "service";
  const isRestaurant = businessType === "restaurant";

  const txLabel = isService ? "services" : isRestaurant ? "orders" : "sales";
  const txSingular = isService ? "service" : isRestaurant ? "order" : "sale";
  const customerLabel = isService ? "Total Clients" : "Total Customers";
  const customerSub = isService ? "registered clients" : isRestaurant ? "customers" : "registered";
  const todayTxLabel = isService ? "Today's Services" : isRestaurant ? "Today's Orders" : "Today's Sales";
  const txUnit = isService ? "services" : isRestaurant ? "orders" : "transactions";

  const TxIcon = isService ? Scissors : isRestaurant ? Utensils : ShoppingBag;

  return (
    <div className="space-y-3">
      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Today&apos;s Revenue</p>
            <p className="font-numeric text-2xl font-bold text-[#0F172A] mt-0.5 truncate">{fmt(todayRevenue)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {todaySalesCount} {todaySalesCount !== 1 ? txLabel : txSingular} today
            </p>
          </div>
        </div>

        {/* Month Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400" />
          <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-200">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Month Revenue</p>
            <p className="font-numeric text-2xl font-bold text-[#0F172A] mt-0.5 truncate">{fmt(monthRevenue)}</p>
            <p className="text-xs text-slate-400 mt-1">{month}</p>
          </div>
        </div>

        {/* Customers / Clients */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-400" />
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-200">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{customerLabel}</p>
            <p className="font-numeric text-2xl font-bold text-[#0F172A] mt-0.5">{totalCustomers.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{customerSub}</p>
          </div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Today's tx count */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-sm shadow-green-200">
              <TxIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-medium">{todayTxLabel}</p>
          </div>
          <p className="font-numeric text-xl font-bold text-[#0F172A]">{todaySalesCount}</p>
          <p className="text-xs text-slate-400">{txUnit}</p>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center shadow-sm shadow-red-200">
              <Receipt className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Today&apos;s Expenses</p>
          </div>
          <p className="font-numeric text-xl font-bold text-[#0F172A]">{fmt(todayExpenses)}</p>
          <p className="text-xs text-slate-400">recorded today</p>
        </div>

        {/* Third metric: Low Stock (retail) | Avg value (service/restaurant) */}
        {businessType === "retail" ? (
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm ${lowStockCount > 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200" : "bg-gradient-to-br from-slate-300 to-slate-400"}`}>
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Low Stock</p>
            </div>
            <p className={`font-numeric text-xl font-bold ${lowStockCount > 0 ? "text-amber-600" : "text-[#0F172A]"}`}>
              {lowStockCount}
            </p>
            <p className="text-xs text-slate-400">items need restock</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-400 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isService ? "Avg. Service Value" : "Avg. Order Value"}
              </p>
            </div>
            <p className="font-numeric text-xl font-bold text-[#0F172A]">
              {avgTransactionValue > 0 ? fmt(avgTransactionValue) : "—"}
            </p>
            <p className="text-xs text-slate-400">per {isService ? "service" : "order"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
