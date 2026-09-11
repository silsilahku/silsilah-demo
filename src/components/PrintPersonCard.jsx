const PrintPersonCard = ({ person, offset = { x: 0, y: 0 } }) => {
  const displayName = person.nickname || person.name || 'Tanpa Nama';
  const isMale = person.gender === 'male';

  return (
    <div
      style={{
        position: 'absolute',
        left: person.x + offset.x,
        top: person.y + offset.y,
        width: '220px',
        height: '118px',
      }}
      className="print-person-card"
    >
      <div className="flex items-center gap-2.5">
        {person.photo ? (
          <img
            src={person.photo}
            alt={displayName}
            className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
              isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
            }`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="overflow-hidden">
          <h3 className="font-semibold text-xs text-slate-800 truncate" title={displayName}>
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
              <p className="text-[10px] text-slate-500 font-medium truncate">{ageText}</p>
            ) : null;
          })()}
        </div>
      </div>

      {person.notes && (
        <p className="text-[10px] text-slate-500 italic truncate border-t border-slate-100 pt-1 mt-1">
          {person.notes}
        </p>
      )}
    </div>
  );
};

export default PrintPersonCard;
