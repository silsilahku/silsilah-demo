import { useCallback } from 'react';
import { useTreeContext } from '../context/TreeContext';
import { calculateStatistics } from '../utils/statistics';

const StatItem = ({ label, value, detail }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-[10px] font-medium text-slate-500">{label}</p>
    <p className="mt-0.5 text-[10px] font-bold text-slate-800">{value}</p>
    {detail && <p className="mt-0.5 text-[10px] text-slate-500">{detail}</p>}
  </div>
);

const personValue = (person) => {
  if (!person) return 'Data belum cukup';
  return `${person.name} (${person.age} tahun)`;
};

const averageValue = (value, suffix = '') =>
  value === null ? 'Data belum cukup' : `${value.toFixed(1)}${suffix}`;

const fractionValue = (numerator, denominator) => {
  if (!Number.isFinite(denominator) || denominator <= 0) return '0 / 0';
  return `${numerator} / ${denominator}`;
};

const StatisticsModal = () => {
  const ctx = useTreeContext();
  const isOpen = ctx.isStatsModalOpen;
  const { setIsStatsModalOpen } = ctx;
  const onClose = useCallback(() => setIsStatsModalOpen(false), [setIsStatsModalOpen]);

  if (!isOpen) return null;

  const statistics = calculateStatistics(ctx.people, ctx.unions, ctx.genMap);

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Statistik Keluarga</h2>
            <p className="mt-0.5 text-xs text-slate-500">Ringkasan berdasarkan data yang tersedia</p>
          </div>
          <button
            onClick={onClose}
            title="Tutup statistik"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <section>
            <h3 className="mb-2 sm:mb-3 text-xs font-semibold text-slate-500 text-indigo-600">Ringkasan keluarga</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <StatItem label="Total generasi" value={statistics.totalGenerations} />
              <StatItem
                label="Laki-laki / perempuan"
                value={`${statistics.maleCount} / ${statistics.femaleCount}`}
              />
              <StatItem label="Pasangan" value={statistics.coupleCount} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 sm:mb-3 text-xs font-semibold text-slate-500 text-emerald-600">Usia</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <StatItem label="Tertua" value={personValue(statistics.oldestLiving)} />
              <StatItem label="Termuda" value={personValue(statistics.youngestLiving)} />
              <StatItem
                label="Usia saat wafat"
                value={averageValue(statistics.averageAgeAtDeath, ' tahun')}
                detail={statistics.deceasedSampleSize > 0 ? `Berdasarkan ${statistics.deceasedSampleSize} anggota` : null}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 sm:mb-3 text-xs font-semibold text-slate-500 text-amber-600">Keturunan</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <StatItem
                label="Anak per pasangan"
                value={averageValue(statistics.averageChildrenPerCouple)}
                detail={statistics.coupleSampleSize > 0 ? `Berdasarkan ${statistics.coupleSampleSize} pasangan` : null}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 sm:mb-3 text-xs font-semibold text-slate-500 text-sky-600">Kelengkapan Data</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <StatItem label="Total anggota" value={statistics.totalPeople} />
              <StatItem label="Masih hidup" value={statistics.livingCount} />
              <StatItem label="Telah wafat" value={statistics.deceasedCount} />
              <StatItem label="Tahun lahir" value={`${statistics.peopleWithBirthYear} / ${statistics.totalPeople}`} />
              <StatItem label="Tahun wafat" value={fractionValue(statistics.peopleWithDeathYear, statistics.deceasedCount)} />
              <StatItem label="Jenis kelamin" value={`${statistics.peopleWithGender} / ${statistics.totalPeople}`} />
              <StatItem label="Foto" value={`${statistics.peopleWithPhoto} / ${statistics.totalPeople}`} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;
