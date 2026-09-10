import React from 'react';
import { useTreeContext } from '../context/TreeContext';

const LegendOverlay = () => {
  const ctx = useTreeContext();

  return (
    <div className="legend-overlay absolute top-4 left-4 z-10 bg-white/90 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-slate-700 flex items-center gap-4 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
        Pria
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
        Wanita
      </div>
      <div className="h-3 w-px bg-slate-200"></div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <span className="text-xs font-semibold text-slate-700">
          Sorot Jalur:
        </span>
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            checked={ctx.isHighlightEnabled}
            onChange={(e) => ctx.setIsHighlightEnabled(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-9 h-5 rounded-full border transition-colors duration-200 ${
              ctx.isHighlightEnabled
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-slate-300 border-slate-400'
            }`}
          ></div>
          <div
            className={`absolute left-0.5 w-4 h-4 rounded-full bg-white shadow-md border border-slate-200 transition-transform duration-200 ${
              ctx.isHighlightEnabled ? 'transform translate-x-4' : ''
            }`}
          ></div>
        </div>
      </label>

      <div className="h-3 w-px bg-slate-200"></div>
      <div className="text-[11px] text-slate-500 italic">
        Klik{' '}
        <span className="text-pink-600 font-bold px-1 rounded bg-slate-100">
          − / +
        </span>{' '}
        untuk lipat cabang
      </div>
    </div>
  );
};

export default LegendOverlay;
