"use client";

import { useState } from "react";
import { Search, Briefcase } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  image_url: string | null;
  categories: { name: string; color: string } | null;
}

interface Props {
  services: Service[];
  currency: string;
}

export function ServiceSearchPanel({ services, currency }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const cartIds = new Set(useCartStore((s) => s.items).map((i) => i.productId));

  const categories = Array.from(
    new Map(
      services
        .filter((s) => s.categories)
        .map((s) => [s.categories!.name, s.categories!])
    ).values()
  );

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q);
    const matchCat = !activeCategory || s.categories?.name === activeCategory;
    return matchSearch && matchCat;
  });

  function addService(service: Service) {
    addItem({
      productId: service.id,
      name: service.name,
      unitPrice: service.selling_price,
      costPrice: service.cost_price,
      imageUrl: service.image_url,
    });
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Search */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            autoFocus
          />
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition",
                !activeCategory
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                className={cn(
                  "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition",
                  activeCategory === cat.name ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                style={activeCategory === cat.name ? { backgroundColor: cat.color } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Service grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Briefcase className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-500 text-sm">No services found</p>
            <p className="text-slate-400 text-xs mt-1">Add services in the Services catalog</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((service) => {
              const inCart = cartIds.has(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => addService(service)}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition active:scale-[0.97]",
                    inCart
                      ? "border-green-500 bg-green-50 shadow-md shadow-green-100"
                      : "border-slate-200 bg-white hover:border-green-300 hover:shadow-sm"
                  )}
                >
                  {/* Category dot */}
                  {service.categories && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white mb-2"
                      style={{ backgroundColor: service.categories.color }}
                    >
                      {service.categories.name}
                    </span>
                  )}

                  <p className={cn("font-semibold text-sm leading-snug", inCart ? "text-green-700" : "text-[#0F172A]")}>
                    {service.name}
                  </p>

                  <p className={cn("font-numeric text-base font-bold mt-1.5", inCart ? "text-green-600" : "text-green-600")}>
                    {formatCurrency(service.selling_price, currency)}
                  </p>

                  {inCart && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
