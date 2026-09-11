import { useEffect, useMemo, useRef, useState } from 'react';
import { useTreeContext } from '../context/TreeContext';
import { CARD_HEIGHT, CARD_WIDTH } from '../utils/constants';

const getPersonLabel = (person) => person.nickname || person.name || 'Tanpa Nama';

const Icon = ({ children, className = 'h-4 w-4', ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

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
    setIsEditDrawerOpen,
    logout,
    filteredPeopleList,
    setIsExportModalOpen,
    setIsStatsModalOpen,
    isMemberIndexOpen,
    setIsMemberIndexOpen,
  } = ctx;

  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const memberIndexRef = useRef(null);
  const memberSearchRef = useRef(null);
  const totalFamilyMembers = Object.keys(people || {}).length;

  const memberGroups = useMemo(() => {
    const source = searchQuery.trim() ? filteredPeopleList : Object.values(people || {});
    return source
      .slice()
      .sort((a, b) => {
        const nameCompare = getPersonLabel(a).localeCompare(getPersonLabel(b), 'id', {
          sensitivity: 'base',
        });
        return nameCompare || String(a.id).localeCompare(String(b.id));
      })
      .reduce((groups, person) => {
        const initial = getPersonLabel(person).charAt(0).toUpperCase() || '#';
        if (!groups[initial]) groups[initial] = [];
        groups[initial].push(person);
        return groups;
      }, {});
  }, [filteredPeopleList, people, searchQuery]);

  useEffect(() => {
    if (!isMemberIndexOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!memberIndexRef.current?.contains(event.target)) {
        setIsMemberIndexOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMemberIndexOpen(false);
        setIsViewMenuOpen(false);
        setIsDataMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    memberSearchRef.current?.focus();

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMemberIndexOpen, setIsMemberIndexOpen]);

  useEffect(() => {
    if (!isViewMenuOpen && !isDataMenuOpen && !isMobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsViewMenuOpen(false);
        setIsDataMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDataMenuOpen, isMobileMenuOpen, isViewMenuOpen]);

  const selectMember = (person) => {
    setSelectedId(person.id);
    setIsEditDrawerOpen(false);
    setTransform((previous) => ({
      ...previous,
      x: window.innerWidth / 2 - (person.x + CARD_WIDTH / 2) * previous.scale,
      y:
        (window.innerHeight - 64) / 2 -
        (person.y + CARD_HEIGHT / 2) * previous.scale,
    }));
    setSearchQuery('');
    setIsMemberIndexOpen(false);
    setIsMobileMenuOpen(false);
  };

  const openMemberIndex = () => {
    setIsMemberIndexOpen(true);
    setIsViewMenuOpen(false);
    setIsDataMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const openStatistics = () => {
    setIsStatsModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const openExportImport = () => {
    setIsExportModalOpen(true);
    setIsDataMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const openReset = () => {
    setIsResetConfirmOpen(true);
    setIsDataMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="app-header relative z-50 flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-4 shadow-[0_1px_8px_rgba(15,23,42,0.05)] sm:px-6">
      <div className="app-brand flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm shadow-indigo-500/20">
          🌳
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold tracking-wide text-slate-800">
              Garis Keturunan
            </h1>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                isAdmin
                  ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                  : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {isAdmin ? 'Admin' : 'Tamu'}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {totalFamilyMembers} anggota
            </span>
            <p className="truncate text-[10px] text-slate-500">
              Pohon keluarga · 5 generasi terlihat
            </p>
          </div>
        </div>
      </div>

      <div className="header-desktop-actions ml-auto items-center gap-2">
        <button
          type="button"
          onClick={openMemberIndex}
          aria-expanded={isMemberIndexOpen}
          aria-controls="member-index-panel"
          className="header-action-button"
        >
          <Icon>
            <path d="M4 5h10M4 12h7M4 19h10" />
            <circle cx="18" cy="12" r="3" />
            <path d="M18 9v-2M18 17v2M15 12h-2M21 12h-2" />
          </Icon>
          <span>Daftar anggota</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsViewMenuOpen((open) => !open);
              setIsDataMenuOpen(false);
            }}
            aria-expanded={isViewMenuOpen}
            className="header-action-button"
          >
            <Icon>
              <path d="M4 12h16M14 6l6 6-6 6" />
            </Icon>
            <span>Tampilan</span>
            <Icon className="h-3.5 w-3.5" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </Icon>
          </button>
          {isViewMenuOpen && (
            <div className="header-menu right-0 w-56" role="menu">
              <p className="header-menu-label">Arah silsilah</p>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={layoutDirection === 'horizontal'}
                onClick={() => {
                  if (layoutDirection !== 'horizontal') toggleLayoutDirection();
                  setIsViewMenuOpen(false);
                }}
                className="header-menu-item"
              >
                <span>Horizontal</span>
                {layoutDirection === 'horizontal' && <span className="text-indigo-600">✓</span>}
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={layoutDirection === 'vertical'}
                onClick={() => {
                  if (layoutDirection !== 'vertical') toggleLayoutDirection();
                  setIsViewMenuOpen(false);
                }}
                className="header-menu-item"
              >
                <span>Vertikal</span>
                {layoutDirection === 'vertical' && <span className="text-indigo-600">✓</span>}
              </button>
            </div>
          )}
        </div>

        <button type="button" onClick={openStatistics} className="header-action-button">
          <Icon>
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 16 3-4 3 2 4-6" />
          </Icon>
          <span>Statistik</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsDataMenuOpen((open) => !open);
              setIsViewMenuOpen(false);
            }}
            aria-expanded={isDataMenuOpen}
            className="header-action-button"
          >
            <Icon>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </Icon>
            <span>Data keluarga</span>
            <Icon className="h-3.5 w-3.5" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </Icon>
          </button>
          {isDataMenuOpen && (
            <div className="header-menu right-0 w-60" role="menu">
              {isAdmin ? (
                <>
                  <button type="button" role="menuitem" onClick={openExportImport} className="header-menu-item">
                    <span>Export / Import pohon</span>
                    <span className="text-slate-400">↗</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button type="button" role="menuitem" onClick={openReset} className="header-menu-item text-rose-700 hover:bg-rose-50">
                    <span>Reset pohon</span>
                    <span className="text-rose-400">!</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsDataMenuOpen(false);
                  }}
                  className="header-menu-item"
                >
                  <span>Masuk sebagai admin</span>
                  <span className="text-slate-400">→</span>
                </button>
              )}
            </div>
          )}
        </div>

        {isAdmin ? (
          <button type="button" onClick={logout} className="header-account-button" title="Keluar" aria-label="Keluar">
            <Icon>
              <path d="M9 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </Icon>
          </button>
        ) : (
          <button type="button" onClick={() => setIsLoginModalOpen(true)} className="header-account-button" title="Login Admin" aria-label="Login Admin">
            <Icon>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5M15 12H3" />
            </Icon>
          </button>
        )}
      </div>

      <div className="header-mobile-actions ml-auto items-center gap-2">
        <button
          type="button"
          onClick={openMemberIndex}
          aria-expanded={isMemberIndexOpen}
          aria-controls="member-index-panel"
          className="header-mobile-icon-button"
          title="Daftar anggota"
          aria-label="Daftar anggota"
        >
          <Icon>
            <path d="M4 5h10M4 12h7M4 19h10" />
            <circle cx="18" cy="12" r="3" />
            <path d="M18 9v-2M18 17v2M15 12h-2M21 12h-2" />
          </Icon>
        </button>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-expanded={isMobileMenuOpen}
          aria-label="Buka menu utama"
          className="header-mobile-icon-button"
        >
          <Icon>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </Icon>
        </button>
        {isMobileMenuOpen && (
          <div className="header-menu header-mobile-menu right-2 top-[3.75rem] w-[min(18rem,calc(100vw-1rem))]" role="menu">
            <button type="button" role="menuitem" onClick={() => { toggleLayoutDirection(); setIsMobileMenuOpen(false); }} className="header-menu-item">
              <span>Tampilan · {layoutDirection === 'horizontal' ? 'Horizontal' : 'Vertikal'}</span>
              <span className="text-slate-400">↔</span>
            </button>
            <button type="button" role="menuitem" onClick={openStatistics} className="header-menu-item">
              <span>Statistik</span>
              <span className="text-slate-400">↗</span>
            </button>
            <div className="my-1 border-t border-slate-100" />
            {isAdmin ? (
              <>
                <button type="button" role="menuitem" onClick={openExportImport} className="header-menu-item">
                  <span>Export / Import pohon</span>
                  <span className="text-slate-400">↗</span>
                </button>
                <button type="button" role="menuitem" onClick={openReset} className="header-menu-item text-rose-700 hover:bg-rose-50">
                  <span>Reset pohon</span>
                  <span className="text-rose-400">!</span>
                </button>
                <button type="button" role="menuitem" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="header-menu-item">
                  <span>Keluar</span>
                  <span className="text-slate-400">→</span>
                </button>
              </>
            ) : (
              <button type="button" role="menuitem" onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="header-menu-item">
                <span>Login Admin</span>
                <span className="text-slate-400">→</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isMemberIndexOpen && (
        <>
          <button
            type="button"
            aria-label="Tutup daftar anggota"
            className="member-index-scrim"
            onClick={() => setIsMemberIndexOpen(false)}
          />
          <section
            id="member-index-panel"
            ref={memberIndexRef}
            className="member-index-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-index-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="section-eyebrow">Arsip keluarga</p>
                <h2 id="member-index-title" className="mt-1 text-base font-bold text-slate-800">
                  Daftar anggota
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                  {totalFamilyMembers} orang
                </span>
                <button
                  type="button"
                  onClick={() => setIsMemberIndexOpen(false)}
                  className="icon-button"
                  aria-label="Tutup daftar anggota"
                >
                  <Icon className="h-4 w-4">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </Icon>
                </button>
              </div>
            </div>
            <div className="border-b border-slate-100 px-5 py-3">
              <label className="relative block">
                <span className="sr-only">Cari anggota keluarga</span>
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </Icon>
                <input
                  ref={memberSearchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari anggota keluarga..."
                  className="member-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Hapus pencarian"
                  >
                    <Icon className="h-4 w-4">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </Icon>
                  </button>
                )}
              </label>
            </div>
            <div className="member-index-list">
              {Object.keys(memberGroups).length > 0 ? (
                Object.entries(memberGroups).map(([initial, members]) => (
                  <div key={initial}>
                    <p className="member-index-letter">{initial}</p>
                    <div className="space-y-1">
                      {members.map((person) => {
                        const personName = getPersonLabel(person);
                        const isSelected = person.id === ctx.selectedId;
                        return (
                          <button
                            type="button"
                            key={person.id}
                            onClick={() => selectMember(person)}
                            className={`member-index-row ${isSelected ? 'member-index-row-selected' : ''}`}
                          >
                            <span className={`member-index-avatar ${person.gender === 'male' ? 'member-index-avatar-male' : 'member-index-avatar-female'}`}>
                              {personName.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-xs font-semibold text-slate-800">{personName}</span>
                              <span className="block truncate text-[10px] text-slate-500">
                                {person.nickname && person.name && person.nickname !== person.name ? person.name : person.isDeceased ? 'Anggota keluarga · Wafat' : 'Anggota keluarga'}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">{person.gender === 'male' ? 'Pria' : 'Wanita'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                  <span className="text-2xl">⌕</span>
                  <p className="mt-2 text-xs font-semibold text-slate-600">Anggota tidak ditemukan</p>
                  <p className="mt-1 text-[11px] text-slate-400">Coba gunakan nama panggilan atau nama lengkap.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </header>
  );
};

export default HeaderBar;
