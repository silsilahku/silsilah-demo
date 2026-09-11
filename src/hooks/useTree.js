import { useState, useMemo, useCallback, useRef } from 'react';
import { autoArrangeTree } from '../utils/layout-engine';
import { calculateGenerations } from '../utils/generations';
import { CARD_WIDTH, CARD_HEIGHT, X_GAP, Y_GAP, MIN_GAP_CROSS } from '../utils/constants';
import { sortChildrenByBirthDate } from '../utils/child-sort';

export const useTree = (initialData = { people: {}, unions: {} }) => {
  const persistRef = useRef(null);

  const setPersistHandlers = useCallback((handlers) => {
    persistRef.current = handlers;
  }, []);

  const [layoutDirection, setLayoutDirection] = useState('horizontal');
  const [people, setPeople] = useState(() =>
    autoArrangeTree(initialData.people, initialData.unions, 'horizontal')
  );
  const [unions, setUnions] = useState(initialData.unions);
  const [hoveredUnionId, setHoveredUnionId] = useState(null);
  const [collapsedUnions, setCollapsedUnions] = useState(new Set());
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [transform, setTransform] = useState({ x: 80, y: 60, scale: 0.85 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchGestureRef = useRef({
    lastCenter: null,
    lastDistance: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isMemberIndexOpen, setIsMemberIndexOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isSelectSpouseModalOpen, setIsSelectSpouseModalOpen] = useState(false);
  const [isSelectParentModalOpen, setIsSelectParentModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [spouseOptions, setSpouseOptions] = useState([]);
  const [pendingChildParentId, setPendingChildParentId] = useState(null);
  const [pendingParentTargetId, setPendingParentTargetId] = useState(null);

  const genMap = useMemo(
    () => calculateGenerations(people, unions),
    [people, unions]
  );

  const maxGeneration = useMemo(() => {
    const values = Object.values(genMap);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [genMap]);

  const hiddenPersonIds = useMemo(() => {
    const hidden = new Set();
    if (collapsedUnions.size === 0) return hidden;

    const hideDescendants = (unionId) => {
      const u = unions[unionId];
      if (!u || !u.childrenIds) return;
      u.childrenIds.forEach(cId => {
        if (!hidden.has(cId)) {
          hidden.add(cId);
          Object.values(unions).forEach(childUnion => {
            if (childUnion.partner1Id === cId || childUnion.partner2Id === cId) {
              const spouseId = childUnion.partner1Id === cId ? childUnion.partner2Id : childUnion.partner1Id;
              if (spouseId) hidden.add(spouseId);
              hideDescendants(childUnion.id);
            }
          });
        }
      });
    };

    collapsedUnions.forEach(uId => hideDescendants(uId));
    return hidden;
  }, [collapsedUnions, unions]);

  const activeLineageIds = useMemo(() => {
    if (!isHighlightEnabled || !selectedId) return null;

    const lineageIds = new Set();

    const childToParentUnion = {};
    Object.values(unions).forEach(u => {
      (u.childrenIds || []).forEach(cId => {
        childToParentUnion[cId] = u;
      });
    });

    const upQueue = [selectedId];
    const visitedUp = new Set();
    while (upQueue.length > 0) {
      const current = upQueue.shift();
      if (visitedUp.has(current)) continue;
      visitedUp.add(current);
      lineageIds.add(current);

      const parentUnion = childToParentUnion[current];
      if (parentUnion) {
        if (parentUnion.partner1Id) {
          lineageIds.add(parentUnion.partner1Id);
          upQueue.push(parentUnion.partner1Id);
        }
        if (parentUnion.partner2Id) {
          lineageIds.add(parentUnion.partner2Id);
          upQueue.push(parentUnion.partner2Id);
        }
      }
    }

    const downQueue = [selectedId];
    const visitedDown = new Set();
    while (downQueue.length > 0) {
      const current = downQueue.shift();
      if (visitedDown.has(current)) continue;
      visitedDown.add(current);
      lineageIds.add(current);

      Object.values(unions).forEach(u => {
        if (u.partner1Id === current || u.partner2Id === current) {
          const spouseId = u.partner1Id === current ? u.partner2Id : u.partner1Id;
          if (spouseId) {
            lineageIds.add(spouseId);
          }

          (u.childrenIds || []).forEach(cId => {
            lineageIds.add(cId);
            downQueue.push(cId);
          });
        }
      });
    }

    return lineageIds;
  }, [isHighlightEnabled, selectedId, unions]);

  const bloodRelativeIds = useMemo(() => {
    const childToUnionMap = {};
    Object.values(unions).forEach(u => {
      (u.childrenIds || []).forEach(cId => {
        childToUnionMap[cId] = u.id;
      });
    });

    const getPersonUnions = (pId) =>
      Object.values(unions).filter(
        u => u.partner1Id === pId || u.partner2Id === pId
      );

    const peopleWithParents = new Set(Object.keys(childToUnionMap));
    const peopleWithoutParents = Object.keys(people).filter(pId => !peopleWithParents.has(pId));

    const inLawIds = new Set();
    const rootIds = [];

    peopleWithoutParents.forEach(pId => {
      if (inLawIds.has(pId) || rootIds.includes(pId)) return;

      const spouses = getPersonUnions(pId)
        .map(u => (u.partner1Id === pId ? u.partner2Id : u.partner1Id))
        .filter(Boolean);

      const hasBloodRelativeSpouse = spouses.some(sId => peopleWithParents.has(sId));

      if (hasBloodRelativeSpouse) {
        inLawIds.add(pId);
        return;
      }

      // Founder couple: this person has no parents and none of their spouses
      // has parents either. Mark THIS person and every spouse who also has no
      // parents as roots (blood relatives). This is deterministic and does not
      // depend on object key iteration order — previously, whichever partner
      // happened to be iterated first became the "root" and the other was
      // demoted to an in-law, causing the root designation (and the
      // "+Pasangan" button) to swap between the couple after a refresh.
      rootIds.push(pId);
      spouses.forEach(sId => {
        if (!peopleWithParents.has(sId) && !rootIds.includes(sId)) {
          rootIds.push(sId);
        }
      });
    });

    const bloodRelativeIds = new Set();
    const queue = [...rootIds];
    while (queue.length > 0) {
      const current = queue.shift();
      if (bloodRelativeIds.has(current)) continue;
      bloodRelativeIds.add(current);
      Object.values(unions).forEach(u => {
        if (u.partner1Id === current || u.partner2Id === current) {
          (u.childrenIds || []).forEach(cId => {
            if (!bloodRelativeIds.has(cId)) {
              queue.push(cId);
            }
          });
        }
      });
    }
    return bloodRelativeIds;
  }, [people, unions]);

  const selectedPerson = selectedId ? people[selectedId] : null;

  const filteredPeopleList = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return Object.values(people).filter(p =>
      [p.nickname, p.name].some(name =>
        name?.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [people, searchQuery]);

  const handleAutoArrange = useCallback((dir = layoutDirection) => {
    setPeople(autoArrangeTree(people, unions, dir));
  }, [people, unions, layoutDirection]);

  const toggleLayoutDirection = useCallback(() => {
    const nextDir = layoutDirection === 'horizontal' ? 'vertical' : 'horizontal';
    setLayoutDirection(nextDir);
    setPeople(autoArrangeTree(people, unions, nextDir));
  }, [people, unions, layoutDirection]);

  const toggleCollapseUnion = useCallback((unionId) => {
    setCollapsedUnions(prev => {
      const next = new Set(prev);
      if (next.has(unionId)) next.delete(unionId);
      else next.add(unionId);
      return next;
    });
  }, []);

  const getParentUnion = useCallback((personId) => {
    return Object.values(unions).find(u => u.childrenIds && u.childrenIds.includes(personId));
  }, [unions]);

  const getSpouses = useCallback((personId) => {
    const partnerList = [];
    Object.values(unions).forEach(u => {
      if (u.partner1Id === personId && u.partner2Id && people[u.partner2Id]) {
        partnerList.push({ unionId: u.id, person: people[u.partner2Id] });
      } else if (u.partner2Id === personId && u.partner1Id && people[u.partner1Id]) {
        partnerList.push({ unionId: u.id, person: people[u.partner1Id] });
      }
    });
    return partnerList;
  }, [people, unions]);

  const getFather = useCallback((personId) => {
    const parentUnion = getParentUnion(personId);
    if (!parentUnion) return null;
    if (parentUnion.partner1Id && people[parentUnion.partner1Id]?.gender === 'male') {
      return people[parentUnion.partner1Id];
    }
    if (parentUnion.partner2Id && people[parentUnion.partner2Id]?.gender === 'male') {
      return people[parentUnion.partner2Id];
    }
    return null;
  }, [people, getParentUnion]);

  const getMother = useCallback((personId) => {
    const parentUnion = getParentUnion(personId);
    if (!parentUnion) return null;
    if (parentUnion.partner1Id && people[parentUnion.partner1Id]?.gender === 'female') {
      return people[parentUnion.partner1Id];
    }
    if (parentUnion.partner2Id && people[parentUnion.partner2Id]?.gender === 'female') {
      return people[parentUnion.partner2Id];
    }
    return null;
  }, [people, getParentUnion]);

  const getSiblings = useCallback((personId) => {
    const parentUnion = getParentUnion(personId);
    if (!parentUnion || !parentUnion.childrenIds) return [];
    return parentUnion.childrenIds
      .filter(id => id !== personId)
      .map(id => people[id])
      .filter(Boolean);
  }, [people, getParentUnion]);

  const getChildren = useCallback((personId) => {
    const children = [];
    Object.values(unions).forEach(u => {
      if ((u.partner1Id === personId || u.partner2Id === personId) && u.childrenIds) {
        u.childrenIds.forEach(cId => {
          if (people[cId]) children.push(people[cId]);
        });
      }
    });
    return sortChildrenByBirthDate(children.map(c => c.id), people).map(id => people[id]);
  }, [people, unions]);

  const handleAddFirstPerson = useCallback((name = 'Kepala Keluarga') => {
    const newPersonId = 'p-' + Date.now();
    const newPerson = {
      id: newPersonId,
      name: name,
      nickname: name,
      gender: 'male',
      birthYear: '',
      deathYear: '',
      isDeceased: false,
      domicile: '',
      bio: '',
      photo: '',
      notes: '',
      x: 100,
      y: 100,
    };

    const nextPeople = { ...people, [newPersonId]: newPerson };
    const nextUnions = { ...unions };

    setPeople(autoArrangeTree(nextPeople, nextUnions, layoutDirection));
    setUnions(nextUnions);
    setSelectedId(newPersonId);

    (async () => {
      try {
        if (persistRef.current?.savePerson) await persistRef.current.savePerson(newPerson);
      } catch (err) {
        console.error('Gagal menyimpan orang pertama ke Supabase:', err);
      }
    })();
  }, [people, unions, layoutDirection]);

  const handleAddSpouse = useCallback((targetPersonId) => {
    const target = people[targetPersonId];
    if (!target) return;

    const newPersonId = 'p-' + Date.now();
    const defaultGender = target.gender === 'male' ? 'female' : 'male';
    const existingSpousesCount = getSpouses(targetPersonId).length;
    const spouseTitle = `Pasangan ${target.nickname || target.name.split(' ')[0]} ${existingSpousesCount > 0 ? (existingSpousesCount + 1) : ''}`.trim();

    const isVert = layoutDirection === 'vertical';
    const newPerson = {
      id: newPersonId,
      name: spouseTitle,
      nickname: spouseTitle,
      gender: defaultGender,
      birthYear: '',
      deathYear: '',
      isDeceased: false,
      domicile: '',
      bio: '',
      photo: '',
      notes: '',
      x: isVert ? target.x + (CARD_WIDTH + MIN_GAP_CROSS) * (existingSpousesCount + 1) : target.x,
      y: isVert ? target.y : target.y + (CARD_HEIGHT + MIN_GAP_CROSS) * (existingSpousesCount + 1),
    };

    const newUnionId = 'u-' + Date.now();
    const newUnion = {
      id: newUnionId,
      partner1Id: targetPersonId,
      partner2Id: newPersonId,
      childrenIds: [],
    };

    const nextPeople = { ...people, [newPersonId]: newPerson };
    const nextUnions = { ...unions, [newUnionId]: newUnion };

    setPeople(autoArrangeTree(nextPeople, nextUnions, layoutDirection));
    setUnions(nextUnions);
    setSelectedId(newPersonId);

    (async () => {
      try {
        if (persistRef.current?.savePerson) {
          const ok = await persistRef.current.savePerson(newPerson);
          if (!ok) console.error('Gagal menyimpan pasangan ke Supabase: savePerson gagal (periksa koneksi/RLS).');
        }
        if (persistRef.current?.saveUnion) {
          const ok = await persistRef.current.saveUnion(newUnion);
          if (!ok) console.error('Gagal menyimpan union ke Supabase: saveUnion gagal (periksa koneksi/RLS).');
        }
      } catch (err) {
        console.error('Gagal menyimpan pasangan ke Supabase:', err);
      }
    })();
  }, [people, unions, layoutDirection, getSpouses]);

  const createChildForUnion = useCallback((unionId, parent1Id, partnerPerson) => {
    const parent1 = people[parent1Id];
    const partnerName = partnerPerson ? partnerPerson.name : '';
    const childId = 'p-child-' + Date.now();
    const childName = partnerName
      ? `Anak ${parent1.name.split(' ')[0]} & ${partnerName.split(' ')[0]}`
      : `Anak ${parent1.name.split(' ')[0]}`;

    const isVert = layoutDirection === 'vertical';
    const newChild = {
      id: childId,
      name: childName,
      gender: 'male',
      birthYear: '',
      deathYear: '',
      isDeceased: false,
      photo: '',
      notes: '',
      x: isVert ? parent1.x : parent1.x + CARD_WIDTH + X_GAP,
      y: isVert ? parent1.y + CARD_HEIGHT + Y_GAP : parent1.y,
    };

    const nextPeople = { ...people, [childId]: newChild };
    
    // Insert child in correct position based on birth year (oldest first)
    const currentChildrenIds = unions[unionId].childrenIds || [];
    const sortedChildrenIds = sortChildrenByBirthDate(
      [...currentChildrenIds, childId],
      nextPeople
    );
    
    const nextUnions = {
      ...unions,
      [unionId]: {
        ...unions[unionId],
        childrenIds: sortedChildrenIds,
      },
    };

    setPeople(autoArrangeTree(nextPeople, nextUnions, layoutDirection));
    setUnions(nextUnions);
    setSelectedId(childId);
    setIsSelectSpouseModalOpen(false);

    (async () => {
      try {
        if (persistRef.current?.savePerson) {
          const ok1 = await persistRef.current.savePerson(newChild);
          if (!ok1) console.error('Gagal menyimpan anak ke Supabase.');
        }
        if (persistRef.current?.saveUnion) {
          const ok2 = await persistRef.current.saveUnion(nextUnions[unionId]);
          if (!ok2) console.error('Gagal menyimpan union ke Supabase.');
        }
      } catch (err) {
        console.error('Gagal menyimpan anak ke Supabase:', err);
      }
    })();
  }, [people, unions, layoutDirection]);

  const handleAddChildClick = useCallback((targetPersonId) => {
    const target = people[targetPersonId];
    if (!target) return;

    const spouses = getSpouses(targetPersonId);

    if (spouses.length === 0) {
      const dummySpouseId = 'p-spouse-' + Date.now();
      const spouseTitle = `Pasangan ${target.nickname || target.name.split(' ')[0]}`;
      const isVert = layoutDirection === 'vertical';

      const dummySpouse = {
        id: dummySpouseId,
        name: spouseTitle,
        nickname: spouseTitle,
        gender: target.gender === 'male' ? 'female' : 'male',
        birthYear: '',
        deathYear: '',
        isDeceased: false,
        domicile: '',
        bio: '',
        photo: '',
        notes: `Pasangan dari ${target.name}`,
        x: isVert ? target.x + CARD_WIDTH + MIN_GAP_CROSS : target.x,
        y: isVert ? target.y : target.y + CARD_HEIGHT + MIN_GAP_CROSS,
      };

      const newUnionId = 'u-' + Date.now();
      const childId = 'p-child-' + Date.now();
      const childTitle = `Anak ${target.nickname || target.name.split(' ')[0]}`;

      const newChild = {
        id: childId,
        name: childTitle,
        nickname: childTitle,
        gender: 'male',
        birthYear: '',
        deathYear: '',
        isDeceased: false,
        photo: '',
        notes: '',
        x: isVert ? target.x : target.x + CARD_WIDTH + X_GAP,
        y: isVert ? target.y + CARD_HEIGHT + Y_GAP : target.y,
      };

      const newUnion = {
        id: newUnionId,
        partner1Id: targetPersonId,
        partner2Id: dummySpouseId,
        childrenIds: [childId],
      };

      const nextPeople = { ...people, [dummySpouseId]: dummySpouse, [childId]: newChild };
      const nextUnions = { ...unions, [newUnionId]: newUnion };

      setPeople(autoArrangeTree(nextPeople, nextUnions, layoutDirection));
      setUnions(nextUnions);
      setSelectedId(childId);

      (async () => {
        try {
          if (persistRef.current?.savePerson) {
            const ok1 = await persistRef.current.savePerson(dummySpouse);
            if (!ok1) console.error('Gagal menyimpan pasangan dummy ke Supabase.');
          }
          if (persistRef.current?.savePerson) {
            const ok2 = await persistRef.current.savePerson(newChild);
            if (!ok2) console.error('Gagal menyimpan anak ke Supabase.');
          }
          if (persistRef.current?.saveUnion) {
            const ok3 = await persistRef.current.saveUnion(newUnion);
            if (!ok3) console.error('Gagal menyimpan union ke Supabase.');
          }
        } catch (err) {
          console.error('Gagal menyimpan anak ke Supabase:', err);
        }
      })();
    } else if (spouses.length === 1) {
      createChildForUnion(spouses[0].unionId, targetPersonId, spouses[0].person);
    } else {
      setPendingChildParentId(targetPersonId);
      setSpouseOptions(spouses);
      setIsSelectSpouseModalOpen(true);
    }
  }, [people, unions, layoutDirection, getSpouses, createChildForUnion]);

  const handleAddParentClick = useCallback((targetPersonId) => {
    setPendingParentTargetId(targetPersonId);
    setIsSelectParentModalOpen(true);
  }, []);

  const createParentForPerson = useCallback((targetPersonId, gender) => {
    const target = people[targetPersonId];
    if (!target) return;

    const newParentId = 'p-parent-' + Date.now();
    const titlePrefix = gender === 'male' ? 'Ayah' : 'Ibu';
    const targetShortName = target.nickname || target.name.split(' ')[0];
    const parentName = `${titlePrefix} ${targetShortName}`;

    const isVert = layoutDirection === 'vertical';
    const parentX = isVert ? target.x : Math.max(20, target.x - (CARD_WIDTH + X_GAP));
    const parentY = isVert ? Math.max(20, target.y - (CARD_HEIGHT + Y_GAP)) : target.y;

    const newParent = {
      id: newParentId,
      name: parentName,
      nickname: parentName,
      gender,
      birthYear: '',
      deathYear: '',
      isDeceased: false,
      domicile: '',
      bio: '',
      photo: '',
      notes: `Orang tua dari ${target.name}`,
      x: parentX,
      y: parentY,
    };

    const existingParentUnion = getParentUnion(targetPersonId);
    let nextUnions = { ...unions };
    let unionToSave = null;

    if (existingParentUnion) {
      let updatedUnion = { ...existingParentUnion };
      if (gender === 'male') {
        if (!updatedUnion.partner1Id || (people[updatedUnion.partner1Id] && people[updatedUnion.partner1Id].gender !== 'male')) {
          if (updatedUnion.partner1Id && !updatedUnion.partner2Id) {
            updatedUnion.partner2Id = updatedUnion.partner1Id;
          }
          updatedUnion.partner1Id = newParentId;
        } else if (!updatedUnion.partner2Id) {
          updatedUnion.partner2Id = newParentId;
        } else {
          updatedUnion.partner1Id = newParentId;
        }
      } else {
        if (!updatedUnion.partner2Id || (people[updatedUnion.partner2Id] && people[updatedUnion.partner2Id].gender !== 'female')) {
          if (updatedUnion.partner1Id && people[updatedUnion.partner1Id]?.gender === 'female') {
            updatedUnion.partner2Id = updatedUnion.partner1Id;
            updatedUnion.partner1Id = newParentId;
          } else {
            updatedUnion.partner2Id = newParentId;
          }
        } else if (!updatedUnion.partner1Id) {
          updatedUnion.partner1Id = newParentId;
        } else {
          updatedUnion.partner2Id = newParentId;
        }
      }
      nextUnions[existingParentUnion.id] = updatedUnion;
      unionToSave = updatedUnion;
    } else {
      const newUnionId = 'u-parent-' + Date.now();
      const newUnion = {
        id: newUnionId,
        partner1Id: newParentId,
        partner2Id: null,
        childrenIds: [targetPersonId],
      };
      nextUnions[newUnionId] = newUnion;
      unionToSave = newUnion;
    }

    const nextPeople = { ...people, [newParentId]: newParent };

    setPeople(autoArrangeTree(nextPeople, nextUnions, layoutDirection));
    setUnions(nextUnions);
    setSelectedId(newParentId);
    setIsSelectParentModalOpen(false);

    (async () => {
      try {
        if (persistRef.current?.savePerson) await persistRef.current.savePerson(newParent);
        if (persistRef.current?.saveUnion && unionToSave) await persistRef.current.saveUnion(unionToSave);
      } catch (err) {
        console.error('Gagal menyimpan orang tua ke Supabase:', err);
      }
    })();
  }, [people, unions, layoutDirection, getParentUnion]);

  const handleDeletePerson = useCallback((personId) => {
    const nextPeople = { ...people };
    delete nextPeople[personId];

    const nextUnions = {};
    Object.values(unions).forEach(u => {
      if (u.partner1Id === personId || u.partner2Id === personId) return;
      const cleanChildren = (u.childrenIds || []).filter(cId => cId !== personId);
      nextUnions[u.id] = { ...u, childrenIds: cleanChildren };
    });

    setPeople(autoArrangeTree(nextPeople, nextUnions, layoutDirection));
    setUnions(nextUnions);
    setSelectedId(null);
    setIsEditDrawerOpen(false);
  }, [people, unions, layoutDirection]);

  const handleMouseDownCanvas = useCallback((e) => {
    if (e.target.closest('.card-node') || e.target.closest('.interactive-btn')) return;
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMoveCanvas = useCallback((e) => {
    if (isDraggingCanvas) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  }, [isDraggingCanvas, dragStart]);

  const handleMouseUpCanvas = useCallback(() => {
    setIsDraggingCanvas(false);
  }, []);

  const handleWheelCanvas = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(2.5, Math.max(0.2, prev.scale * zoomFactor)),
    }));
  }, []);

  const centerTree = useCallback(() => {
    const visiblePeople = Object.values(people);
    if (visiblePeople.length === 0) {
      setTransform({ x: 80, y: 60, scale: 0.85 });
      return;
    }

    const minX = Math.min(...visiblePeople.map(person => person.x));
    const maxX = Math.max(...visiblePeople.map(person => person.x + CARD_WIDTH));
    const minY = Math.min(...visiblePeople.map(person => person.y));
    const maxY = Math.max(...visiblePeople.map(person => person.y + CARD_HEIGHT));
    const viewportWidth = window.innerWidth;
    const viewportHeight = Math.max(0, window.innerHeight - 56);

    setTransform(prev => ({
      ...prev,
      x: viewportWidth / 2 - ((minX + maxX) / 2) * prev.scale,
      y: viewportHeight / 2 - ((minY + maxY) / 2) * prev.scale,
    }));
  }, [people]);

  const handleTouchStartCanvas = useCallback((e) => {
    if (e.target.closest('.card-node') || e.target.closest('.interactive-btn')) return;

    const touches = Array.from(e.touches);
    if (touches.length === 1) {
      const touch = touches[0];
      setIsDraggingCanvas(true);
      setDragStart({ x: touch.clientX - transform.x, y: touch.clientY - transform.y });
      touchGestureRef.current = { lastCenter: null, lastDistance: 0 };
      return;
    }

    if (touches.length >= 2) {
      const [first, second] = touches;
      touchGestureRef.current = {
        lastCenter: {
          x: (first.clientX + second.clientX) / 2,
          y: (first.clientY + second.clientY) / 2,
        },
        lastDistance: Math.hypot(
          first.clientX - second.clientX,
          first.clientY - second.clientY
        ),
      };
      setIsDraggingCanvas(false);
    }
  }, [transform]);

  const handleTouchMoveCanvas = useCallback((e) => {
    if (e.target.closest('.card-node') || e.target.closest('.interactive-btn')) return;

    const touches = Array.from(e.touches);
    if (touches.length === 1 && isDraggingCanvas) {
      e.preventDefault();
      const touch = touches[0];
      setTransform(prev => ({
        ...prev,
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      }));
      return;
    }

    if (touches.length < 2) return;

    e.preventDefault();
    const [first, second] = touches;
    const center = {
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2,
    };
    const distance = Math.hypot(
      first.clientX - second.clientX,
      first.clientY - second.clientY
    );
    const gesture = touchGestureRef.current;

    if (!gesture.lastCenter || !gesture.lastDistance) {
      touchGestureRef.current = { lastCenter: center, lastDistance: distance };
      return;
    }

    setTransform(prev => {
      const nextScale = Math.min(
        2.5,
        Math.max(0.2, prev.scale * (distance / gesture.lastDistance))
      );
      const scaleRatio = nextScale / prev.scale;
      return {
        scale: nextScale,
        x: center.x - (center.x - prev.x) * scaleRatio + (center.x - gesture.lastCenter.x),
        y: center.y - (center.y - prev.y) * scaleRatio + (center.y - gesture.lastCenter.y),
      };
    });

    touchGestureRef.current = { lastCenter: center, lastDistance: distance };
  }, [dragStart, isDraggingCanvas]);

  const handleTouchEndCanvas = useCallback((e) => {
    const remainingTouch = e.touches[0];
    if (remainingTouch) {
      setIsDraggingCanvas(true);
      setDragStart({
        x: remainingTouch.clientX - transform.x,
        y: remainingTouch.clientY - transform.y,
      });
      touchGestureRef.current = { lastCenter: null, lastDistance: 0 };
      return;
    }

    setIsDraggingCanvas(false);
    touchGestureRef.current = { lastCenter: null, lastDistance: 0 };
  }, [transform]);

  const handleResetTree = useCallback(() => {
    setPeople({});
    setUnions({});
    setSelectedId(null);
    setTransform({ x: 80, y: 60, scale: 0.85 });
    setCollapsedUnions(new Set());
    setHoveredUnionId(null);
    setIsHighlightEnabled(true);
    setIsMemberIndexOpen(false);
    setIsEditDrawerOpen(false);
    setIsSelectSpouseModalOpen(false);
    setIsSelectParentModalOpen(false);
  }, []);

  const handleUpdatePerson = useCallback((personId, field, value) => {
    setPeople(prev => ({
      ...prev,
      [personId]: { ...prev[personId], [field]: value },
    }));
  }, []);

  const handleSavePerson = useCallback(async (personId) => {
    const person = people[personId];
    if (!person) return false;
    try {
      if (persistRef.current?.savePerson) await persistRef.current.savePerson(person);
      return true;
    } catch (err) {
      console.error('Gagal menyimpan perubahan ke Supabase:', err);
      return false;
    }
  }, [people]);

  return {
    layoutDirection,
    people,
    setPeople,
    unions,
    setUnions,
    hoveredUnionId,
    setHoveredUnionId,
    collapsedUnions,
    setCollapsedUnions,
    isHighlightEnabled,
    setIsHighlightEnabled,
    selectedId,
    setSelectedId,
    selectedPerson,
    transform,
    setTransform,
    isDraggingCanvas,
    dragStart,
    searchQuery,
    setSearchQuery,
    isMemberIndexOpen,
    setIsMemberIndexOpen,
    filteredPeopleList,
    isEditDrawerOpen,
    setIsEditDrawerOpen,
    isSelectSpouseModalOpen,
    setIsSelectSpouseModalOpen,
    isSelectParentModalOpen,
    setIsSelectParentModalOpen,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    spouseOptions,
    setSpouseOptions,
    pendingChildParentId,
    setPendingChildParentId,
    pendingParentTargetId,
    setPendingParentTargetId,
    genMap,
    maxGeneration,
    hiddenPersonIds,
    activeLineageIds,
    bloodRelativeIds,
    getSpouses,
    getParentUnion,
    getFather,
    getMother,
    getSiblings,
    getChildren,
    setPersistHandlers,
    handleAutoArrange,
    toggleLayoutDirection,
    toggleCollapseUnion,
    handleAddSpouse,
    handleAddFirstPerson,
    handleAddChildClick,
    createChildForUnion,
    handleAddParentClick,
    createParentForPerson,
    handleDeletePerson,
    handleUpdatePerson,
    handleSavePerson,
    handleMouseDownCanvas,
    handleMouseMoveCanvas,
    handleMouseUpCanvas,
    handleWheelCanvas,
    centerTree,
    handleTouchStartCanvas,
    handleTouchMoveCanvas,
    handleTouchEndCanvas,
    handleResetTree,
  };
};
