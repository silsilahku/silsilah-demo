import { useState, useRef, useCallback } from 'react';
import { useTreeContext } from '../context/TreeContext';
import { exportJSON, exportHTML, exportImage } from '../utils/exporters';
import { importJSON } from '../utils/importers';
import TreePrintView from './TreePrintView';

const ExportImportModal = () => {
  const ctx = useTreeContext();
  const { setIsExportModalOpen } = ctx;
  const isOpen = ctx.isExportModalOpen;
  const onClose = useCallback(() => setIsExportModalOpen(false), [setIsExportModalOpen]);
  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState('png');
  const [includePhotos, setIncludePhotos] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef(null);
  const fileInputRef = useRef(null);

  const peopleCount = Object.keys(ctx.people).length;

  const handleExport = useCallback(async () => {
    if (peopleCount === 0) return;

    setError('');
    setIsExporting(true);

    try {
      if (exportFormat === 'json') {
        await exportJSON(ctx.people, ctx.unions, includePhotos);
      } else if (exportFormat === 'html') {
        await exportHTML(ctx.people, ctx.unions, ctx.layoutDirection);
      } else if (exportFormat === 'pdf') {
        window.print();
      } else if (printRef.current) {
        await exportImage(printRef.current, exportFormat);
      }
    } catch (err) {
      setError('Export gagal: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, includePhotos, ctx.people, ctx.unions, ctx.layoutDirection, peopleCount]);

  const handleImport = useCallback(async () => {
    if (!importFile) return;
    if (!ctx.isAdmin) {
      setError('Hanya admin yang dapat mengimpor data.');
      return;
    }

    setError('');
    setIsImporting(true);
    setImportStatus('Membaca file...');

    try {
      const result = await importJSON(importFile, ctx);
      setImportStatus(
        `Import berhasil! ${result.peopleCount} orang, ${result.unionsCount} hubungan.${result.uploadedPhotos > 0 ? ` ${result.uploadedPhotos} foto diunggah.` : ''}`
      );
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        onClose();
        setImportStatus(null);
      }, 1500);
    } catch (err) {
      setError('Import gagal: ' + err.message);
      setImportStatus(null);
    } finally {
      setIsImporting(false);
    }
  }, [importFile, ctx, onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setError('');
      setImportStatus(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Export / Import</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('export'); setError(''); setImportStatus(null); }}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === 'export'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => { setActiveTab('import'); setError(''); setImportStatus(null); }}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === 'import'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Import
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Format Export</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="png">PNG (Gambar)</option>
                  <option value="svg">SVG (Vektor)</option>
                  <option value="html">HTML (Buka di browser)</option>
                  <option value="json">JSON (Data)</option>
                  <option value="pdf">PDF (via Print)</option>
                </select>
              </div>

              {exportFormat === 'json' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="includePhotos"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="mt-0.5"
                  />
                  <label htmlFor="includePhotos" className="text-xs text-amber-800 cursor-pointer">
                    Sertakan foto (base64). File akan menjadi lebih besar.
                  </label>
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={peopleCount === 0 || isExporting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition"
              >
                {isExporting ? 'Mengexport...' : 'Download'}
              </button>

              {peopleCount === 0 && (
                <p className="text-xs text-slate-400 text-center">Pohon kosong, tidak ada yang bisa di-export.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-xs text-rose-800 font-medium">
                  Ini akan mengganti SEMUA data yang ada dengan data dari file.
                </p>
              </div>

              {!ctx.isAdmin && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600">
                    Login sebagai admin untuk mengimpor data.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Pilih file JSON</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  disabled={!ctx.isAdmin || isImporting}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <button
                onClick={handleImport}
                disabled={!importFile || !ctx.isAdmin || isImporting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition"
              >
                {isImporting ? 'Mengimpor...' : 'Import'}
              </button>

              {importStatus && (
                <p className="text-xs text-emerald-700 text-center bg-emerald-50 p-2 rounded-lg">{importStatus}</p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      </div>

      {peopleCount > 0 && (
        <div className={exportFormat === 'pdf' ? 'print-overlay' : 'export-canvas'}>
          <TreePrintView printRef={printRef} />
        </div>
      )}
    </>
  );
};

export default ExportImportModal;
