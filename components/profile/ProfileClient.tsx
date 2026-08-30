"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  slug: string;
  profile: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  userId: string;
}

function Field({
  label, value, onChange, type = "text", readOnly, onAction, actionLabel,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  readOnly?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className="relative h-10 border border-slate-300 focus-within:border-slate-300 rounded-[4px] px-4 outline-none">
      {/* Label sits on the border when filled/focused, centered inside when empty */}
      <span
        className={`absolute pointer-events-none transition-none ${
          active
            ? "-top-[9px] left-3 bg-white px-1 text-[11px] text-slate-400"
            : "top-1/2 -translate-y-1/2 left-4 text-[13px] text-slate-400"
        }`}
      >
        {label}
      </span>

      {readOnly ? (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex items-center justify-between">
          <p className="text-[13px] text-slate-500 truncate leading-none flex-1">{value}</p>
          {actionLabel && onAction && (
            <button onClick={onAction} className="text-[13px] text-[#1a9c38] font-semibold ml-2 flex-shrink-0">
              {actionLabel}
            </button>
          )}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ outline: "none", boxShadow: "none" }}
          className="absolute top-1/2 -translate-y-1/2 left-4 right-4 w-[calc(100%-2rem)] text-[13px] text-slate-900 bg-transparent leading-none"
        />
      )}
    </div>
  );
}

export function ProfileClient({ slug, profile, userId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const nameParts = profile.full_name.trim().split(" ");
  const [firstName, setFirstName]   = useState(nameParts[0] ?? "");
  const [middleName, setMiddleName] = useState(nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "");
  const [surname, setSurname]       = useState(nameParts.length > 1 ? nameParts[nameParts.length - 1] : "");
  const [dob, setDob]               = useState("");
  const [phone, setPhone]           = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl]   = useState(profile.avatar_url ?? "");
  const [saving, setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploadingPhoto(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploadingPhoto(false);
  }

  async function handleSave() {
    const full_name = [firstName.trim(), middleName.trim(), surname.trim()].filter(Boolean).join(" ");
    if (!full_name) { setError("First name is required."); return; }
    setSaving(true);
    setError(null);
    setSuccess(false);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name, phone: phone || null, avatar_url: avatarUrl || null })
      .eq("id", userId);
    setSaving(false);
    if (updateError) { setError("Failed to save. Try again."); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/delete-account", { method: "DELETE" });
    if (!res.ok) { setDeleting(false); setShowDeleteConfirm(false); return; }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleEmailChange() {
    if (!newEmail.includes("@")) { setEmailError("Enter a valid email."); return; }
    setEmailError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) { setEmailError(error.message); return; }
    setEmailSent(true);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">

      {/* Delete account confirmation sheet */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-end" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full bg-white rounded-t-2xl px-5 pt-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-slate-900 mb-2">Delete Account</h3>
            <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-bold rounded-[4px] text-[15px] transition flex items-center justify-center disabled:opacity-60 mb-3"
            >
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full h-11 border border-slate-200 text-slate-700 font-semibold rounded-[4px] text-[15px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Email change bottom sheet */}
      {showEmailChange && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end" onClick={() => { setShowEmailChange(false); setEmailSent(false); setNewEmail(""); setEmailError(null); }}>
          <div className="w-full bg-white rounded-t-2xl px-5 pt-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-slate-900 mb-1">Change Email</h3>
            {emailSent ? (
              <div className="py-6 text-center">
                <p className="text-[14px] text-slate-700 mb-1">Confirmation sent!</p>
                <p className="text-[13px] text-slate-400">Check <span className="font-semibold">{newEmail}</span> to confirm the change.</p>
                <button onClick={() => { setShowEmailChange(false); setEmailSent(false); setNewEmail(""); }} className="mt-5 w-full h-11 bg-[#1a9c38] text-white font-bold rounded-[4px] text-[15px]">Done</button>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-slate-400 mb-4">Enter your new email address.</p>
                <div className="relative h-10 border border-slate-300 rounded-[4px] px-4 mb-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    style={{ outline: "none", boxShadow: "none" }}
                    className="absolute top-1/2 -translate-y-1/2 left-4 right-4 w-[calc(100%-2rem)] text-[13px] text-slate-900 bg-transparent leading-none"
                  />
                </div>
                {emailError && <p className="text-[12px] text-red-500 mb-2">{emailError}</p>}
                <button onClick={handleEmailChange} className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] transition flex items-center justify-center">
                  Send confirmation
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4 bg-[#fafefb]">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-[#1a9c38] text-[14px] font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-[16px] font-bold text-slate-900">Profile</h1>
        <button onClick={() => setShowDeleteConfirm(true)} className="text-[14px] font-semibold text-red-500">
          Delete
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-[22px]">
        {/* Avatar */}
        <div className="flex justify-start mb-1">
          <div className="relative w-24 h-24">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <Camera className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#1a9c38] flex items-center justify-center border-2 border-white"
            >
              <span className="text-white text-[18px] leading-none">+</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>

        <Field label="First Name"    value={firstName}    onChange={setFirstName} />
        <Field label="Middle Name"   value={middleName}   onChange={setMiddleName} />
        <Field label="Surname"       value={surname}      onChange={setSurname} />
        <Field label="Date of Birth" value={dob}          onChange={setDob} type="date" />
        <Field label="Email Address" value={profile.email} readOnly actionLabel="Change" onAction={() => setShowEmailChange(true)} />
        <Field label="Phone Number"  value={phone}        onChange={setPhone} type="tel" />

        {error   && <p className="text-[13px] text-red-500">{error}</p>}
        {success && <p className="text-[13px] text-[#1a9c38] font-medium">Profile saved!</p>}
      </div>

      <div className="px-4 pt-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] transition flex items-center justify-center disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
