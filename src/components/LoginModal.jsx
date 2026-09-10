import React, { useState } from 'react';
import { useTreeContext } from '../context/TreeContext';

const LoginModal = () => {
  const ctx = useTreeContext();
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginError,
    login,
  } = ctx;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) {
      setEmail('');
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🔑</span>
          <h3 className="text-base font-bold text-slate-800">
            Login Admin Silsilah
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Masukkan kredensial email & password pengguna Supabase Auth
          Anda untuk membuka akses pengeditan (CRUD).
        </p>

        {loginError && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Email Admin
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@keluarga.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
            >
              Login Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
