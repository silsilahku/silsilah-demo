export const calculateGenerations = (currentPeople, currentUnions) => {
  // Build child -> parents map from unions.
  const childToParentsMap = {};
  const partnerMap = {};

  Object.values(currentUnions).forEach(u => {
    (u.childrenIds || []).forEach(cId => {
      if (!childToParentsMap[cId]) childToParentsMap[cId] = [];
      if (u.partner1Id) childToParentsMap[cId].push(u.partner1Id);
      if (u.partner2Id) childToParentsMap[cId].push(u.partner2Id);
    });
    if (u.partner1Id && u.partner2Id) {
      if (!partnerMap[u.partner1Id]) partnerMap[u.partner1Id] = new Set();
      if (!partnerMap[u.partner2Id]) partnerMap[u.partner2Id] = new Set();
      partnerMap[u.partner1Id].add(u.partner2Id);
      partnerMap[u.partner2Id].add(u.partner1Id);
    }
  });

  // Initialize everyone at generation 1 (roots / married-in spouses).
  const genMap = {};
  Object.keys(currentPeople).forEach(pId => {
    genMap[pId] = 1;
  });

  // Fixpoint relaxation: order-independent and deterministic, so the result
  // is identical whether data comes from in-memory state or a fresh DB load.
  // Rules (values only ever increase, so this converges):
  //   1. A person is at least one generation below their parents.
  //   2. Spouses are aligned to the HIGHEST of the two generations, so a
  //      married-in spouse (gen 1 by descent) is raised to the blood-line
  //      member's lane instead of dragging the family branch down (the old
  //      Math.min behavior that caused the Gen 3 -> Gen 1 regression).
  const personIds = Object.keys(currentPeople);
  const maxIterations = personIds.length + 2;
  for (let i = 0; i < maxIterations; i++) {
    let changed = false;

    // Rule 1: children sit below parents.
    personIds.forEach(pId => {
      const parents = childToParentsMap[pId] || [];
      parents.forEach(parId => {
        if (genMap[parId] === undefined) return;
        const candidate = genMap[parId] + 1;
        if (candidate > genMap[pId]) {
          genMap[pId] = candidate;
          changed = true;
        }
      });
    });

    // Rule 2: align couples to the max of the two partners.
    personIds.forEach(pId => {
      const partners = partnerMap[pId];
      if (!partners) return;
      partners.forEach(spId => {
        if (genMap[spId] === undefined) return;
        if (genMap[spId] > genMap[pId]) {
          genMap[pId] = genMap[spId];
          changed = true;
        }
      });
    });

    if (!changed) break;
  }

  return genMap;
};
