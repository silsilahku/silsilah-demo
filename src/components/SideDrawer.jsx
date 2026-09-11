import { useEffect, useRef, useState } from 'react';
import { useTreeContext } from '../context/TreeContext';
import { calculateAgeInfo } from '../utils/age-calc';
import { CARD_HEIGHT, CARD_WIDTH } from '../utils/constants';

const getPersonName = (person) => person?.nickname || person?.name || 'Tanpa Nama';

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

const RelatedMemberButton = ({ label, person, onSelect }) => {
  if (!person) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(person)}
      className="inspector-relation-row"
      title={`Pusatkan ${getPersonName(person)}`}
    >
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-xs font-semibold text-indigo-700">{getPersonName(person)}</span>
        <span className="shrink-0 text-slate-400">›</span>
      </span>
    </button>
  );
};

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
    setSelectedId,
    setTransform,
  } = ctx;

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isFamilySummaryOpen, setIsFamilySummaryOpen] = useState(true);
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);
  const [photoDragY, setPhotoDragY] = useState(0);
  const photoTouchStartY = useRef(0);

  useEffect(() => {
    if (!isPhotoZoomOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPhotoZoomOpen]);

  const onPhotoTouchStart = (event) => {
    photoTouchStartY.current = event.touches[0].clientY;
  };

  const onPhotoTouchMove = (event) => {
    const distance = event.touches[0].clientY - photoTouchStartY.current;
    if (distance > 0) setPhotoDragY(distance);
  };

  const onPhotoTouchEnd = () => {
    if (photoDragY > 90) setIsPhotoZoomOpen(false);
    setPhotoDragY(0);
  };

  const onSave = async () => {
    setIsSaving(true);
    setSaveFeedback('');
    try {
      const saved = await handleSavePerson(selectedPerson.id);
      if (saved) {
        setSaveFeedback('Semua perubahan sudah tersimpan');
        window.setTimeout(() => {
          setIsEditDrawerOpen(false);
          setIsSaving(false);
          setSaveFeedback('');
        }, 900);
        return;
      }
      alert('Gagal memperbarui data. Pastikan Supabase terhubung.');
    } catch (error) {
      alert('Gagal memperbarui data: ' + (error.message || error));
    }
    window.setTimeout(() => {
      setIsSaving(false);
      setSaveFeedback('');
    }, 1800);
  };

  const focusRelatedPerson = (person) => {
    if (!person) return;
    setSelectedId(person.id);
    setTransform((previous) => {
      const viewportWidth = window.innerWidth > 900 ? window.innerWidth - 340 : window.innerWidth;
      const viewportHeight = Math.max(0, window.innerHeight - 64);
      return {
        ...previous,
        x: viewportWidth / 2 - (person.x + CARD_WIDTH / 2) * previous.scale,
        y: viewportHeight / 2 - (person.y + CARD_HEIGHT / 2) * previous.scale,
      };
    });
  };

  if (!isEditDrawerOpen || !selectedPerson) return null;

  const father = getFather(selectedPerson.id);
  const mother = getMother(selectedPerson.id);
  const siblings = getSiblings(selectedPerson.id);
  const spouses = getSpouses(selectedPerson.id);
  const children = getChildren(selectedPerson.id);
  const selectedName = getPersonName(selectedPerson);
  const fullName = selectedPerson.name && selectedPerson.nickname !== selectedPerson.name ? selectedPerson.name : '';
  const ageInfo = calculateAgeInfo(
    selectedPerson.birthYear,
    selectedPerson.deathYear,
    selectedPerson.isDeceased
  );
  const relationshipCount = [father, mother, ...spouses, ...children].filter(Boolean).length + siblings.length;

  return (
    <>
      <button
        type="button"
        className="inspector-scrim"
        onClick={() => setIsEditDrawerOpen(false)}
        aria-label="Tutup detail anggota"
      />
      <aside
        className="side-drawer"
        aria-labelledby="selected-member-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="inspector-header">
          <div>
            <p className="section-eyebrow">Anggota terpilih</p>
            <h2 id="selected-member-title" className="mt-1 text-sm font-bold text-slate-800">
              Detail anggota
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsEditDrawerOpen(false)}
            className="icon-button"
            aria-label="Tutup detail anggota"
          >
            <Icon>
              <path d="m6 6 12 12M18 6 6 18" />
            </Icon>
          </button>
        </div>

        <div className="inspector-scroll">
          <div className="inspector-identity">
            <button
              type="button"
              onClick={() => selectedPerson.photo && setIsPhotoZoomOpen(true)}
              className={`inspector-avatar ${selectedPerson.photo ? 'cursor-zoom-in' : 'cursor-default'}`}
              aria-label={selectedPerson.photo ? `Perbesar foto ${selectedName}` : `Avatar ${selectedName}`}
            >
              {selectedPerson.photo ? (
                <img
                  src={selectedPerson.photo}
                  alt={selectedName}
                  className="h-full w-full rounded-2xl object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=Foto';
                  }}
                />
              ) : (
                <span>{selectedName.charAt(0).toUpperCase()}</span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-slate-800">{selectedName}</h3>
              {fullName && <p className="truncate text-xs text-slate-500">{fullName}</p>}
              {ageInfo && (
                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                  {ageInfo.value} · {selectedPerson.isDeceased ? 'wafat' : 'aktif'}
                </span>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="inspector-photo-tools">
              <div>
                <p className="text-[11px] font-semibold text-slate-700">Foto profil</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Simpan foto anggota secara opsional.</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => uploadPhoto(event.target.files?.[0])}
                disabled={isUploadingPhoto || !supabaseClient}
                className="inspector-file-input"
                aria-label="Unggah foto profil"
              />
              {isUploadingPhoto && <p className="text-[10px] font-medium text-indigo-600">Mengunggah foto...</p>}
              {selectedPerson.photo && (
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={isUploadingPhoto}
                  className="mt-2 w-full rounded-lg border border-rose-200 bg-rose-50 py-2 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  Hapus foto
                </button>
              )}
            </div>
          )}

          <section className="inspector-section">
            <button
              type="button"
              onClick={() => setIsFamilySummaryOpen((open) => !open)}
              aria-expanded={isFamilySummaryOpen}
              className="inspector-section-heading"
            >
              <span>
                <span className="section-eyebrow">Hubungan</span>
                <span className="mt-1 block text-sm font-bold text-slate-800">Ringkasan keluarga</span>
              </span>
              <span className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                {relationshipCount} hubungan
                <Icon className={`h-4 w-4 transition-transform ${isFamilySummaryOpen ? 'rotate-180' : ''}`}>
                  <path d="m6 9 6 6 6-6" />
                </Icon>
              </span>
            </button>

            {isFamilySummaryOpen && (
              <div className="mt-3 space-y-1">
                <RelatedMemberButton label="Bapak" person={father} onSelect={focusRelatedPerson} />
                <RelatedMemberButton label="Ibu" person={mother} onSelect={focusRelatedPerson} />
                {spouses.map(({ person }) => (
                  <RelatedMemberButton key={`spouse-${person.id}`} label="Pasangan" person={person} onSelect={focusRelatedPerson} />
                ))}
                {children.length > 0 && (
                  <div className="inspector-relation-group">
                    <span className="text-[11px] text-slate-500">Anak</span>
                    <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
                      {children.map((child) => (
                        <button
                          type="button"
                          key={`child-${child.id}`}
                          onClick={() => focusRelatedPerson(child)}
                          className="max-w-full truncate rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          {getPersonName(child)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {siblings.length > 0 && (
                  <div className="inspector-relation-group">
                    <span className="text-[11px] text-slate-500">Saudara</span>
                    <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
                      {siblings.map((sibling) => (
                        <button
                          type="button"
                          key={`sibling-${sibling.id}`}
                          onClick={() => focusRelatedPerson(sibling)}
                          className="max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          {getPersonName(sibling)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!father && !mother && spouses.length === 0 && children.length === 0 && siblings.length === 0 && (
                  <p className="rounded-lg bg-slate-50 px-3 py-3 text-[11px] text-slate-400">Belum ada hubungan yang tercatat.</p>
                )}
              </div>
            )}
          </section>

          <section className="inspector-section">
            <div className="inspector-section-heading pointer-events-none">
              <span>
                <span className="section-eyebrow">{isAdmin ? 'Mode admin' : 'Informasi'}</span>
                <span className="mt-1 block text-sm font-bold text-slate-800">Informasi pribadi</span>
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="inspector-field">
                <label htmlFor="person-nickname">Nama panggilan</label>
                <input
                  id="person-nickname"
                  type="text"
                  disabled={!isAdmin}
                  value={selectedPerson.nickname || ''}
                  onChange={(event) => handleUpdatePerson(selectedPerson.id, 'nickname', event.target.value)}
                  placeholder="Contoh: Pak Budi"
                />
              </div>

              <div className="inspector-field">
                <label htmlFor="person-name">Nama lengkap</label>
                <input
                  id="person-name"
                  type="text"
                  disabled={!isAdmin}
                  value={selectedPerson.name || ''}
                  onChange={(event) => handleUpdatePerson(selectedPerson.id, 'name', event.target.value)}
                  placeholder="Contoh: Budi Santoso, S.T."
                />
              </div>

              <fieldset className="inspector-field">
                <legend>Jenis kelamin</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handleUpdatePerson(selectedPerson.id, 'gender', 'male')}
                    className={`gender-choice ${selectedPerson.gender === 'male' ? 'gender-choice-male-selected' : ''}`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handleUpdatePerson(selectedPerson.id, 'gender', 'female')}
                    className={`gender-choice ${selectedPerson.gender === 'female' ? 'gender-choice-female-selected' : ''}`}
                  >
                    Perempuan
                  </button>
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-2">
                <div className="inspector-field">
                  <label htmlFor="person-birth-year">Tahun lahir</label>
                  <input
                    id="person-birth-year"
                    type="text"
                    disabled={!isAdmin}
                    placeholder="1990"
                    value={selectedPerson.birthYear || ''}
                    onChange={(event) => handleUpdatePerson(selectedPerson.id, 'birthYear', event.target.value)}
                  />
                </div>
                <div className="inspector-field">
                  <label htmlFor="person-domicile">Domisili terakhir</label>
                  <input
                    id="person-domicile"
                    type="text"
                    disabled={!isAdmin}
                    value={selectedPerson.domicile || ''}
                    onChange={(event) => handleUpdatePerson(selectedPerson.id, 'domicile', event.target.value)}
                    placeholder="Kota"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="inspector-field">
                  <label htmlFor="person-death-year">Tahun wafat</label>
                  <input
                    id="person-death-year"
                    type="text"
                    disabled={!isAdmin || !selectedPerson.isDeceased}
                    placeholder="2020"
                    value={selectedPerson.deathYear || ''}
                    onChange={(event) => handleUpdatePerson(selectedPerson.id, 'deathYear', event.target.value)}
                  />
                </div>
                <label className="deceased-toggle">
                  <input
                    type="checkbox"
                    id="isDeceased"
                    disabled={!isAdmin}
                    checked={selectedPerson.isDeceased || false}
                    onChange={(event) => handleUpdatePerson(selectedPerson.id, 'isDeceased', event.target.checked)}
                  />
                  <span>
                    <span className="block text-[11px] font-semibold text-slate-700">Status</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">Sudah wafat</span>
                  </span>
                </label>
              </div>

              <div className="inspector-field">
                <label htmlFor="person-bio">Biografi ringkas / link sosmed</label>
                <textarea
                  id="person-bio"
                  rows={2}
                  disabled={!isAdmin}
                  value={selectedPerson.bio || ''}
                  onChange={(event) => handleUpdatePerson(selectedPerson.id, 'bio', event.target.value)}
                  placeholder="Pekerjaan, hobi, atau tautan Instagram / LinkedIn..."
                />
              </div>

              <div className="inspector-field">
                <label htmlFor="person-notes">Catatan tambahan</label>
                <textarea
                  id="person-notes"
                  rows={2}
                  disabled={!isAdmin}
                  value={selectedPerson.notes || ''}
                  onChange={(event) => handleUpdatePerson(selectedPerson.id, 'notes', event.target.value)}
                  placeholder="Catatan keluarga..."
                />
              </div>

              {isAdmin && isDeleteConfirmOpen && (
                <div className="delete-confirm-box">
                  <p className="text-[11px] font-medium text-rose-700">
                    Ketik nama panggilan <strong>{selectedName}</strong> untuk menghapus anggota ini.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(event) => setDeleteConfirmText(event.target.value)}
                    className="delete-confirm-input"
                    placeholder={selectedName}
                    aria-label="Konfirmasi nama anggota"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        setDeleteConfirmText('');
                      }}
                      className="secondary-button"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePerson(selectedPerson.id)}
                      disabled={deleteConfirmText !== selectedName}
                      className="danger-button disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Hapus anggota
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {isAdmin ? (
          <footer className="inspector-footer">
            <div className="mb-2 flex min-h-4 items-center gap-2 text-[10px] text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              {saveFeedback || 'Semua perubahan sudah tersimpan'}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={onSave} disabled={isSaving} className="primary-button disabled:opacity-70">
                {isSaving ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="danger-button whitespace-nowrap"
              >
                Hapus
              </button>
            </div>
          </footer>
        ) : (
          <footer className="inspector-footer">
            <p className="text-center text-[11px] text-slate-400">Masuk sebagai admin untuk mengubah data anggota.</p>
          </footer>
        )}
      </aside>

      {isPhotoZoomOpen && selectedPerson.photo && (
        <div
          className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-black/80 p-4 touch-none"
          onClick={() => setIsPhotoZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsPhotoZoomOpen(false)}
            className="absolute right-3 top-3 rounded-lg p-3 text-2xl leading-none text-white/80 hover:text-white"
            title="Tutup"
            aria-label="Tutup foto"
          >
            ✕
          </button>
          <div
            className="flex max-h-full max-w-full flex-col items-center gap-3"
            style={{
              transform: `translateY(${photoDragY}px)`,
              transition: photoDragY ? 'none' : 'transform 200ms ease-out',
              opacity: Math.max(0, 1 - photoDragY / 250),
            }}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={onPhotoTouchStart}
            onTouchMove={onPhotoTouchMove}
            onTouchEnd={onPhotoTouchEnd}
          >
            <img
              src={selectedPerson.photo}
              alt={selectedName}
              draggable={false}
              className="max-h-[75vh] max-w-[92vw] rounded-lg object-contain shadow-2xl sm:max-h-[80vh] sm:max-w-[90vw]"
            />
            <p className="px-4 text-center text-sm font-medium text-white">{selectedName}</p>
            <p className="text-[11px] text-white/50 sm:hidden">Geser ke bawah atau ketuk area gelap untuk menutup</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SideDrawer;
