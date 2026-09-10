import React, { useState } from 'react';
import { useTreeContext } from '../context/TreeContext';

const ConfirmResetModal = () => {
  const ctx = useTreeContext();
  const { isAdmin, isResetConfirmOpen, setIsResetConfirmOpen, handleResetTree } = ctx;
  const [step, setStep] = useState(1);
  const [textValue, setTextValue] = useState('');

  if (!isResetConfirmOpen || !isAdmin) return null;

  if (!isResetConfirmOpen) return null;

  const handleConfirm = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsResetConfirmOpen(false);
      setStep(1);
      await handleResetTree();
    }
  };

  const handleCancel = () => {
    setIsResetConfirmOpen(false);
    setStep(1);
  };

  const stepMessages = [
    {
      title: 'Konfirmasi Reset Pohon - Langkah 1',
      message: 'Semua data pohon keluarga akan dihapus permanen dari perangkat dan server Supabase. Lanjutkan?',
    },
    {
      title: 'Konfirmasi Reset Pohon - Langkah 2',
      message: 'Peringatan: Tindakan ini tidak dapat dibatalkan. Semua catatan keluarga, foto, dan relasi akan hilang selamanya. Anda yakin?',
    },
    {
      title: 'Konfirmasi Reset Pohon - Langkah 3',
      message: 'Anda sedang memasuki langkah terakhir. Ketik "RESET" untuk mengonfirmasi penghapusan total.',
    },
  ];

  const dialogPositions = [
    'items-start justify-start',
    'items-center justify-center',
    'items-end justify-end',
  ];

  const currentStep = step;
  const currentMessage = stepMessages[currentStep - 1];
  const currentPosition = dialogPositions[currentStep - 1];

  const showTextInput = currentStep === 3;
  const isTextInputValid = textValue === 'RESET';

  const handleFinalConfirm = () => {
    if (isTextInputValid) {
      handleConfirm();
      setTextValue('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col z-50 p-4">
      <div
        className={`flex h-full w-full ${currentPosition} pt-20`}
      >
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {currentMessage.title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            {currentMessage.message}
          </p>

          {showTextInput && (
            <div className="mb-4">
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder='Ketik "RESET" untuk mengonfirmasi'
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium text-xs transition"
            >
              Batal
            </button>
            {showTextInput ? (
              <button
                onClick={handleFinalConfirm}
                disabled={!isTextInputValid}
                className={`flex-1 py-2 rounded-lg font-semibold text-xs transition shadow-sm ${
                  isTextInputValid
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Reset
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition shadow-sm"
              >
                Lanjutkan
              </button>
            )}
          </div>

          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={`w-2 h-2 rounded-full transition-colors ${
                  dot === currentStep
                    ? 'bg-rose-600'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetModal;
