"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, PackageIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Photo = { url: string; thumbUrl: string; title: string };

/**
 * Wischbare Bildreihe mit Scroll-Snap.
 * - Springen setzt scrollLeft direkt auf den Anfang des Zielbilds (keine Animation, Snap bleibt an).
 *   Snap aus- und wieder einschalten lässt Safari auf das vorige Bild zurückrasten.
 * - Scroll-Ereignisse zählen erst, wenn das Scrollen ~120 ms ruht, und nach einem Sprung
 *   400 ms gar nicht. So überschreiben Zwischenstände (Einrasten, Trägheit) die Auswahl nicht.
 */
function useSnapTrack(count: number, onIndex: (i: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const lockUntil = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(settle.current), []);

  const jump = useCallback((i: number) => {
    const el = ref.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (!el || !target) return;
    clearTimeout(settle.current);
    lockUntil.current = performance.now() + 400;
    el.scrollLeft = target.offsetLeft;
  }, []);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    clearTimeout(settle.current);
    const check = () => {
      const wait = lockUntil.current - performance.now();
      // Während der Sperre nach einem Sprung nicht übernehmen, aber danach nachholen
      if (wait > 0) return void (settle.current = setTimeout(check, wait + 20));
      const i = Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)));
      onIndex(i);
    };
    settle.current = setTimeout(check, 120);
  };

  return { ref, jump, onScroll };
}

export function Gallery({ photos, name }: { photos: Photo[]; name: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const { ref: mainRef, jump: mainJump, onScroll: mainScroll } = useSnapTrack(photos.length, setActive);
  const thumbsRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border bg-muted text-muted-foreground/60">
        <PackageIcon className="size-16" strokeWidth={1} />
      </div>
    );
  }

  const select = (i: number) => {
    setActive(i);
    mainJump(i);
  };

  return (
    <div className="min-w-0 space-y-3">
      <div className="relative">
        <div
          ref={mainRef}
          onScroll={mainScroll}
          className="relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => {
                setActive(i);
                setOpen(true);
              }}
              className="relative block w-full shrink-0 cursor-zoom-in snap-center"
              tabIndex={i === active ? 0 : -1}
              aria-label={`${p.title || name}, groß anzeigen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Bilder kommen über den eigenen Proxy */}
              <img
                src={p.url}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
                className="aspect-[4/3] w-full object-contain"
              />
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <span
            className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium tabular-nums shadow-xs"
            aria-live="polite"
          >
            {active + 1} / {photos.length}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <div
          ref={thumbsRef}
          role="group"
          aria-label="Bilder auswählen (Pfeiltasten)"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] md:mx-0 md:px-0"
          onKeyDown={(e) => {
            const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            const n = (active + d + photos.length) % photos.length;
            select(n);
            (thumbsRef.current?.children[n] as HTMLElement | undefined)?.focus();
          }}
        >
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => select(i)}
              tabIndex={i === active ? 0 : -1}
              aria-label={`Bild ${i + 1} von ${photos.length}`}
              aria-pressed={i === active}
              className={cn(
                "size-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-white transition",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt="" loading="lazy" draggable={false} className="pointer-events-none size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <Lightbox
          photos={photos}
          name={name}
          start={active}
          onClose={(i) => {
            setOpen(false);
            select(i);
            // Fokus zurück aufs Bild, das die Großansicht geöffnet hat
            requestAnimationFrame(() => (mainRef.current?.children[i] as HTMLElement | undefined)?.focus({ preventScroll: true }));
          }}
        />
      )}
    </div>
  );
}

/** Vollbild-Ansicht als natives <dialog>: Fokusfalle und Esc kommen vom Browser. */
function Lightbox({
  photos,
  name,
  start,
  onClose,
}: {
  photos: Photo[];
  name: string;
  start: number;
  onClose: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(start);
  const { ref: trackRef, jump, onScroll } = useSnapTrack(photos.length, setIndex);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    d.showModal();
    jump(start);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
    // nur beim Öffnen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (i: number) => {
    const n = (i + photos.length) % photos.length;
    setIndex(n);
    jump(n);
  };

  const current = photos[index];
  const many = photos.length > 1;

  return (
    <dialog
      ref={dialog}
      aria-label={`Bilder: ${name}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose(index);
      }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-neutral-950 p-0 text-white backdrop:bg-neutral-950"
    >
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <p className="min-w-0 truncate text-sm text-white/80">
            {many && <span className="mr-2 tabular-nums text-white">{index + 1} / {photos.length}</span>}
            {name}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Original in neuem Tab öffnen"
              title="Original öffnen"
            >
              <ExternalLinkIcon className="size-5" />
            </a>
            <button
              type="button"
              onClick={() => onClose(index)}
              className="flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Schließen"
              autoFocus
            >
              <XIcon className="size-6" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={onScroll}
          className="relative flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((p, i) => (
            <div
              key={p.url}
              className="flex h-full w-full shrink-0 snap-center items-center justify-center p-2 sm:p-6"
              onClick={(e) => {
                if (e.target === e.currentTarget) onClose(index);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Bilder kommen über den eigenen Proxy */}
              <img
                src={p.url}
                alt={p.title || name}
                loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
                draggable={false}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
          {many ? (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeftIcon className="size-7" />
            </button>
          ) : (
            <span className="size-12" />
          )}
          <button
            type="button"
            onClick={() => onClose(index)}
            className="h-12 rounded-full bg-white/10 px-6 text-sm font-medium text-white active:bg-white/20"
          >
            Schließen
          </button>
          {many ? (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
              aria-label="Nächstes Bild"
            >
              <ChevronRightIcon className="size-7" />
            </button>
          ) : (
            <span className="size-12" />
          )}
        </div>

        {many && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute top-1/2 left-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeftIcon className="size-7" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute top-1/2 right-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"
              aria-label="Nächstes Bild"
            >
              <ChevronRightIcon className="size-7" />
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
