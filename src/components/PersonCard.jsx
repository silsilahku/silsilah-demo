import { useState } from 'react';
import { useTreeContext } from '../context/TreeContext';

const getAgeLabel = (person) => {
  const currentYear = new Date().getFullYear();
  const birth = parseInt(person.birthYear, 10);

  if (!Number.isNaN(birth)) {
    if (person.isDeceased) {
      const death = parseInt(person.deathYear, 10);
      return !Number.isNaN(death) && death - birth >= 0
        ? `${death - birth} thn · wafat`
        : 'Wafat';
    }

    const age = currentYear - birth;
    return age >= 0 ? `${age} thn` : '';
  }

  return person.isDeceased ? 'Wafat' : '';
};

const PersonAvatar = ({ person, displayName, isMale }) => {
  const [hasPhotoError, setHasPhotoError] = useState(false);
  const hasPhoto = Boolean(person.photo) && !hasPhotoError;

  if (hasPhoto) {
    return (
      <img
        src={person.photo}
        alt={displayName}
        className="card-avatar shrink-0 rounded-full border border-slate-200 object-cover"
        onError={() => setHasPhotoError(true)}
      />
    );
  }

  return (
    <div
      className={`card-avatar flex shrink-0 items-center justify-center rounded-full text-lg font-bold ${
        isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
      }`}
      aria-hidden="true"
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
};

const PersonCard = ({ person }) => {
  const ctx = useTreeContext();
  const {
    selectedId,
    isAdmin,
    activeLineageIds,
    bloodRelativeIds,
    genMap,
    setSelectedId,
    setIsEditDrawerOpen,
    handleAddSpouse,
    handleAddChildClick,
    handleAddParentClick,
    getParentUnion,
    getSpouses,
    getChildren,
  } = ctx;
  const [isRelationMenuOpen, setIsRelationMenuOpen] = useState(false);

  const isSelected = selectedId === person.id;
  const isMale = person.gender === 'male';
  const displayName = person.nickname || person.name || 'Tanpa Nama';
  const fullName = person.nickname && person.name && person.nickname !== person.name ? person.name : '';
  const isDimmed = activeLineageIds && !activeLineageIds.has(person.id);
  const ageLabel = getAgeLabel(person);
  const generation = genMap?.[person.id] || 1;
  const spouses = getSpouses(person.id);
  const children = getChildren(person.id);
  const spouseCount = spouses.length;
  const childCount = children.length;
  const hasParentUnion = Boolean(getParentUnion(person.id));
  const hasRelationship = spouseCount > 0 || childCount > 0;
  const relationshipParts = [
    childCount > 0 ? `${childCount} anak` : null,
    spouseCount > 0 ? `${spouseCount} pasangan` : null,
  ].filter(Boolean);
  const relationshipSummary = hasRelationship
    ? relationshipParts.join(' · ')
    : person.notes || 'Belum ada hubungan';
  const summaryIsNote = !hasRelationship && Boolean(person.notes);
  const contextLabel = `Generasi ${generation} · ${person.isDeceased ? 'wafat' : 'aktif'}`;

  const selectCard = (event) => {
    event.stopPropagation();
    setSelectedId(person.id);
    setIsRelationMenuOpen(false);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectCard(event);
    }
  };

  const openRelationship = (event, action) => {
    event.stopPropagation();
    setIsRelationMenuOpen(false);
    action(person.id);
  };

  return (
    <div
      onClick={selectCard}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${displayName}, ${relationshipSummary}${isSelected ? ', anggota terpilih' : ''}`}
      aria-pressed={isSelected}
      style={{
        transform: `translate(${person.x}px, ${person.y}px)`,
        width: '220px',
        height: '110px',
        opacity: isDimmed ? 'var(--tree-card-dim-opacity)' : 1,
        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s',
      }}
      className={`card-node absolute flex cursor-pointer flex-col justify-between rounded-xl border-2 bg-white p-2 shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
        isSelected
          ? 'z-30 border-indigo-600 ring-4 ring-indigo-500/10 shadow-indigo-100'
          : isMale
            ? 'border-blue-200 hover:border-blue-400'
            : 'border-pink-200 hover:border-pink-400'
      } ${person.isDeceased ? 'bg-slate-200 text-slate-700' : ''} ${isRelationMenuOpen ? 'z-40' : ''}`}
    >
      <div className="card-identity flex h-12 min-w-0 items-center gap-2.5">
        <PersonAvatar
          key={person.photo || 'initial-avatar'}
          person={person}
          displayName={displayName}
          isMale={isMale}
        />
        <div className="min-w-0 overflow-hidden">
          <h3 className="card-name truncate" title={displayName}>
            {displayName}
          </h3>
          {fullName && <p className="card-secondary truncate" title={fullName}>{fullName}</p>}
          {ageLabel && <p className="card-age truncate">{ageLabel}</p>}
        </div>
      </div>

      <div className="card-summary-row flex min-w-0 items-center justify-between gap-2">
        <span
          className={`card-summary min-w-0 truncate ${summaryIsNote ? 'card-summary-note' : ''}`}
          title={relationshipSummary}
        >
          {relationshipSummary}
        </span>
      </div>

      <div className="card-footer flex h-7 min-w-0 items-center justify-between gap-1.5 border-t border-slate-100">
        <span className={`card-context min-w-0 truncate ${isSelected ? 'card-context-selected' : ''}`} title={contextLabel}>
          {contextLabel}
        </span>

        {isSelected ? (
          <div className="relative flex shrink-0 items-center gap-1.5">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsRelationMenuOpen((open) => !open);
                  }}
                  aria-expanded={isRelationMenuOpen}
                  aria-haspopup="menu"
                  className="interactive-btn rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  Tambah
                </button>
                {isRelationMenuOpen && (
                  <div className="relation-menu absolute bottom-full right-0 z-50 mb-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" role="menu">
                    {bloodRelativeIds.has(person.id) && (
                      <button
                        type="button"
                        role="menuitem"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => openRelationship(event, handleAddSpouse)}
                        className="relation-menu-item"
                      >
                        <span className="relation-menu-dot bg-pink-500" />
                        Tambah pasangan
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => openRelationship(event, handleAddChildClick)}
                      className="relation-menu-item"
                    >
                      <span className="relation-menu-dot bg-indigo-500" />
                      Tambah anak
                    </button>
                    {bloodRelativeIds.has(person.id) && hasParentUnion && (
                      <button
                        type="button"
                        role="menuitem"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => openRelationship(event, handleAddParentClick)}
                        className="relation-menu-item"
                      >
                        <span className="relation-menu-dot bg-amber-500" />
                        Tambah orang tua
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className="card-action-hint">Login untuk edit</span>
            )}
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(person.id);
                setIsEditDrawerOpen(true);
              }}
              title="Lihat / Edit Detail Anggota"
              aria-label="Lihat atau edit detail anggota"
              className="interactive-btn flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <svg className="pointer-events-none h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PersonCard;
