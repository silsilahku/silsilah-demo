import React from 'react';
import { useTreeContext } from '../context/TreeContext';

const SpouseSelectorModal = () => {
  const ctx = useTreeContext();
  const {
    isSelectSpouseModalOpen,
    setIsSelectSpouseModalOpen,
    spouseOptions,
    pendingChildParentId,
    createChildForUnion,
    people,
  } = ctx;

  if (!isSelectSpouseModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Pilih Ibu / Ayah Pasangan
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {people[pendingChildParentId]?.name} memiliki beberapa pasangan.
          Pilih dari hubungan mana anak ini lahir:
        </p>
        <div className="space-y-2 mb-6">
          {spouseOptions.map((item) => (
            <button
              key={item.unionId}
              onClick={() =>
                createChildForUnion(
                  item.unionId,
                  pendingChildParentId,
                  item.person
                )
              }
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  dengan {item.person.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.person.gender === 'male' ? 'Suami' : 'Istri'}
                </span>
              </div>
              <svg
                className="w-4 h-4 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsSelectSpouseModalOpen(false)}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

export default SpouseSelectorModal;
