"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { logAudit } from "@/lib/utils/audit";
import { X, Loader2, Plus, Tag } from "lucide-react";

const TAG_COLORS = [
  "#1a9c38", "#2563eb", "#9333ea", "#dc2626", "#ea580c",
  "#ca8a04", "#0891b2", "#db2777", "#64748b", "#0d9488",
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface CustomerTag {
  id: string;
  name: string;
  color: string;
}

interface Props {
  businessId: string;
  userId: string;
  editingCustomer: any | null;
  tags: CustomerTag[];
  onClose: (newTags?: CustomerTag[]) => void;
}

export function CustomerForm({ businessId, userId, editingCustomer, tags: initialTags, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<CustomerTag[]>(initialTags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    (editingCustomer?.customer_tag_assignments ?? []).map((a: any) => a.tag_id)
  );

  // Inline tag creation state
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [creatingTag, setCreatingTag] = useState(false);

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

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function createTag() {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("customer_tags")
      .insert({ business_id: businessId, name: newTagName.trim(), color: newTagColor })
      .select()
      .single();
    if (err) { setCreatingTag(false); return; }
    const newTag = data as CustomerTag;
    setTags((prev) => [...prev, newTag]);
    setSelectedTagIds((prev) => [...prev, newTag.id]);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[0]);
    setShowNewTag(false);
    setCreatingTag(false);
  }

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

    let customerId = editingCustomer?.id;

    if (editingCustomer) {
      const { error: err } = await supabase.from("customers").update(payload).eq("id", customerId);
      if (err) { setError(err.message); return; }
      logAudit({ businessId, userId, action: "customer.updated", entityType: "customer", entityId: customerId, entityName: data.name });
    } else {
      const { data: inserted, error: err } = await supabase.from("customers").insert(payload).select().single();
      if (err || !inserted) { setError(err?.message ?? "Failed to add customer"); return; }
      customerId = inserted.id;
      logAudit({ businessId, userId, action: "customer.created", entityType: "customer", entityId: customerId, entityName: data.name });
    }

    // Sync tag assignments: delete existing, insert selected
    await supabase.from("customer_tag_assignments").delete().eq("customer_id", customerId);
    if (selectedTagIds.length > 0) {
      await supabase.from("customer_tag_assignments").insert(
        selectedTagIds.map((tag_id) => ({ customer_id: customerId, tag_id }))
      );
    }

    onClose(tags);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="font-bold text-[#0F172A]">{editingCustomer ? "Edit Customer" : "Add Customer"}</h2>
          <button onClick={() => onClose()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto">
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

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Tags
              </label>
              <button
                type="button"
                onClick={() => setShowNewTag((v) => !v)}
                className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                New tag
              </button>
            </div>

            {showNewTag && (
              <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createTag())}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Color:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewTagColor(c)}
                        className="w-5 h-5 rounded-full border-2 transition"
                        style={{ backgroundColor: c, borderColor: newTagColor === c ? "#0F172A" : "transparent" }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTag(false)}
                    className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createTag}
                    disabled={creatingTag || !newTagName.trim()}
                    className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {creatingTag && <Loader2 className="w-3 h-3 animate-spin" />}
                    Create
                  </button>
                </div>
              </div>
            )}

            {tags.length === 0 && !showNewTag ? (
              <p className="text-xs text-slate-400">No tags yet — create one above to segment customers.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const selected = selectedTagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full border-2 transition"
                      style={
                        selected
                          ? { backgroundColor: t.color, borderColor: t.color, color: "#fff" }
                          : { borderColor: t.color + "60", color: t.color, backgroundColor: t.color + "15" }
                      }
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => onClose()} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">Cancel</button>
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
