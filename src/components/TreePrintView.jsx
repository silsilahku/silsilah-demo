import { useTreeContext } from '../context/TreeContext';
import SvgConnections from './SvgConnections';
import PrintPersonCard from './PrintPersonCard';
import { getPrintableBounds, getPrintableOffset } from '../utils/print-layout';

const TreePrintView = ({ title, printRef }) => {
  const ctx = useTreeContext();
  const { people } = ctx;
  const peopleList = Object.values(people);
  const bounds = getPrintableBounds(people);
  const offset = getPrintableOffset(bounds);

  if (peopleList.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        Belum ada data pohon keluarga untuk ditampilkan.
      </div>
    );
  }

  return (
    <div ref={printRef} className="print-tree bg-white" data-people={JSON.stringify(people)}>
      {title && <h2 className="text-lg font-bold text-slate-800 mb-4">{title}</h2>}
      <div
        className="relative bg-white"
        style={{ width: bounds.width, height: bounds.height }}
      >
        <svg
          className="absolute overflow-visible pointer-events-none top-0 left-0"
          style={{ width: '100%', height: '100%' }}
        >
          <g transform={`translate(${offset.x} ${offset.y})`}>
            <SvgConnections staticMode />
          </g>
        </svg>
        {peopleList.map((person) => (
          <PrintPersonCard
            key={person.id}
            person={person}
            offset={offset}
          />
        ))}
      </div>
    </div>
  );
};

export default TreePrintView;
