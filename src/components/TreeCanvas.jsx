import { useCallback, useEffect, useRef } from 'react';
import { useTreeContext } from '../context/TreeContext';
import AddUserIcon from './AddUserIcon';
import GenerationLanes from './GenerationLanes';
import SvgConnections from './SvgConnections';
import PersonCard from './PersonCard';
import ZoomControls from './ZoomControls';
import { CARD_HEIGHT, CARD_WIDTH, X_GAP, Y_GAP } from '../utils/constants';

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

const TreeCanvas = () => {
  const ctx = useTreeContext();
  const {
    people,
    selectedId,
    selectedPerson,
    maxGeneration,
    layoutDirection,
    isHighlightEnabled,
    setIsHighlightEnabled,
    isMemberIndexOpen,
    setIsMemberIndexOpen,
  } = ctx;
  const isTreeEmpty = Object.keys(people).length === 0;
  const canvasRef = useRef(null);

  const handleWheelCanvas = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    ctx.setTransform((prev) => ({
      ...prev,
      scale: Math.min(2.5, Math.max(0.2, prev.scale * zoomFactor)),
    }));
  }, [ctx]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return undefined;
    node.addEventListener('wheel', handleWheelCanvas, { passive: false });
    return () => node.removeEventListener('wheel', handleWheelCanvas);
  }, [handleWheelCanvas]);

  const generationCount = Math.max(maxGeneration || 1, 1);
  const generationLabels = Array.from({ length: generationCount }, (_, index) => index + 1);

  return (
    <main
      ref={canvasRef}
      className="tree-stage relative min-h-0 flex-1 cursor-grab overflow-hidden select-none active:cursor-grabbing"
      onMouseDown={ctx.handleMouseDownCanvas}
      onMouseMove={ctx.handleMouseMoveCanvas}
      onMouseUp={ctx.handleMouseUpCanvas}
      onMouseLeave={ctx.handleMouseUpCanvas}
      onTouchStart={ctx.handleTouchStartCanvas}
      onTouchMove={ctx.handleTouchMoveCanvas}
      onTouchEnd={ctx.handleTouchEndCanvas}
      onTouchCancel={ctx.handleTouchEndCanvas}
      aria-label="Peta pohon keluarga"
    >
      {!isTreeEmpty && (
        <div className="tree-stage-topbar">
          <button
            type="button"
            className="mobile-member-index-launcher interactive-btn"
            onClick={() => setIsMemberIndexOpen(true)}
            aria-expanded={isMemberIndexOpen}
            aria-controls="member-index-panel"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-slate-500">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </Icon>
              <span className="truncate">Cari anggota keluarga...</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Daftar anggota</span>
          </button>

          {selectedPerson && (
            <div className="tree-focus-strip interactive-btn" role="status" aria-live="polite">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600" aria-hidden="true" />
                <strong className="truncate text-xs font-bold text-slate-800">
                  {selectedPerson.nickname || selectedPerson.name || 'Anggota'} dipilih
                </strong>
                <span className="hidden truncate text-[10px] text-slate-400 sm:inline">
                  Generasi {ctx.genMap?.[selectedId] || 1} · garis keluarga {isHighlightEnabled ? 'disorot' : 'normal'}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="focus-strip-button interactive-btn"
                  onClick={ctx.centerTree}
                  aria-label="Pusatkan anggota terpilih"
                >
                  <Icon className="h-3.5 w-3.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </Icon>
                  <span>Pusatkan</span>
                </button>
                <label className="focus-strip-toggle interactive-btn">
                  <span>Sorot garis keluarga</span>
                  <input
                    type="checkbox"
                    checked={isHighlightEnabled}
                    onChange={(event) => setIsHighlightEnabled(event.target.checked)}
                    aria-label="Sorot garis keluarga"
                  />
                  <span className="toggle-track" aria-hidden="true">
                    <span className="toggle-thumb" />
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {isTreeEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-5xl">🌳</div>
          <h2 className="text-sm font-semibold text-slate-600">Belum ada anggota keluarga</h2>
          <button
            type="button"
            onClick={() => ctx.handleAddFirstPerson('Kepala Keluarga')}
            className="interactive-btn flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            title="Tambah orang pertama"
            aria-label="Tambah orang pertama"
          >
            <AddUserIcon size={48} />
          </button>
          <p className="max-w-xs text-center text-[10px] text-slate-400">
            Klik tombol di atas untuk menambahkan anggota keluarga pertama
          </p>
        </div>
      ) : (
        <>
          <div
            className={`tree-world tree-world-${layoutDirection} absolute inset-0 origin-0 transition-transform duration-75`}
            style={{
              transform: `translate(${ctx.transform.x}px, ${ctx.transform.y}px) scale(${ctx.transform.scale})`,
            }}
          >
            <svg className="absolute left-0 top-0 h-full w-full overflow-visible pointer-events-none">
              <GenerationLanes />
              <SvgConnections />
            </svg>

            <div className="generation-labels" aria-hidden="true">
              {generationLabels.map((generation) => (
                <span
                  key={`generation-label-${generation}`}
                  className="generation-label"
                  style={
                    layoutDirection === 'vertical'
                      ? { top: 80 + (generation - 1) * (CARD_HEIGHT + Y_GAP) - 22 }
                      : { left: 80 + (generation - 1) * (CARD_WIDTH + X_GAP) - 10 }
                  }
                >
                  Generasi {generation}
                </span>
              ))}
            </div>

            {[...Object.values(people)]
              .sort((a, b) =>
                String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0
              )
              .map((person) => {
                if (ctx.hiddenPersonIds.has(person.id)) return null;
                return <PersonCard key={person.id} person={person} />;
              })}
          </div>

          <div className="tree-legend" aria-label="Legenda pohon keluarga">
            <span className="tree-legend-item">
              <span className="tree-legend-dot tree-legend-dot-male" aria-hidden="true" />
              Pria
            </span>
            <span className="tree-legend-item">
              <span className="tree-legend-dot tree-legend-dot-female" aria-hidden="true" />
              Wanita
            </span>
            <span className="tree-legend-divider" aria-hidden="true" />
            <span className="hidden text-[10px] text-slate-400 sm:inline">− / + untuk melipat cabang</span>
          </div>
        </>
      )}

      <ZoomControls />
    </main>
  );
};

export default TreeCanvas;
