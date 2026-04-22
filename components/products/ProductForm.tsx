"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, Upload } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Product name is required"),
  selling_price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  cost_price: z.coerce.number().min(0, "Cost cannot be negative").default(0),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  category_id: z.string().optional(),
  location_id: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  track_inventory: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Location {
  id: string;
  name: string;
}

interface Props {
  businessId: string;
  categories: Category[];
  locations: Location[];
  editingProduct: any | null;
  onClose: () => void;
  businessType?: "retail" | "service";
}

export function ProductForm({ businessId, categories, locations, editingProduct, onClose, businessType = "retail" }: Props) {
  const isService = businessType === "service";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(editingProduct?.image_url ?? null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingProduct
      ? {
          name: editingProduct.name,
          selling_price: editingProduct.selling_price,
          cost_price: editingProduct.cost_price,
          stock_quantity: editingProduct.stock_quantity,
          low_stock_threshold: editingProduct.low_stock_threshold,
          category_id: editingProduct.category_id ?? undefined,
          location_id: editingProduct.location_id ?? undefined,
          sku: editingProduct.sku ?? undefined,
          description: editingProduct.description ?? undefined,
          track_inventory: editingProduct.track_inventory,
        }
      : { track_inventory: true, cost_price: 0, stock_quantity: 0, low_stock_threshold: 5 },
  });

  const trackInventory = watch("track_inventory");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `products/${businessId}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });
    if (error) {
      setError("Image upload failed. Please try again.");
    } else if (data) {
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
    }
    setUploading(false);
  }

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      business_id: businessId,
      name: data.name,
      selling_price: data.selling_price,
      cost_price: data.cost_price,
      stock_quantity: data.stock_quantity,
      low_stock_threshold: data.low_stock_threshold,
      category_id: data.category_id || null,
      sku: data.sku || null,
      description: data.description || null,
      track_inventory: data.track_inventory,
      image_url: imageUrl,
    };
    // only include location_id once the DB column exists (after running the migration SQL)
    if (locations.length > 0) {
      payload.location_id = data.location_id || null;
    }

    if (editingProduct) {
      const { error: err } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from("products").insert(payload);
      if (err) { setError(err.message); return; }
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!editingProduct) return;
    const supabase = createClient();
    await supabase.from("products").update({ is_active: false }).eq("id", editingProduct.id);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-bold text-[#0F172A]">
            {editingProduct
              ? isService ? "Edit Service" : "Edit Product"
              : isService ? "Add Service" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              {isService ? "Service Image" : "Product Image"}
            </label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt="Product" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <label className="cursor-pointer text-sm text-green-500 hover:underline font-medium">
                {uploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">{isService ? "Service Name *" : "Product Name *"}</label>
            <input
              {...register("name")}
              placeholder={isService ? "e.g. Haircut, Full Body Massage" : "e.g. Samsung Galaxy A15"}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Category + SKU */}
          <div className={isService ? "" : "grid grid-cols-2 gap-3"}>
            <div className={isService ? "" : ""}>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Category</label>
              <select
                {...register("category_id")}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {!isService && (
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">SKU</label>
                <input
                  {...register("sku")}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
          </div>

          {/* Location — only for selling businesses */}
          {!isService && locations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Location / Branch</label>
              <select
                {...register("location_id")}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">No specific location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Prices */}
          {isService ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  Service Charge *
                  <span className="ml-1 text-xs font-normal text-slate-400">— what you charge the client</span>
                </label>
                <input
                  {...register("selling_price")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
                />
                {errors.selling_price && <p className="text-red-500 text-xs mt-1">{errors.selling_price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  Your Cost
                  <span className="ml-1 text-xs font-normal text-slate-400">— materials, supplies used (optional)</span>
                </label>
                <input
                  {...register("cost_price")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Selling Price *</label>
                <input
                  {...register("selling_price")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
                />
                {errors.selling_price && <p className="text-red-500 text-xs mt-1">{errors.selling_price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Cost Price</label>
                <input
                  {...register("cost_price")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
                />
              </div>
            </div>
          )}

          {/* Inventory — only for selling businesses */}
          {!isService && (
            <>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <input
                  {...register("track_inventory")}
                  type="checkbox"
                  id="track_inventory"
                  className="w-4 h-4 accent-green-500"
                />
                <label htmlFor="track_inventory" className="text-sm text-[#0F172A] font-medium cursor-pointer">
                  Track inventory / stock
                </label>
              </div>

              {trackInventory && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Stock Quantity</label>
                    <input
                      {...register("stock_quantity")}
                      type="number"
                      min="0"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Low Stock Alert</label>
                    <input
                      {...register("low_stock_threshold")}
                      type="number"
                      min="0"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Description</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder={isService ? "Optional service description" : "Optional product description"}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            {editingProduct && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-lg transition font-medium"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-green-300/40"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingProduct ? "Save changes" : isService ? "Add service" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
