"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, AlertCircle } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!videoRef.current) return;
      try {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              onScan(result.getText());
            }
          }
        );
        if (!cancelled) {
          controlsRef.current = controls;
          setStatus("scanning");
        } else {
          controls.stop();
        }
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(
            e?.message?.includes("Permission")
              ? "Camera permission denied. Allow camera access and try again."
              : "Could not start camera. Make sure no other app is using it."
          );
          setStatus("error");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-semibold text-sm">Scan Barcode</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Scanning reticle overlay */}
        {status === "scanning" && (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-64 h-40 relative">
              {/* Corner brackets */}
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400/80 animate-scan-line shadow-[0_0_8px_2px_rgba(74,222,128,0.6)]" />
            </div>
            <p className="text-white/80 text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
              Point camera at barcode
            </p>
          </div>
        )}

        {/* Starting state */}
        {status === "starting" && (
          <div className="z-10 flex flex-col items-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin text-green-400" />
            <p className="text-sm text-white/70">Starting camera…</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="z-10 flex flex-col items-center gap-4 px-8 text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-white font-semibold">Camera unavailable</p>
            <p className="text-white/60 text-sm">{errorMsg}</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white text-[#0F172A] rounded-xl text-sm font-semibold hover:bg-slate-100 transition"
            >
              Go back
            </button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {status === "scanning" && (
        <div className="px-4 py-3 bg-black/80 text-center flex-shrink-0">
          <p className="text-white/50 text-xs">Supports EAN, UPC, QR, Code 128, and more</p>
        </div>
      )}
    </div>
  );
}
