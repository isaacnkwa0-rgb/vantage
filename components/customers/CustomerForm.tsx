"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  businessId: string;
  editingCustomer: any | null;
  onClose: () => void;
}

export function CustomerForm({ businessId, editingCustomer, onClose }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingCustomer ? {
      name: editingCustomer.name,
      email: editingCustomer.email ?? "",
      phone: editingCustomer.phone ?? "",
      address: editingCustomer.address ?? "",
      notes: editingCustomer.notes ?? "",
    } : {},
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const payload = {
      business_id: businessId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    };
    if (editingCustomer) {
      const { error: err } = await supabase.from("customers").update(payload).eq("id", editingCustomer.id);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from("customers").insert(payload);
      if (err) { setError(err.message); return; }
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-[#0F172A]">{editingCustomer ? "Edit Customer" : "Add Customer"}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Name *</label>
            <input {...register("name")} placeholder="Customer name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Phone</label>
              <input {...register("phone")} type="tel" placeholder="+234..." className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Email</label>
              <input {...register("email")} type="email" placeholder="email@..." className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Address</label>
            <input {...register("address")} placeholder="Optional" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Notes</label>
            <textarea {...register("notes")} rows={2} placeholder="Optional notes" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-green-300/40">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCustomer ? "Save changes" : "Add customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
