import { useTreeContext } from '../context/TreeContext';
import AddUserIcon from './AddUserIcon';
import GenerationLanes from './GenerationLanes';
import SvgConnections from './SvgConnections';
import PersonCard from './PersonCard';
import LegendOverlay from './LegendOverlay';
import ZoomControls from './ZoomControls';
import { useCallback, useEffect, useRef } from 'react';

const TreeCanvas = () => {
  const ctx = useTreeContext();
  const isTreeEmpty = Object.keys(ctx.people).length === 0;
  const canvasRef = useRef(null);

  const handleWheelCanvas = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    ctx.setTransform(prev => ({
      ...prev,
      scale: Math.min(2.5, Math.max(0.2, prev.scale * zoomFactor)),
    }));
  }, [ctx]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    node.addEventListener('wheel', handleWheelCanvas, { passive: false });
    return () => node.removeEventListener('wheel', handleWheelCanvas);
  }, [handleWheelCanvas]);

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden select-none bg-slate-50"
      onMouseDown={ctx.handleMouseDownCanvas}
      onMouseMove={ctx.handleMouseMoveCanvas}
      onMouseUp={ctx.handleMouseUpCanvas}
      onMouseLeave={ctx.handleMouseUpCanvas}
      onTouchStart={ctx.handleTouchStartCanvas}
      onTouchMove={ctx.handleTouchMoveCanvas}
      onTouchEnd={ctx.handleTouchEndCanvas}
      onTouchCancel={ctx.handleTouchEndCanvas}
    >
      <LegendOverlay />
      <ZoomControls />

      {isTreeEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
           <div className="text-5xl mb-2">🌳</div>
           <h3 className="text-sm font-semibold text-slate-600">
             Belum ada anggota keluarga
           </h3>
             <button
               onClick={() => ctx.handleAddFirstPerson('Kepala Keluarga')}
               className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full overflow-hidden shadow-lg flex items-center justify-center w-12 h-12 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
               title="Tambah orang pertama"
             >
               <AddUserIcon size={48} />
             </button>
          <p className="text-[10px] text-slate-400 max-w-xs text-center">
            Klik tombol di atas untuk menambahkan anggota keluarga pertama
          </p>
        </div>
      ) : (
        <div
          className="absolute inset-0 origin-0 transition-transform duration-75"
          style={{
            transform: `translate(${ctx.transform.x}px, ${ctx.transform.y}px) scale(${ctx.transform.scale})`,
          }}
        >
          <svg className="absolute overflow-visible pointer-events-none top-0 left-0 w-full h-full">
            <GenerationLanes />
            <SvgConnections />
          </svg>

          {[...Object.values(ctx.people)]
            .sort((a, b) => String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0)
            .map((person) => {
            if (ctx.hiddenPersonIds.has(person.id)) return null;

            return <PersonCard key={person.id} person={person} />;
          })}
        </div>
      )}
    </div>
  );
};

export default TreeCanvas;
