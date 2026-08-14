"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  thumbnail_url?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
}

interface DraftProduct {
  id: string;
  name: string;
  selling_price: number | string;
  cost_price: number | string;
  description: string;
  image_url: string;
  stock_quantity: number | string;
}

type Step = "connect" | "loading-posts" | "select" | "extracting" | "review" | "importing" | "done";

interface Props {
  slug: string;
  businessId: string;
  onClose: () => void;
  startConnected?: boolean;
}

// Instagram gradient used consistently
const igGradient = "from-purple-500 via-pink-500 to-orange-400";

export function ImportInstagramModal({ slug, businessId, onClose, startConnected = false }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<Step>(startConnected ? "loading-posts" : "connect");
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (startConnected) fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPosts() {
    setStep("loading-posts");
    setError(null);
    try {
      const res = await fetch("/api/instagram/posts");
      if (res.status === 401) {
        setStep("connect");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      const media: InstagramPost[] = (data.data ?? []).filter(
        (p: InstagramPost) => p.media_type === "IMAGE" || p.media_type === "CAROUSEL_ALBUM" || p.thumbnail_url
      );
      setPosts(media);
      setStep("select");
    } catch {
      setError("Failed to load posts. Please try reconnecting.");
      setStep("connect");
    }
  }

  function togglePost(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function extractSelected() {
    setStep("extracting");
    setError(null);
    const selectedPosts = posts.filter((p) => selected.has(p.id));
    try {
      const res = await fetch("/api/instagram/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: selectedPosts }),
      });
      if (!res.ok) throw new Error();
      const { results } = await res.json();

      const merged: DraftProduct[] = results.map(
        (r: { id: string; name: string; selling_price: number | null; description: string }) => {
          const original = selectedPosts.find((p) => p.id === r.id);
          return {
            id: r.id,
            name: r.name,
            selling_price: r.selling_price ?? "",
            cost_price: "",
            description: r.description,
            image_url: original?.media_type === "VIDEO"
              ? (original.thumbnail_url ?? "")
              : (original?.media_url ?? ""),
            stock_quantity: "",
          };
        }
      );
      setDrafts(merged);
      setStep("review");
    } catch {
      setError("AI extraction failed. Please try again.");
      setStep("select");
    }
  }

  function updateDraft(id: string, field: keyof DraftProduct, value: string | number) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  async function importProducts() {
    setStep("importing");
    let count = 0;
    for (const draft of drafts) {
      if (!draft.name.trim()) continue;
      const { error } = await supabase.from("products").insert({
        business_id: businessId,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        selling_price: Number(draft.selling_price) || 0,
        cost_price: Number(draft.cost_price) || 0,
        stock_quantity: Number(draft.stock_quantity) || 0,
        image_url: draft.image_url || null,
        track_inventory: true,
        low_stock_threshold: 5,
        min_order_qty: 1,
        is_active: true,
      });
      if (!error) count++;
    }
    setImportedCount(count);
    setStep("done");
    router.refresh();
  }

  const validDrafts = drafts.filter((d) => d.name.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${igGradient} flex items-center justify-center`}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[#0F172A]">Import from Instagram</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Connect */}
          {step === "connect" && (
            <div className="flex flex-col items-center justify-center px-8 py-10 gap-5 text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${igGradient} flex items-center justify-center shadow-lg`}>
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A] mb-1.5">Connect your Instagram</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Log in with your Instagram Business or Creator account. Claude AI will read your post captions and images to extract product names, descriptions, and prices.
                </p>
              </div>
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl w-full text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              <a
                href={`/api/instagram/auth?slug=${slug}`}
                className={`flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r ${igGradient} text-white font-semibold rounded-xl text-sm hover:opacity-90 transition shadow-md`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Connect Instagram
              </a>
              <p className="text-xs text-slate-400">Requires an Instagram Business or Creator account</p>
            </div>
          )}

          {/* Loading */}
          {(step === "loading-posts" || step === "extracting" || step === "importing") && (
            <div className="flex flex-col items-center justify-center px-8 py-14 gap-4 text-center">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
                {step === "extracting" && (
                  <Sparkles className="w-4 h-4 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {step === "loading-posts" && "Loading your posts..."}
                  {step === "extracting" && "Claude AI is reading your captions..."}
                  {step === "importing" && "Saving products..."}
                </p>
                {step === "extracting" && (
                  <p className="text-xs text-slate-400 mt-1">Extracting names, descriptions, and prices</p>
                )}
              </div>
            </div>
          )}

          {/* Select posts */}
          {step === "select" && (
            <div className="p-4">
              {error && (
                <div className="mb-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              <p className="text-xs text-slate-400 mb-3 font-medium">
                {posts.length} posts found · tap to select
              </p>
              {posts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No eligible posts found</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {posts.map((post) => {
                    const imgSrc = post.media_type === "VIDEO" ? post.thumbnail_url! : post.media_url;
                    const isSelected = selected.has(post.id);
                    return (
                      <button
                        key={post.id}
                        onClick={() => togglePost(post.id)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          isSelected
                            ? "border-pink-500 ring-2 ring-pink-200 scale-[0.97]"
                            : "border-transparent hover:border-slate-200"
                        }`}
                      >
                        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-pink-500/20 flex items-start justify-end p-1.5">
                            <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        )}
                        {post.caption && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                            <p className="text-white text-[9px] leading-tight line-clamp-2">{post.caption}</p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Review extracted products */}
          {step === "review" && (
            <div className="p-4 space-y-3">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              <p className="text-xs text-slate-400 font-medium">
                Review and edit before importing — Claude has pre-filled what it found
              </p>
              {drafts.map((draft) => (
                <div key={draft.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex gap-3">
                    {draft.image_url && (
                      <img
                        src={draft.image_url}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        value={draft.name}
                        onChange={(e) => updateDraft(draft.id, "name", e.target.value)}
                        placeholder="Product name *"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <textarea
                        value={draft.description}
                        onChange={(e) => updateDraft(draft.id, "description", e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block mb-0.5">Selling Price</label>
                      <input
                        type="number"
                        value={draft.selling_price}
                        onChange={(e) => updateDraft(draft.id, "selling_price", e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block mb-0.5">Cost Price</label>
                      <input
                        type="number"
                        value={draft.cost_price}
                        onChange={(e) => updateDraft(draft.id, "cost_price", e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide block mb-0.5">Stock Qty</label>
                      <input
                        type="number"
                        value={draft.stock_quantity}
                        onChange={(e) => updateDraft(draft.id, "stock_quantity", e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeDraft(draft.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 transition font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center px-8 py-14 gap-5 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Products imported!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {importedCount} product{importedCount !== 1 ? "s" : ""} added to your catalog
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(step === "select" || step === "review") && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => (step === "review" ? setStep("select") : setStep("connect"))}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
            >
              Back
            </button>

            {step === "select" && (
              <button
                onClick={extractSelected}
                disabled={selected.size === 0}
                className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${igGradient} text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 shadow`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Extract with AI
                <span className="bg-white/25 text-white rounded-full px-1.5 py-px text-xs font-bold">
                  {selected.size}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === "review" && (
              <button
                onClick={importProducts}
                disabled={validDrafts.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-40"
              >
                Import {validDrafts.length} Product{validDrafts.length !== 1 ? "s" : ""}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
