import { useEffect, useRef, useState } from 'react';
import { useTreeContext } from '../context/TreeContext';
import { calculateAgeInfo } from '../utils/age-calc';

const SideDrawer = () => {
  const ctx = useTreeContext();
  const {
    isEditDrawerOpen,
    setIsEditDrawerOpen,
    selectedPerson,
    isAdmin,
    isUploadingPhoto,
    uploadPhoto,
    removePhoto,
    handleUpdatePerson,
    handleDeletePerson,
    handleSavePerson,
    supabaseClient,
    getFather,
    getMother,
    getSiblings,
    getSpouses,
    getChildren,
  } = ctx;

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isFamilySummaryOpen, setIsFamilySummaryOpen] = useState(false);
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);
  const [photoDragY, setPhotoDragY] = useState(0);
  const photoTouchStartY = useRef(0);

  // Kunci scroll di belakang saat lightbox foto terbuka (penting untuk mobile)
  useEffect(() => {
    if (!isPhotoZoomOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isPhotoZoomOpen]);

  const onPhotoTouchStart = (e) => {
    photoTouchStartY.current = e.touches[0].clientY;
  };

  const onPhotoTouchMove = (e) => {
    const dy = e.touches[0].clientY - photoTouchStartY.current;
    if (dy > 0) setPhotoDragY(dy);
  };

  const onPhotoTouchEnd = () => {
    if (photoDragY > 90) setIsPhotoZoomOpen(false);
    setPhotoDragY(0);
  };

  if (!isEditDrawerOpen || !selectedPerson) return null;

  const onSave = async () => {
    setIsSaving(true);
    setSaveFeedback('');
    try {
      const ok = await handleSavePerson(selectedPerson.id);
      if (ok) {
        setSaveFeedback('Data berhasil diperbarui');
        setTimeout(() => {
          setIsEditDrawerOpen(false);
          setIsSaving(false);
          setSaveFeedback('');
        }, 1000);
        return;
      } else {
        alert('Gagal memperbarui data. Pastikan Supabase terhubung.');
      }
    } catch (err) {
      alert('Gagal memperbarui data: ' + (err.message || err));
    }
    setTimeout(() => {
      setIsSaving(false);
      setSaveFeedback('');
    }, 2000);
  };

  return (
    <div className="side-drawer fixed top-14 right-0 bottom-0 w-80 max-w-[85vw] bg-white border-l border-slate-200 shadow-xl z-40 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800">
          {isAdmin ? 'Edit Detail Anggota' : 'Detail Anggota Keluarga'}
        </h2>
        <button
          onClick={() => setIsEditDrawerOpen(false)}
          className="p-1 hover:bg-slate-100 rounded text-slate-400"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col items-center mb-5 text-center">
        {selectedPerson.photo ? (
          <img
            src={selectedPerson.photo}
            alt={selectedPerson.name}
            onClick={() => setIsPhotoZoomOpen(true)}
            className="w-20 h-20 rounded-xl object-cover border-2 border-indigo-200 shadow-md mb-2 cursor-zoom-in hover:opacity-90 transition"
            title="Klik untuk memperbesar foto"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://placehold.co/100x100/e2e8f0/64748b?text=Foto';
            }}
          />
        ) : (
          <div
            className={`w-20 h-20 rounded-xl flex items-center justify-center font-bold text-2xl mb-2 shadow-inner ${
              selectedPerson.isDeceased
                ? 'bg-slate-300 text-slate-600'
                : selectedPerson.gender === 'male'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-pink-100 text-pink-700'
            }`}
          >
            {(selectedPerson.nickname || selectedPerson.name || '?')
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
        <h3 className="font-bold text-slate-800 text-base">
          {selectedPerson.nickname || selectedPerson.name}
        </h3>
        {selectedPerson.nickname && selectedPerson.name && (
          <p className="text-xs text-slate-500">{selectedPerson.name}</p>
        )}
      </div>

      {isAdmin && (
        <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Upload Foto ke Supabase Bucket
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => uploadPhoto(e.target.files?.[0])}
            disabled={isUploadingPhoto || !supabaseClient}
            className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {isUploadingPhoto && (
            <p className="text-[10px] text-indigo-600 font-medium mt-1">
              Mengunggah foto...
            </p>
          )}
          {selectedPerson.photo && (
            <button
              onClick={removePhoto}
              disabled={isUploadingPhoto}
              className="mt-2 w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-semibold transition"
            >
              Hapus Foto
            </button>
          )}
        </div>
      )}

      {(() => {
        const ageInfo = calculateAgeInfo(
          selectedPerson.birthYear,
          selectedPerson.deathYear,
          selectedPerson.isDeceased
        );
        return ageInfo ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center mb-5">
            <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider block">
              {ageInfo.label}
            </span>
            <span className="text-base font-bold text-indigo-700">
              {ageInfo.value}
            </span>
          </div>
        ) : null;
      })()}

      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Nama Panggilan
          </label>
          <input
            type="text"
            disabled={!isAdmin}
            value={selectedPerson.nickname || ''}
            onChange={(e) =>
              handleUpdatePerson(selectedPerson.id, 'nickname', e.target.value)
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
            placeholder="Contoh: Pak Budi"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            disabled={!isAdmin}
            value={selectedPerson.name || ''}
            onChange={(e) =>
              handleUpdatePerson(selectedPerson.id, 'name', e.target.value)
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
            placeholder="Contoh: Budi Santoso, S.T."
          />
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Jenis Kelamin
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() =>
                handleUpdatePerson(selectedPerson.id, 'gender', 'male')
              }
              className={`py-1.5 rounded-lg border text-center font-medium ${
                selectedPerson.gender === 'male'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Laki-laki
            </button>
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() =>
                handleUpdatePerson(selectedPerson.id, 'gender', 'female')
              }
              className={`py-1.5 rounded-lg border text-center font-medium ${
                selectedPerson.gender === 'female'
                  ? 'bg-pink-50 border-pink-500 text-pink-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Perempuan
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Domisili Terakhir
          </label>
          <input
            type="text"
            disabled={!isAdmin}
            value={selectedPerson.domicile || ''}
            onChange={(e) =>
              handleUpdatePerson(
                selectedPerson.id,
                'domicile',
                e.target.value
              )
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
            placeholder="Contoh: Jakarta Selatan"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Tahun Lahir
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="1990"
              value={selectedPerson.birthYear || ''}
              onChange={(e) =>
                handleUpdatePerson(
                  selectedPerson.id,
                  'birthYear',
                  e.target.value
                )
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Tahun Wafat
            </label>
            <input
              type="text"
              placeholder="2020"
              value={selectedPerson.deathYear || ''}
              disabled={!isAdmin || !selectedPerson.isDeceased}
              onChange={(e) =>
                handleUpdatePerson(
                  selectedPerson.id,
                  'deathYear',
                  e.target.value
                )
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            id="isDeceased"
            disabled={!isAdmin}
            checked={selectedPerson.isDeceased || false}
            onChange={(e) =>
              handleUpdatePerson(
                selectedPerson.id,
                'isDeceased',
                e.target.checked
              )
            }
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <label
            htmlFor="isDeceased"
            className="text-slate-700 font-medium cursor-pointer select-none"
          >
            Sudah Meninggal Dunia
          </label>
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Biografi Ringkas / Link Sosmed
          </label>
          <textarea
            rows={2}
            disabled={!isAdmin}
            value={selectedPerson.bio || ''}
            onChange={(e) =>
              handleUpdatePerson(selectedPerson.id, 'bio', e.target.value)
            }
            placeholder="Pekerjaan, hobi, atau tautan Instagram / LinkedIn..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
          ></textarea>
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            disabled={!isAdmin}
            value={selectedPerson.notes || ''}
            onChange={(e) =>
              handleUpdatePerson(selectedPerson.id, 'notes', e.target.value)
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-75"
          ></textarea>
        </div>

        {(() => {
          const father = getFather(selectedPerson.id);
          const mother = getMother(selectedPerson.id);
          const siblings = getSiblings(selectedPerson.id);
          const spouses = getSpouses(selectedPerson.id);
          const children = getChildren(selectedPerson.id);

          const hasFamilyData = father || mother || siblings.length > 0 || spouses.length > 0 || children.length > 0;

          if (!hasFamilyData) return null;

          return (
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFamilySummaryOpen(!isFamilySummaryOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-left"
              >
                <span className="text-sm font-semibold text-slate-700">Ringkasan Keluarga</span>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform ${isFamilySummaryOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isFamilySummaryOpen && (
                <div className="mt-3 space-y-3 text-xs">
                  {father && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-slate-600 w-24 flex-shrink-0">Bapak</span>
                      <span className="text-slate-800">{father.nickname || father.name}</span>
                    </div>
                  )}
                  {mother && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-slate-600 w-24 flex-shrink-0">Ibu</span>
                      <span className="text-slate-800">{mother.nickname || mother.name}</span>
                    </div>
                  )}
                  {siblings.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-slate-600 w-24 flex-shrink-0">Saudara Kandung</span>
                      <span className="text-slate-800">
                        {siblings.map(s => s.nickname || s.name).join(', ')}
                      </span>
                    </div>
                  )}
                  {spouses.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-slate-600 w-24 flex-shrink-0">Pasangan</span>
                      <span className="text-slate-800">
                        {spouses.map(s => s.person.nickname || s.person.name).join(', ')}
                      </span>
                    </div>
                  )}
                  {children.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-slate-600 w-24 flex-shrink-0">Anak</span>
                      <span className="text-slate-800">
                        {children.map(c => c.nickname || c.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {isAdmin && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium transition disabled:opacity-70"
            >
              {isSaving ? 'Menyimpan...' : saveFeedback || 'Perbarui Data'}
            </button>

            {isDeleteConfirmOpen ? (
              <div className="space-y-2">
                <p className="text-[11px] text-red-600 font-medium">
                  Ketik nama panggilan <span className="font-bold">{selectedPerson.nickname || selectedPerson.name}</span> untuk menghapus:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-red-500"
                  placeholder={selectedPerson.nickname || selectedPerson.name}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsDeleteConfirmOpen(false);
                      setDeleteConfirmText('');
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeletePerson(selectedPerson.id)}
                    disabled={deleteConfirmText !== (selectedPerson.nickname || selectedPerson.name)}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium transition"
              >
                Hapus Anggota Keluarga
              </button>
            )}
          </div>
        )}
      </div>

      {isPhotoZoomOpen && selectedPerson.photo && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out touch-none"
          onClick={() => setIsPhotoZoomOpen(false)}
        >
          <button
            onClick={() => setIsPhotoZoomOpen(false)}
            className="absolute top-3 right-3 p-3 text-white/80 hover:text-white text-2xl leading-none"
            title="Tutup"
          >
            ✕
          </button>
          <div
            className="max-w-full max-h-full flex flex-col items-center gap-3"
            style={{
              transform: `translateY(${photoDragY}px)`,
              transition: photoDragY ? 'none' : 'transform 200ms ease-out',
              opacity: Math.max(0, 1 - photoDragY / 250),
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onPhotoTouchStart}
            onTouchMove={onPhotoTouchMove}
            onTouchEnd={onPhotoTouchEnd}
          >
            <img
              src={selectedPerson.photo}
              alt={selectedPerson.name}
              draggable={false}
              className="max-w-[92vw] sm:max-w-[90vw] max-h-[75vh] sm:max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="text-white text-sm font-medium text-center px-4">
              {selectedPerson.nickname || selectedPerson.name}
            </p>
            <p className="text-white/50 text-[11px] sm:hidden">
              Geser ke bawah atau ketuk area gelap untuk menutup
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideDrawer;
