import React from 'react';
import { useTreeContext } from '../context/TreeContext';

const SupabaseConfigModal = () => {
  const ctx = useTreeContext();
  const {
    isConfigModalOpen,
    setIsConfigModalOpen,
    supabaseUrl,
    setSupabaseUrl,
    supabaseKey,
    setSupabaseKey,
    supabaseBucket,
    setSupabaseBucket,
    saveConfig,
  } = ctx;

  if (!isConfigModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Pengaturan Connection Supabase
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Masukkan kredensial Supabase Anda. Konfigurasi ini disimpan lokal
          di browser untuk koneksi database & storage.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbG..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Storage Bucket Name
            </label>
            <input
              type="text"
              value={supabaseBucket}
              onChange={(e) => setSupabaseBucket(e.target.value)}
              placeholder="family-photos"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupabaseConfigModal;
