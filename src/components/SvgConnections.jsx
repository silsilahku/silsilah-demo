import React from 'react';
import { useTreeContext } from '../context/TreeContext';
import { CARD_WIDTH, CARD_HEIGHT } from '../utils/constants';
import { UNION_COLORS } from '../utils/constants';

const SvgConnections = ({ staticMode = false }) => {
  const ctx = useTreeContext();
  const {
    people,
    unions,
    hoveredUnionId,
    collapsedUnions,
    hiddenPersonIds,
    activeLineageIds,
    layoutDirection,
    toggleCollapseUnion,
    setHoveredUnionId,
  } = ctx;

  const paths = [];
  const isVert = layoutDirection === 'vertical';

  // Deterministic union order: keeps line colors and SVG draw order stable
  // across refreshes (DB SELECT has no guaranteed row order).
  const unionList = Object.values(unions).sort((a, b) =>
    String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0
  );

  const personUnionsMap = {};
  unionList.forEach((u) => {
    if (u.partner1Id) {
      if (!personUnionsMap[u.partner1Id]) personUnionsMap[u.partner1Id] = [];
      personUnionsMap[u.partner1Id].push(u);
    }
    if (u.partner2Id) {
      if (!personUnionsMap[u.partner2Id]) personUnionsMap[u.partner2Id] = [];
      personUnionsMap[u.partner2Id].push(u);
    }
  });

  unionList.forEach((u, unionIdx) => {
    const p1 = people[u.partner1Id];
    const p2 = people[u.partner2Id];
    const unionColor = UNION_COLORS[unionIdx % UNION_COLORS.length];
    const isHovered = !staticMode && hoveredUnionId === u.id;
    const isCollapsed = !staticMode && collapsedUnions.has(u.id);

    const isDimmed =
      !staticMode && activeLineageIds &&
      !activeLineageIds.has(u.partner1Id) &&
      !activeLineageIds.has(u.partner2Id);

    const validChildren = (u.childrenIds || []).filter(
      (cId) => people[cId] && (staticMode || !hiddenPersonIds.has(cId))
    );
    const hasValidChildren = validChildren.length > 0;

    if (!isVert) {
      // HORIZONTAL ROUTING
      let minChildY = Infinity;
      let maxChildY = -Infinity;
      validChildren.forEach((cId) => {
        const c = people[cId];
        const cy = c.y + CARD_HEIGHT / 2;
        if (cy < minChildY) minChildY = cy;
        if (cy > maxChildY) maxChildY = cy;
      });
      const childrenCenterY = hasValidChildren
        ? (minChildY + maxChildY) / 2
        : null;

      let unionX,
        unionY,
        p1AnchorY = p1 ? p1.y + CARD_HEIGHT / 2 : 0;
      let p2AnchorY = p2 ? p2.y + CARD_HEIGHT / 2 : 0;

      if (p1 && p2) {
        const uList1 = personUnionsMap[p1.id] || [];
        const uList2 = personUnionsMap[p2.id] || [];
        const idx1 = uList1.findIndex((x) => x.id === u.id);
        const idx2 = uList2.findIndex((x) => x.id === u.id);

        if (uList1.length > 1) {
          p1AnchorY = p1.y + (CARD_HEIGHT * (idx1 + 1)) / (uList1.length + 1);
        }
        if (uList2.length > 1) {
          p2AnchorY = p2.y + (CARD_HEIGHT * (idx2 + 1)) / (uList2.length + 1);
        }

        const spouseTier = Math.max(idx1 >= 0 ? idx1 : 0, idx2 >= 0 ? idx2 : 0);
        const tierOffset = 40 + spouseTier * 35;

        unionX = Math.max(p1.x + CARD_WIDTH, p2.x + CARD_WIDTH) + tierOffset;
        unionY =
          childrenCenterY !== null
            ? childrenCenterY
            : (p1AnchorY + p2AnchorY) / 2;

        const minV = Math.min(p1AnchorY, p2AnchorY, unionY);
        const maxV = Math.max(p1AnchorY, p2AnchorY, unionY);

        const partnerPathD = `M ${p1.x + CARD_WIDTH} ${p1AnchorY} H ${unionX} M ${p2.x + CARD_WIDTH} ${p2AnchorY} H ${unionX} M ${unionX} ${minV} V ${maxV}`;

        paths.push(
          <g
            key={`union-line-${u.id}`}
style={{ opacity: isDimmed ? 'var(--tree-line-dim-opacity)' : 1, transition: 'opacity 0.3s' }}
          >
            <path
              d={partnerPathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth={isHovered ? '8' : '6'}
              strokeLinecap="round"
            />
            <path
              d={partnerPathD}
              fill="none"
              stroke={unionColor}
              strokeWidth={isHovered ? '3.5' : '2.5'}
              strokeDasharray="5,4"
            />
          </g>
        );
      } else if (p1 || p2) {
        const existingP = p1 || p2;
        const uList = personUnionsMap[existingP.id] || [];
        const idx = uList.findIndex((x) => x.id === u.id);
        const anchorY = existingP.y + CARD_HEIGHT / 2;

        unionX = existingP.x + CARD_WIDTH + 40 + (idx > 0 ? idx * 35 : 0);
        unionY = childrenCenterY !== null ? childrenCenterY : anchorY;

        const singlePartnerPathD = `M ${existingP.x + CARD_WIDTH} ${anchorY} H ${unionX} V ${unionY}`;
        paths.push(
          <g
            key={`union-line-${u.id}`}
style={{ opacity: isDimmed ? 'var(--tree-line-dim-opacity)' : 1, transition: 'opacity 0.3s' }}
          >
            <path
              d={singlePartnerPathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={singlePartnerPathD}
              fill="none"
              stroke={unionColor}
              strokeWidth="2.5"
              strokeDasharray="5,4"
            />
          </g>
        );
      } else {
        return;
      }

      if (!isCollapsed && hasValidChildren) {
        const midX = unionX + 40;
        const trunkPathD = `M ${unionX} ${unionY} H ${midX} M ${midX} ${minChildY} V ${maxChildY}`;

        paths.push(
          <g
            key={`children-trunk-${u.id}`}
style={{ opacity: isDimmed ? 'var(--tree-child-line-dim-opacity)' : 1, transition: 'opacity 0.3s' }}
          >
            <path
              d={trunkPathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={trunkPathD}
              fill="none"
              stroke={unionColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        );

        validChildren.forEach((cId) => {
          const child = people[cId];
          const childY = child.y + CARD_HEIGHT / 2;
          const branchPathD = `M ${midX} ${childY} H ${child.x}`;
          const childDimmed =
            activeLineageIds && !activeLineageIds.has(cId);

          paths.push(
            <g
              key={`child-branch-${u.id}-${cId}`}
              style={{
opacity: childDimmed ? 'var(--tree-child-line-dim-opacity)' : 1,
                transition: 'opacity 0.3s',
              }}
            >
              <path
                d={branchPathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d={branchPathD}
                fill="none"
                stroke={unionColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          );
        });
      }

      paths.push(
        <g
          key={`union-badge-${u.id}`}
          transform={`translate(${unionX - 14}, ${unionY - 14})`}
          className="cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapseUnion(u.id);
          }}
          onMouseEnter={() => setHoveredUnionId(u.id)}
          onMouseLeave={() => setHoveredUnionId(null)}
        >
          <circle
            cx="14"
            cy="14"
            r={isHovered ? '16' : '14'}
            fill="#ffffff"
            stroke={unionColor}
            strokeWidth="3"
            className="shadow-md transition-all duration-200"
          />
          {u.childrenIds && u.childrenIds.length > 0 ? (
            <text
              x="14"
              y="19"
              textAnchor="middle"
              fill={unionColor}
              fontSize="16"
              fontWeight="bold"
              className="select-none"
            >
              {isCollapsed ? '+' : '−'}
            </text>
          ) : (
            <path
              d="M10 14.5l-1.05-.95C5.2 10.1 2.5 7.65 2.5 4.65 2.5 2.2 4.4 0.25 6.85 0.25c1.39 0 2.72.65 3.55 1.68C11.23.9 12.56.25 13.95.25c2.45 0 4.35 1.95 4.35 4.4 0 3-2.7 5.45-6.45 8.9L10 14.5z"
              fill={unionColor}
              transform="scale(0.8) translate(5, 5)"
            />
          )}
        </g>
      );
    } else {
      // VERTICAL ROUTING
      let minChildX = Infinity;
      let maxChildX = -Infinity;
      validChildren.forEach((cId) => {
        const c = people[cId];
        const cx = c.x + CARD_WIDTH / 2;
        if (cx < minChildX) minChildX = cx;
        if (cx > maxChildX) maxChildX = cx;
      });
      const childrenCenterX = hasValidChildren
        ? (minChildX + maxChildX) / 2
        : null;

      let unionX,
        unionY,
        p1AnchorX = p1 ? p1.x + CARD_WIDTH / 2 : 0;
      let p2AnchorX = p2 ? p2.x + CARD_WIDTH / 2 : 0;

      if (p1 && p2) {
        const uList1 = personUnionsMap[p1.id] || [];
        const uList2 = personUnionsMap[p2.id] || [];
        const idx1 = uList1.findIndex((x) => x.id === u.id);
        const idx2 = uList2.findIndex((x) => x.id === u.id);

        if (uList1.length > 1) {
          p1AnchorX = p1.x + (CARD_WIDTH * (idx1 + 1)) / (uList1.length + 1);
        }
        if (uList2.length > 1) {
          p2AnchorX = p2.x + (CARD_WIDTH * (idx2 + 1)) / (uList2.length + 1);
        }

        const spouseTier = Math.max(idx1 >= 0 ? idx1 : 0, idx2 >= 0 ? idx2 : 0);
        const tierOffset = 30 + spouseTier * 25;

        unionY = Math.max(p1.y + CARD_HEIGHT, p2.y + CARD_HEIGHT) + tierOffset;
        unionX =
          childrenCenterX !== null ? childrenCenterX : (p1AnchorX + p2AnchorX) / 2;

        const minH = Math.min(p1AnchorX, p2AnchorX, unionX);
        const maxH = Math.max(p1AnchorX, p2AnchorX, unionX);

        const partnerPathD = `M ${p1AnchorX} ${p1.y + CARD_HEIGHT} V ${unionY} M ${p2AnchorX} ${p2.y + CARD_HEIGHT} V ${unionY} M ${minH} ${unionY} H ${maxH}`;

        paths.push(
          <g
            key={`union-line-${u.id}`}
style={{ opacity: isDimmed ? 'var(--tree-line-dim-opacity)' : 1, transition: 'opacity 0.3s' }}
          >
            <path
              d={partnerPathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth={isHovered ? '8' : '6'}
              strokeLinecap="round"
            />
            <path
              d={partnerPathD}
              fill="none"
              stroke={unionColor}
              strokeWidth={isHovered ? '3.5' : '2.5'}
              strokeDasharray="5,4"
            />
          </g>
        );
      } else if (p1 || p2) {
        const existingP = p1 || p2;
        const uList = personUnionsMap[existingP.id] || [];
        const idx = uList.findIndex((x) => x.id === u.id);
        const anchorX = existingP.x + CARD_WIDTH / 2;

        unionY = existingP.y + CARD_HEIGHT + 30 + (idx > 0 ? idx * 25 : 0);
        unionX = childrenCenterX !== null ? childrenCenterX : anchorX;

        const singlePartnerPathD = `M ${anchorX} ${existingP.y + CARD_HEIGHT} V ${unionY} H ${unionX}`;
        paths.push(
          <g
            key={`union-line-${u.id}`}
style={{ opacity: isDimmed ? 'var(--tree-line-dim-opacity)' : 1, transition: 'opacity 0.3s' }}
          >
            <path
              d={singlePartnerPathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={singlePartnerPathD}
              fill="none"
              stroke={unionColor}
              strokeWidth="2.5"
              strokeDasharray="5,4"
            />
          </g>
        );
      } else {
        return;
      }

      if (!isCollapsed && hasValidChildren) {
        const midY = unionY + 30;
        const trunkPathD = `M ${unionX} ${unionY} V ${midY} M ${minChildX} ${midY} H ${maxChildX}`;

        paths.push(
          <g
            key={`children-trunk-${u.id}`}
style={{ opacity: isDimmed ? 'var(--tree-child-line-dim-opacity)' : 1, transition: 'opacity 0.3s' }}
          >
            <path
              d={trunkPathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={trunkPathD}
              fill="none"
              stroke={unionColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        );

        validChildren.forEach((cId) => {
          const child = people[cId];
          const childX = child.x + CARD_WIDTH / 2;
          const branchPathD = `M ${childX} ${midY} V ${child.y}`;
          const childDimmed =
            activeLineageIds && !activeLineageIds.has(cId);

          paths.push(
            <g
              key={`child-branch-${u.id}-${cId}`}
              style={{
opacity: childDimmed ? 'var(--tree-child-line-dim-opacity)' : 1,
                transition: 'opacity 0.3s',
              }}
            >
              <path
                d={branchPathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d={branchPathD}
                fill="none"
                stroke={unionColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          );
        });
      }

      paths.push(
        <g
          key={`union-badge-${u.id}`}
          transform={`translate(${unionX - 14}, ${unionY - 14})`}
          className="cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapseUnion(u.id);
          }}
          onMouseEnter={() => setHoveredUnionId(u.id)}
          onMouseLeave={() => setHoveredUnionId(null)}
        >
          <circle
            cx="14"
            cy="14"
            r={isHovered ? '16' : '14'}
            fill="#ffffff"
            stroke={unionColor}
            strokeWidth="3"
            className="shadow-md transition-all duration-200"
          />
          {u.childrenIds && u.childrenIds.length > 0 ? (
            <text
              x="14"
              y="19"
              textAnchor="middle"
              fill={unionColor}
              fontSize="16"
              fontWeight="bold"
              className="select-none"
            >
              {isCollapsed ? '+' : '−'}
            </text>
          ) : (
            <path
              d="M10 14.5l-1.05-.95C5.2 10.1 2.5 7.65 2.5 4.65 2.5 2.2 4.4 0.25 6.85 0.25c1.39 0 2.72.65 3.55 1.68C11.23.9 12.56.25 13.95.25c2.45 0 4.35 1.95 4.35 4.4 0 3-2.7 5.45-6.45 8.9L10 14.5z"
              fill={unionColor}
              transform="scale(0.8) translate(5, 5)"
            />
          )}
        </g>
      );
    }
  });

  return <>{paths}</>;
};

export default SvgConnections;
