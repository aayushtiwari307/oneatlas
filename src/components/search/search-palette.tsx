"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  Command,
  CornerDownLeft,
  LoaderCircle,
  Network,
  Search,
  X,
} from "lucide-react";
import { flattenSearchResults, moveSearchSelection, type SearchPaletteResult } from "@/features/search/search-navigation";
import type { SearchDTO } from "@/types/api";

type SearchEnvelope = {
  data?: SearchDTO;
  error?: { message?: string };
};

async function fetchGlobalSearch(query: string, signal: AbortSignal): Promise<SearchDTO> {
  const params = new URLSearchParams({ q: query, limit: "5" });
  const response = await fetch(`/api/search?${params.toString()}`, { signal });
  const payload = (await response.json()) as SearchEnvelope;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "Search is temporarily unavailable.");
  }

  return payload.data;
}

function ResultIcon({ kind }: { kind: SearchPaletteResult["kind"] }) {
  if (kind === "lab") return <Building2 size={15} />;
  if (kind === "provider") return <Network size={15} />;
  return <Search size={15} />;
}

function ResultGroup({
  title,
  items,
  activeIndex,
  startIndex,
  onChoose,
}: {
  title: string;
  items: SearchPaletteResult[];
  activeIndex: number;
  startIndex: number;
  onChoose: (item: SearchPaletteResult) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div role="group" aria-label={title} className="px-2 pb-2">
      <h3 className="px-3 pb-2 pt-3 text-[9px] font-bold uppercase tracking-[.16em] text-slate-600">{title}</h3>
      <div className="space-y-1">
        {items.map((item, index) => {
          const resultIndex = startIndex + index;
          const selected = resultIndex === activeIndex;
          const resultId = `global-search-${item.kind}-${item.slug}`;
          return (
            <button
              key={`${item.kind}:${item.slug}`}
              type="button"
              id={resultId}
              role="option"
              aria-selected={selected}
              tabIndex={-1}
              onClick={() => onChoose(item)}
              className={`flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${selected ? "bg-cyan-300/[0.11] text-white" : "text-slate-300 hover:bg-white/[0.04]"}`}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${selected ? "border-cyan-200/25 bg-cyan-300/[0.1] text-cyan-100" : "border-white/[0.07] bg-white/[0.025] text-slate-500"}`}>
                <ResultIcon kind={item.kind} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{item.name}</span>
                <span className="mt-0.5 block truncate text-[10px] text-slate-500">{item.description}</span>
              </span>
              <ArrowUpRight size={13} className="shrink-0 text-slate-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SearchPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const openPalette = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setIsOpen(false);
    setSearchText("");
    setDebouncedText("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [openPalette]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedText(searchText.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const searchQuery = useQuery({
    queryKey: ["global-search", debouncedText],
    queryFn: ({ signal }) => fetchGlobalSearch(debouncedText, signal),
    enabled: isOpen && searchText.trim() === debouncedText && debouncedText.length >= 2,
    staleTime: 30_000,
  });

  const results = useMemo(() => flattenSearchResults(searchQuery.data), [searchQuery.data]);
  const models = results.filter((result) => result.kind === "model");
  const labs = results.filter((result) => result.kind === "lab");
  const providers = results.filter((result) => result.kind === "provider");
  const activeResult = activeIndex >= 0 ? results[activeIndex] : undefined;

  const chooseResult = useCallback((result: SearchPaletteResult) => {
    closePalette();
    router.push(result.href);
  }, [closePalette, router]);

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => moveSearchSelection(current, 1, results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => moveSearchSelection(current, -1, results.length));
    } else if (event.key === "Enter" && activeResult) {
      event.preventDefault();
      chooseResult(activeResult);
    }
  };

  return (
    <>
      <button
        type="button"
        className="header-search"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open global search"
      >
        <Search size={15} />
        <span className="hidden sm:inline">Search OneAtlas</span>
        <span className="hidden items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 sm:flex">
          <Command size={10} /> K
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-label="Global search"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePalette();
        }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0d1524] shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
            <Search size={17} className="shrink-0 text-cyan-200" />
            <input
              ref={inputRef}
              type="search"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search models, labs and providers..."
              aria-label="Search models, labs and providers"
              aria-controls="global-search-results"
              aria-activedescendant={activeResult ? `global-search-${activeResult.kind}-${activeResult.slug}` : undefined}
              autoComplete="off"
              spellCheck={false}
              className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
            <button type="button" onClick={closePalette} className="control-button !min-h-8 !px-2" aria-label="Close search">
              <X size={14} />
            </button>
          </div>

          <div id="global-search-results" role="listbox" aria-label="Search results" aria-live="polite" className="max-h-[min(62vh,520px)] overflow-y-auto py-2">
            {searchText.trim().length < 2 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500">Type at least two characters to search the catalogue.</p>
            ) : searchText.trim() !== debouncedText || searchQuery.isFetching ? (
              <div className="flex items-center justify-center gap-2 px-6 py-10 text-xs text-slate-500" role="status">
                <LoaderCircle size={14} className="animate-spin text-cyan-200" /> Searching the catalogue...
              </div>
            ) : searchQuery.isError ? (
              <div className="px-6 py-10 text-center" role="alert">
                <p className="text-xs text-amber-200">{searchQuery.error.message}</p>
                <button type="button" onClick={() => void searchQuery.refetch()} className="control-button mt-4">Try again</button>
              </div>
            ) : results.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500">No matching models, labs or providers.</p>
            ) : (
              <>
                <ResultGroup title="Models" items={models} activeIndex={activeIndex} startIndex={0} onChoose={chooseResult} />
                <ResultGroup title="Labs" items={labs} activeIndex={activeIndex} startIndex={models.length} onChoose={chooseResult} />
                <ResultGroup title="Providers" items={providers} activeIndex={activeIndex} startIndex={models.length + labs.length} onChoose={chooseResult} />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] px-4 py-3 text-[9px] text-slate-600">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><kbd className="search-key">↑</kbd><kbd className="search-key">↓</kbd> Navigate</span>
              <span className="inline-flex items-center gap-1"><kbd className="search-key"><CornerDownLeft size={9} /></kbd> Open</span>
            </div>
            <span>ESC to close</span>
          </div>
        </div>
      </dialog>
    </>
  );
}
