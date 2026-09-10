import React from 'react';
import { useTreeContext } from '../context/TreeContext';

const HeaderBar = () => {
  const ctx = useTreeContext();
  const {
    isAdmin,
    layoutDirection,
    searchQuery,
    people,
    toggleLayoutDirection,
    setIsResetConfirmOpen,
    setSearchQuery,
    setSelectedId,
    setTransform,
    setIsLoginModalOpen,
    logout,
    filteredPeopleList,
    setIsExportModalOpen,
    setIsStatsModalOpen,
  } = ctx;

  const totalFamilyMembers = Object.keys(people || {}).length;

  return (
    <header className="app-header h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
      <div className="app-brand flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
          🌳
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-800 tracking-wide">
              Garis Keturunan
            </h1>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isAdmin
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
               {isAdmin ? 'Admin' : 'Tamu'}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {totalFamilyMembers} anggota
            </span>
            <p className="text-[10px] text-slate-500">
              Diagram silsilah satu garis
            </p>
          </div>
        </div>
      </div>

      <div className="app-actions flex items-center gap-3">
        <div className="app-search relative w-56">
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Cari anggota keluarga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
              {filteredPeopleList.length > 0 ? (
                filteredPeopleList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setTransform((prev) => ({
                        ...prev,
                        x: -p.x * prev.scale + window.innerWidth / 3,
                        y: -p.y * prev.scale + window.innerHeight / 3,
                      }));
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-xs border-b border-slate-100 last:border-0"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-slate-800 truncate">
                        {p.nickname || p.name || 'Tanpa Nama'}
                      </span>
                      {p.nickname && p.name && p.nickname !== p.name && (
                        <span className="text-[10px] text-slate-500 truncate">
                          {p.name}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {p.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-xs text-slate-400 text-center">
                  Anggota tidak ditemukan
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleLayoutDirection}
          title="Ganti Arah Silsilah (Horizontal / Vertikal)"
          className="flex items-center justify-center w-9 h-9 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs text-indigo-700 font-semibold transition shadow-sm"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {layoutDirection === 'horizontal' ? (
              <path d="M4 12h16M14 6l6 6-6 6" />
            ) : (
              <path d="M12 4v16M6 14l6 6 6-6" />
            )}
          </svg>
        </button>

        <button
          onClick={() => setIsStatsModalOpen(true)}
          title="Lihat statistik keluarga"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition hover:bg-emerald-100"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 16 3-4 3 2 4-6" />
          </svg>
        </button>

        {isAdmin ? (
          <button
            onClick={logout}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs transition w-9 h-9 flex items-center justify-center"
            title="Keluar"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center justify-center w-9 h-9"
            title="Login Admin"
          >
            🔑
          </button>
        )}

        {isAdmin ? (
          <button
            onClick={() => setIsExportModalOpen(true)}
            title="Export / Import Pohon"
            className="export-import-button px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="m7 8 5-5 5 5" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
            </svg>
            <span className="export-import-label">Export / Import</span>
          </button>
        ) : null}

        {isAdmin && (
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            title="Reset pohon ke data awal"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition"
          >
            Reset
          </button>
        )}
      </div>
    </header>
  );
};

export default HeaderBar;
