import { useTreeContext } from '../context/TreeContext';

const PersonCard = ({ person }) => {
  const ctx = useTreeContext();
  const {
    selectedId,
    isAdmin,
    activeLineageIds,
    bloodRelativeIds,
    setSelectedId,
    setIsEditDrawerOpen,
    handleAddSpouse,
    handleAddChildClick,
    handleAddParentClick,
    getParentUnion,
  } = ctx;

  const isSelected = selectedId === person.id;
  const isMale = person.gender === 'male';
  const displayName = person.nickname || person.name || 'Tanpa Nama';
  const isDimmed = activeLineageIds && !activeLineageIds.has(person.id);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(person.id);
      }}
      style={{
        transform: `translate(${person.x}px, ${person.y}px)`,
        width: '220px',
        height: '110px',
        opacity: isDimmed ? 0.35 : 1,
        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s',
      }}
      className={`card-node absolute rounded-xl shadow-sm hover:shadow-lg border-2 transition-all cursor-pointer flex flex-col justify-between p-3 ${
        isSelected
          ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-indigo-100 z-30'
          : isMale
            ? 'border-blue-200 hover:border-blue-400'
            : 'border-pink-200 hover:border-pink-400'
      } ${person.isDeceased ? 'bg-slate-200 text-slate-700' : 'bg-white'}`}
    >
      <div className="flex items-center gap-2.5">
        {person.photo ? (
          <img
            src={person.photo}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
              isMale
                ? 'bg-blue-100 text-blue-700'
                : 'bg-pink-100 text-pink-700'
            }`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="overflow-hidden">
          <h3
            className="font-semibold text-xs text-slate-800 truncate"
            title={displayName}
          >
            {displayName}
          </h3>
          {(() => {
            const currentYear = new Date().getFullYear();
            const birth = parseInt(person.birthYear);
            let ageText = '';
            if (!isNaN(birth)) {
              if (person.isDeceased) {
                const death = parseInt(person.deathYear);
                ageText =
                  !isNaN(death) && death - birth >= 0
                    ? `${death - birth} thn (Wafat)`
                    : 'Wafat';
              } else {
                const age = currentYear - birth;
                ageText = age >= 0 ? `${age} thn` : '';
              }
            } else if (person.isDeceased) {
              ageText = 'Wafat';
            }
            return ageText ? (
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {ageText}
              </p>
            ) : null;
          })()}
        </div>
      </div>

      {person.notes && (
        <p className="text-[10px] text-slate-500 italic truncate border-t border-slate-100 pt-1">
          {person.notes}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1">
        {isAdmin ? (
          <div className="flex items-center gap-1">
             {bloodRelativeIds.has(person.id) && (
               <button
                 onMouseDown={(e) => e.stopPropagation()}
                 onClick={(e) => {
                   e.stopPropagation();
                   handleAddSpouse(person.id);
                 }}
                 title="Tambah Pasangan"
                 className="interactive-btn text-[10px] px-1.5 py-0.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded font-medium transition border border-pink-200"
               >
                 + Pasangan
               </button>
             )}
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleAddChildClick(person.id);
              }}
              title="Tambah Anak"
              className="interactive-btn text-[10px] px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium transition border border-indigo-200"
            >
              + Anak
            </button>
              {bloodRelativeIds.has(person.id) && getParentUnion(person.id) && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddParentClick(person.id);
                  }}
                  title="Tambah Orang Tua"
                  className="interactive-btn text-[10px] px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded font-medium transition border border-amber-200"
                >
                  + Orang Tua
                </button>
              )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">
            Login untuk edit
          </span>
        )}

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(person.id);
            setIsEditDrawerOpen(true);
          }}
          title="Lihat / Edit Detail Anggota"
          className="interactive-btn p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition border border-transparent hover:border-indigo-100"
        >
          <svg
            className="w-3.5 h-3.5 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PersonCard;
