import {
  CARD_WIDTH, CARD_HEIGHT, X_GAP, Y_GAP, MIN_GAP_CROSS
} from './constants';
import { sortChildrenByBirthDate } from './child-sort';

export const autoArrangeTree = (currentPeople, currentUnions, direction = 'horizontal') => {
  const isVert = direction === 'vertical';

  // Deterministic iteration order: DB SELECT results have no guaranteed row
  // order, so after a refresh the object key order differs from the in-memory
  // insertion order. Sorting by id makes the arrangement identical whether the
  // data comes from React state or a fresh database load.
  const personIds = Object.keys(currentPeople).sort();
  const unionList = Object.values(currentUnions).sort((a, b) =>
    String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0
  );

  const childToUnionMap = {};
  unionList.forEach(u => {
    (u.childrenIds || []).forEach(cId => {
      childToUnionMap[cId] = u.id;
    });
  });

  const getPersonUnions = (pId) =>
    unionList.filter(
      u => u.partner1Id === pId || u.partner2Id === pId
    );

  const rootIds = [];
  personIds.forEach(pId => {
    if (!childToUnionMap[pId]) {
      const unions = getPersonUnions(pId);
      const isSpouseOfRoot = unions.some(u => {
        const spouseId = u.partner1Id === pId ? u.partner2Id : u.partner1Id;
        return spouseId && rootIds.includes(spouseId);
      });
      if (!isSpouseOfRoot && !rootIds.includes(pId)) {
        rootIds.push(pId);
      }
    }
  });

  const updatedPeople = { ...currentPeople };
  let mainCursor = 60;
  const globalVisited = new Set();

  if (!isVert) {
    // HORIZONTAL LAYOUT
    const layoutPersonSubtreeHoriz = (personId, startX, startY) => {
      if (globalVisited.has(personId))
        return { minY: startY, maxY: startY + CARD_HEIGHT, nextY: startY + CARD_HEIGHT + MIN_GAP_CROSS };
      globalVisited.add(personId);

      const personUnions = getPersonUnions(personId);

      if (personUnions.length === 0) {
        updatedPeople[personId] = { ...updatedPeople[personId], x: startX, y: startY };
        return { minY: startY, maxY: startY + CARD_HEIGHT, nextY: startY + CARD_HEIGHT + MIN_GAP_CROSS };
      }

      let unionYCursor = startY;
      const unionLayouts = [];

      personUnions.forEach(u => {
        const spouseId = u.partner1Id === personId ? u.partner2Id : u.partner1Id;
        const validChildren = sortChildrenByBirthDate(
          (u.childrenIds || []).filter(cId => updatedPeople[cId]),
          updatedPeople
        );

        const uStartY = unionYCursor;
        let childYCursor = unionYCursor;
        let childrenMinY = Infinity;
        let childrenMaxY = -Infinity;

        validChildren.forEach(cId => {
          const childRes = layoutPersonSubtreeHoriz(cId, startX + CARD_WIDTH + X_GAP, childYCursor);
          childrenMinY = Math.min(childrenMinY, childRes.minY);
          childrenMaxY = Math.max(childrenMaxY, childRes.maxY);
          childYCursor = childRes.nextY;
        });

        const hasChildren = validChildren.length > 0;
        const childrenMidY = hasChildren
          ? (childrenMinY + childrenMaxY) / 2
          : (uStartY + CARD_HEIGHT / 2);

        const spouseCount = (u.partner1Id && u.partner2Id) ? 1 : 0;
        const coupleH = (spouseCount + 1) * CARD_HEIGHT + spouseCount * MIN_GAP_CROSS;
        const unionH = Math.max(coupleH + MIN_GAP_CROSS, childYCursor - uStartY);

        unionLayouts.push({
          union: u, spouseId, childrenMinY, childrenMaxY, childrenMidY,
          hasChildren, startY: uStartY, endY: uStartY + unionH
        });

        unionYCursor += unionH;
      });

      let overallMinY = Infinity;
      let overallMaxY = -Infinity;

      unionLayouts.forEach(info => {
        const spouseId = info.spouseId;
        if (spouseId && updatedPeople[spouseId] && !globalVisited.has(spouseId)) {
          globalVisited.add(spouseId);
          const spouseY = info.childrenMidY - CARD_HEIGHT / 2;
          updatedPeople[spouseId] = { ...updatedPeople[spouseId], x: startX, y: spouseY };
          overallMinY = Math.min(overallMinY, spouseY);
          overallMaxY = Math.max(overallMaxY, spouseY + CARD_HEIGHT);
        }
        if (info.hasChildren) {
          overallMinY = Math.min(overallMinY, info.childrenMinY);
          overallMaxY = Math.max(overallMaxY, info.childrenMaxY);
        }
      });

      const allMidYs = unionLayouts.map(i => i.childrenMidY);
      const avgMidY = allMidYs.reduce((a, b) => a + b, 0) / allMidYs.length;
      const primaryY = avgMidY - CARD_HEIGHT / 2;

      updatedPeople[personId] = { ...updatedPeople[personId], x: startX, y: primaryY };

      overallMinY = Math.min(overallMinY, primaryY);
      overallMaxY = Math.max(overallMaxY, primaryY + CARD_HEIGHT);

      const columnCards = [{ id: personId, y: primaryY }];
      unionLayouts.forEach(info => {
        if (info.spouseId && updatedPeople[info.spouseId]) {
          columnCards.push({ id: info.spouseId, y: updatedPeople[info.spouseId].y });
        }
      });

      columnCards.sort((a, b) => a.y - b.y);
      for (let i = 0; i < columnCards.length - 1; i++) {
        if (columnCards[i + 1].y < columnCards[i].y + CARD_HEIGHT + MIN_GAP_CROSS) {
          const shift = (columnCards[i].y + CARD_HEIGHT + MIN_GAP_CROSS) - columnCards[i + 1].y;
          columnCards[i + 1].y += shift;
        }
      }

      columnCards.forEach(c => {
        updatedPeople[c.id].y = c.y;
        overallMinY = Math.min(overallMinY, c.y);
        overallMaxY = Math.max(overallMaxY, c.y + CARD_HEIGHT);
      });

      return {
        minY: overallMinY,
        maxY: overallMaxY,
        nextY: Math.max(unionYCursor, overallMaxY + MIN_GAP_CROSS)
      };
    };

    rootIds.forEach(rId => {
      const res = layoutPersonSubtreeHoriz(rId, 80, mainCursor);
      mainCursor = res.nextY;
    });

  } else {
    // VERTICAL LAYOUT
    const layoutPersonSubtreeVert = (personId, startX, startY) => {
      if (globalVisited.has(personId))
        return { minX: startX, maxX: startX + CARD_WIDTH, nextX: startX + CARD_WIDTH + MIN_GAP_CROSS };
      globalVisited.add(personId);

      const personUnions = getPersonUnions(personId);

      if (personUnions.length === 0) {
        updatedPeople[personId] = { ...updatedPeople[personId], x: startX, y: startY };
        return { minX: startX, maxX: startX + CARD_WIDTH, nextX: startX + CARD_WIDTH + MIN_GAP_CROSS };
      }

      let unionXCursor = startX;
      const unionLayouts = [];

      personUnions.forEach(u => {
        const spouseId = u.partner1Id === personId ? u.partner2Id : u.partner1Id;
        const validChildren = sortChildrenByBirthDate(
          (u.childrenIds || []).filter(cId => updatedPeople[cId]),
          updatedPeople
        );

        const uStartX = unionXCursor;
        let childXCursor = unionXCursor;
        let childrenMinX = Infinity;
        let childrenMaxX = -Infinity;

        validChildren.forEach(cId => {
          const childRes = layoutPersonSubtreeVert(cId, childXCursor, startY + CARD_HEIGHT + Y_GAP);
          childrenMinX = Math.min(childrenMinX, childRes.minX);
          childrenMaxX = Math.max(childrenMaxX, childRes.maxX);
          childXCursor = childRes.nextX;
        });

        const hasChildren = validChildren.length > 0;
        const childrenMidX = hasChildren
          ? (childrenMinX + childrenMaxX) / 2
          : (uStartX + CARD_WIDTH / 2);

        const spouseCount = (u.partner1Id && u.partner2Id) ? 1 : 0;
        const coupleW = (spouseCount + 1) * CARD_WIDTH + spouseCount * MIN_GAP_CROSS;
        // Reserve room for the union badge (drawn 40px right of the couple,
        // 28px wide). Without the extra 34px the badge spills into the next
        // sibling subtree and is covered by its cards, making the spouse line
        // look disconnected (cards render above the SVG).
        const unionW = Math.max(coupleW + MIN_GAP_CROSS + 34, childXCursor - uStartX);

        unionLayouts.push({
          union: u, spouseId, childrenMinX, childrenMaxX, childrenMidX,
          hasChildren, startX: uStartX, endX: uStartX + unionW
        });

        unionXCursor += unionW;
      });

      let overallMinX = Infinity;
      let overallMaxX = -Infinity;

      unionLayouts.forEach(info => {
        const spouseId = info.spouseId;
        if (spouseId && updatedPeople[spouseId] && !globalVisited.has(spouseId)) {
          globalVisited.add(spouseId);
          const spouseX = info.childrenMidX - CARD_WIDTH / 2;
          updatedPeople[spouseId] = { ...updatedPeople[spouseId], x: spouseX, y: startY };
          overallMinX = Math.min(overallMinX, spouseX);
          overallMaxX = Math.max(overallMaxX, spouseX + CARD_WIDTH);
        }
        if (info.hasChildren) {
          overallMinX = Math.min(overallMinX, info.childrenMinX);
          overallMaxX = Math.max(overallMaxX, info.childrenMaxX);
        }
      });

      const allMidXs = unionLayouts.map(i => i.childrenMidX);
      const avgMidX = allMidXs.reduce((a, b) => a + b, 0) / allMidXs.length;
      const primaryX = avgMidX - CARD_WIDTH / 2;

      updatedPeople[personId] = { ...updatedPeople[personId], x: primaryX, y: startY };

      overallMinX = Math.min(overallMinX, primaryX);
      overallMaxX = Math.max(overallMaxX, primaryX + CARD_WIDTH);

      const rowCards = [{ id: personId, x: primaryX }];
      unionLayouts.forEach(info => {
        if (info.spouseId && updatedPeople[info.spouseId]) {
          rowCards.push({ id: info.spouseId, x: updatedPeople[info.spouseId].x });
        }
      });

      rowCards.sort((a, b) => a.x - b.x);
      for (let i = 0; i < rowCards.length - 1; i++) {
        if (rowCards[i + 1].x < rowCards[i].x + CARD_WIDTH + MIN_GAP_CROSS) {
          const shift = (rowCards[i].x + CARD_WIDTH + MIN_GAP_CROSS) - rowCards[i + 1].x;
          rowCards[i + 1].x += shift;
        }
      }

      rowCards.forEach(c => {
        updatedPeople[c.id].x = c.x;
        overallMinX = Math.min(overallMinX, c.x);
        overallMaxX = Math.max(overallMaxX, c.x + CARD_WIDTH);
      });

      return {
        minX: overallMinX,
        maxX: overallMaxX,
        nextX: Math.max(unionXCursor, overallMaxX + MIN_GAP_CROSS)
      };
    };

    rootIds.forEach(rId => {
      const res = layoutPersonSubtreeVert(rId, mainCursor, 80);
      mainCursor = res.nextX;
    });
  }

  return updatedPeople;
};
