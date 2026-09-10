import React from 'react';
import { useTreeContext } from '../context/TreeContext';

const ParentTypeSelectorModal = () => {
  const ctx = useTreeContext();
  const {
    isSelectParentModalOpen,
    setIsSelectParentModalOpen,
    pendingParentTargetId,
    createParentForPerson,
    people,
  } = ctx;

  if (!isSelectParentModalOpen) return null;

  const targetNickname =
    people[pendingParentTargetId]?.nickname ||
    people[pendingParentTargetId]?.name;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Tambah Orang Tua
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Pilih jenis orang tua yang ingin ditambahkan untuk{' '}
          <span className="font-semibold text-slate-700">
            {targetNickname}
          </span>
          :
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => createParentForPerson(pendingParentTargetId, 'male')}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-400 transition flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              👨
            </div>
            <span className="text-xs font-bold text-blue-900">
              Bapak / Ayah
            </span>
          </button>
          <button
            onClick={() =>
              createParentForPerson(pendingParentTargetId, 'female')
            }
            className="p-4 rounded-xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100 hover:border-pink-400 transition flex flex-col items-center gap-2 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              👩
            </div>
            <span className="text-xs font-bold text-pink-900">
              Ibu
            </span>
          </button>
        </div>
        <button
          onClick={() => setIsSelectParentModalOpen(false)}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

export default ParentTypeSelectorModal;
