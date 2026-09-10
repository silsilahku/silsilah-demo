/**
 * Sort children by birth year ascending (oldest first)
 * Missing/invalid birthYear goes to the end
 */
export const sortChildrenByBirthDate = (childrenIds, people) => {
  return [...childrenIds].sort((a, b) => {
    const personA = people[a];
    const personB = people[b];
    
    if (!personA && !personB) return 0;
    if (!personA) return 1;
    if (!personB) return -1;
    
    const birthA = parseInt(personA.birthYear);
    const birthB = parseInt(personB.birthYear);
    
    // Valid birth years first (ascending = oldest first)
    const validA = !isNaN(birthA);
    const validB = !isNaN(birthB);
    
    if (validA && validB) return birthA - birthB;
    if (validA) return -1;
    if (validB) return 1;
    return 0;
  });
};