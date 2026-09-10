import React from 'react';
import { useTreeContext } from '../context/TreeContext';

const ZoomControls = () => {
  const ctx = useTreeContext();

  return (
    <div className="zoom-controls interactive-btn absolute bottom-6 right-6 z-10 flex flex-col gap-2">
      <button
        onClick={ctx.centerTree}
        title="Pusatkan pohon"
        aria-label="Pusatkan pohon"
        className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center justify-center shadow-md"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
      <button
        onClick={() =>
          ctx.setTransform((prev) => ({
            ...prev,
            scale: Math.min(2.5, prev.scale * 1.2),
          }))
        }
        className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center justify-center shadow-md text-lg font-bold"
      >
        +
      </button>
      <button
        onClick={() =>
          ctx.setTransform((prev) => ({
            ...prev,
            scale: Math.max(0.2, prev.scale / 1.2),
          }))
        }
        className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center justify-center shadow-md text-lg font-bold"
      >
        -
      </button>
    </div>
  );
};

export default ZoomControls;
