export const calculateGenerations = (currentPeople, currentUnions) => {
  // Build maps
  const childToParentsMap = {};
  const parentToChildrenMap = {};
  const partnerMap = {};

  Object.values(currentUnions).forEach(u => {
    const children = u.childrenIds || [];
    children.forEach(cId => {
      if (!childToParentsMap[cId]) childToParentsMap[cId] = [];
      if (u.partner1Id) childToParentsMap[cId].push(u.partner1Id);
      if (u.partner2Id) childToParentsMap[cId].push(u.partner2Id);

      if (u.partner1Id) {
        if (!parentToChildrenMap[u.partner1Id]) parentToChildrenMap[u.partner1Id] = new Set();
        parentToChildrenMap[u.partner1Id].add(cId);
      }
      if (u.partner2Id) {
        if (!parentToChildrenMap[u.partner2Id]) parentToChildrenMap[u.partner2Id] = new Set();
        parentToChildrenMap[u.partner2Id].add(cId);
      }
    });
    if (u.partner1Id && u.partner2Id) {
      if (!partnerMap[u.partner1Id]) partnerMap[u.partner1Id] = new Set();
      if (!partnerMap[u.partner2Id]) partnerMap[u.partner2Id] = new Set();
      partnerMap[u.partner1Id].add(u.partner2Id);
      partnerMap[u.partner2Id].add(u.partner1Id);
    }
  });

  const genMap = {};
  const personIds = Object.keys(currentPeople || {});

  // Initialize everyone to gen 1
  personIds.forEach(pId => {
    genMap[pId] = 1;
  });

  // Find roots (no parents) - these are the top level
  const roots = personIds.filter(pId => {
    const parents = childToParentsMap[pId];
    return !parents || parents.length === 0;
  });
  // BFS from roots to propagate down
  const queue = [];
  const visited = new Set();
  roots.forEach(r => {
    genMap[r] = 1;
    if (!visited.has(r)) {
      visited.add(r);
      queue.push(r);
    }
  });

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentGen = genMap[current] || 1;

    // Process children
    const childrenSet = parentToChildrenMap[current];
    if (childrenSet) {
      childrenSet.forEach(cId => {
        if (genMap[cId] === undefined) genMap[cId] = 1;
        const candidateGen = currentGen + 1;
        if (candidateGen > genMap[cId]) {
          genMap[cId] = candidateGen;
        }
        // Align spouse of child to child's generation
        const childPartners = partnerMap[cId];
        if (childPartners) {
          childPartners.forEach(sp => {
            if (genMap[sp] === undefined) genMap[sp] = genMap[cId];
            if (genMap[cId] > genMap[sp]) {
              genMap[sp] = genMap[cId];
            }
          });
        }
        if (!visited.has(cId)) {
          visited.add(cId);
          queue.push(cId);
        }
      });
    }

    // Align spouse of current
    const partners = partnerMap[current];
    if (partners) {
      partners.forEach(sp => {
        if (genMap[sp] === undefined) genMap[sp] = currentGen;
        if (currentGen > genMap[sp]) {
          genMap[sp] = currentGen;
          // If spouse's generation increased, we need to reprocess their subtree
          if (!visited.has(sp) || genMap[sp] === currentGen) {
            visited.add(sp);
            queue.push(sp);
          }
        }
      });
    }
  }

  // Ensure all people are in genMap
  personIds.forEach(pId => {
    if (genMap[pId] === undefined) genMap[pId] = 1;
  });

  // Final pass to ensure spouse alignment is consistent
  let changed = true;
  let passes = 0;
  while (changed && passes < 15) {
    changed = false;
    passes++;
    personIds.forEach(pId => {
      const partners = partnerMap[pId];
      if (!partners) return;
      partners.forEach(sp => {
        const pGen = genMap[pId] || 1;
        const spGen = genMap[sp] || 1;
        if (pGen !== spGen) {
          const maxGen = Math.max(pGen, spGen);
          if (genMap[pId] !== maxGen) {
            genMap[pId] = maxGen;
            changed = true;
          }
          if (genMap[sp] !== maxGen) {
            genMap[sp] = maxGen;
            changed = true;
          }
        }
      });
      // Also ensure children are below parents
      const parents = childToParentsMap[pId] || [];
      if (parents.length > 0) {
        let maxParentGen = 0;
        parents.forEach(parId => {
          const parGen = genMap[parId] || 1;
          if (parGen > maxParentGen) maxParentGen = parGen;
        });
        const requiredGen = maxParentGen + 1;
        if ((genMap[pId] || 1) < requiredGen) {
          genMap[pId] = requiredGen;
          changed = true;
        }
      }
    });
  }

  return genMap;
};
