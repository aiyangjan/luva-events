"use client";

import { useRef, useState } from "react";
import { imageUrl } from "@/lib/image";
import { useLocale } from "./LocaleProvider";

const COVER_PRESETS = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=960&q=70",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=960&q=70",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=960&q=70",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=960&q=70",
];

export function CoverUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { t, te } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err) {
      setError(te(err instanceof Error ? err.message : "Upload failed", "create.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function onPick(files: FileList | null) {
    const file = files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <aside className="create-preview">
      <p className="section-label">{t("create.cover")}</p>
      <div className="create-preview__cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(value, 640)} alt="" decoding="async" />
        ) : (
          <div className="cover-placeholder" />
        )}
      </div>

      <div
        className={`upload-drop${dragOver ? " is-over" : ""}${uploading ? " is-busy" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onPick(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <strong>{uploading ? t("create.uploading") : t("create.drop")}</strong>
        <span>{t("create.dropHint")}</span>
        <button
          type="button"
          className="mini-btn"
          disabled={uploading}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          {t("create.upload")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            onPick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error ? <div className="toast toast--err">{error}</div> : null}

      <p className="section-label" style={{ marginTop: 16 }}>
        {t("create.presets")}
      </p>
      <div className="cover-presets">
        {COVER_PRESETS.map((url) => (
          <button
            key={url}
            type="button"
            className={`cover-presets__btn${value === url ? " is-active" : ""}`}
            onClick={() => onChange(url)}
            aria-label={t("create.cover")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(url, 160)} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      <label className="tiny-label">
        {t("create.orUrl")}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("create.urlPh")}
        />
      </label>
    </aside>
  );
}
