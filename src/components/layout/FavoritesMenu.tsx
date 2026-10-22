import React, { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { favoritesFor, saveFavorites } from '../../data/favoritesStore';

interface FavoritesMenuProps {
  currentTab: string;
  tabs: { id: string; label: string }[];
  onSelectTab: (tab: string) => void;
}

export const FavoritesMenu: React.FC<FavoritesMenuProps> = ({
  currentTab,
  tabs,
  onSelectTab,
}) => {
  const { user } = useAuth();
  const username = user?.username || '';
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIds(username ? favoritesFor(username) : []);
  }, [username]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const allowed = new Set(tabs.map((tab) => tab.id));
  const pinned = tabs.filter((tab) => ids.includes(tab.id));
  const current = tabs.find((tab) => tab.id === currentTab);
  const currentPinned = Boolean(current && ids.includes(current.id));

  const write = (next: string[]) => {
    const kept = next.filter((id) => allowed.has(id));
    setIds(kept);
    if (username) saveFavorites(username, kept);
  };

  const toggleCurrent = () => {
    if (!current) return;
    write(currentPinned ? ids.filter((id) => id !== current.id) : [...ids, current.id]);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`p-1.5 rounded cursor-pointer ${open || currentPinned ? 'bg-amber-50 text-amber-500' : 'hover:bg-slate-100 text-slate-500'}`}
        title="Favorites"
        aria-expanded={open}
        aria-label="Favorites"
      >
        <Star className="w-4 h-4" fill={currentPinned ? 'currentColor' : 'none'} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#d8dde6] rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Favorites
          </div>
          {current ? (
            <button
              type="button"
              onClick={toggleCurrent}
              className="w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm text-slate-800 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
            >
              <Star className={`w-3.5 h-3.5 ${currentPinned ? 'text-amber-500' : 'text-slate-400'}`} fill={currentPinned ? 'currentColor' : 'none'} />
              <span>{currentPinned ? `Remove ${current.label}` : `Pin ${current.label}`}</span>
            </button>
          ) : (
            <div className="px-3 py-2.5 text-xs text-slate-500 border-b border-slate-100">
              This screen cannot be pinned.
            </div>
          )}
          {pinned.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-500">
              No favorites yet. Pin the screen you are on.
            </div>
          ) : (
            <div className="py-1">
              {pinned.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(tab.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${
                    tab.id === currentTab ? 'text-[#0176d3] font-semibold' : 'text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
