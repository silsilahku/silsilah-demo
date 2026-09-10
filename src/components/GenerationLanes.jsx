import React from 'react';
import { useTreeContext } from '../context/TreeContext';
import { CARD_WIDTH, CARD_HEIGHT, X_GAP, Y_GAP } from '../utils/constants';

const GenerationLanes = () => {
  const { maxGeneration, layoutDirection } = useTreeContext();
  const lanes = [];
  const isVert = layoutDirection === 'vertical';

  for (let g = 1; g <= Math.max(maxGeneration + 1, 3); g++) {
    if (!isVert) {
      const xPos = 80 + (g - 1) * (CARD_WIDTH + X_GAP);
      lanes.push(
        <g key={`gen-lane-${g}`} className="pointer-events-none">
          <rect
            x={xPos - 30}
            y={-2000}
            width={CARD_WIDTH + 60}
            height={6000}
            fill={g % 2 === 0 ? 'rgba(226, 232, 240, 0.35)' : 'transparent'}
            rx="16"
          />
        </g>
      );
    } else {
      const yPos = 80 + (g - 1) * (CARD_HEIGHT + Y_GAP);
      lanes.push(
        <g key={`gen-lane-${g}`} className="pointer-events-none">
          <rect
            x={-2000}
            y={yPos - 25}
            width={6000}
            height={CARD_HEIGHT + 50}
            fill={g % 2 === 0 ? 'rgba(226, 232, 240, 0.35)' : 'transparent'}
            rx="16"
          />
        </g>
      );
    }
  }

  return <>{lanes}</>;
};

export default GenerationLanes;
