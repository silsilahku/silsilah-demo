const getValidYear = (value) => {
  const year = Number(value);
  return Number.isInteger(year) && year > 0 ? year : null;
};

const getPersonLabel = (person) => person?.nickname || person?.name || 'Tanpa Nama';

const isDeceasedPerson = (person) => person?.isDeceased === true || getValidYear(person?.deathYear) !== null;

export const calculateStatistics = (people, unions, genMap) => {
  const personList = Object.values(people || {});
  const unionList = Object.values(unions || {});
  const validPeople = new Set(Object.keys(people || {}));

  const livingPeople = personList.filter(
    (person) => !isDeceasedPerson(person)
  );
  const livingWithBirthYear = livingPeople
    .map((person) => ({ person, birthYear: getValidYear(person.birthYear) }))
    .filter(({ birthYear }) => birthYear !== null);

  const oldestLiving = livingWithBirthYear.reduce(
    (oldest, current) => (!oldest || current.birthYear < oldest.birthYear ? current : oldest),
    null
  );
  const youngestLiving = livingWithBirthYear.reduce(
    (youngest, current) => (!youngest || current.birthYear > youngest.birthYear ? current : youngest),
    null
  );

  const deceasedPeople = personList.filter(isDeceasedPerson);
  const deceasedWithValidAge = deceasedPeople
    .map((person) => ({
      birthYear: getValidYear(person.birthYear),
      deathYear: getValidYear(person.deathYear),
    }))
    .filter(({ birthYear, deathYear }) => birthYear !== null && deathYear !== null && deathYear >= birthYear)
    .map(({ birthYear, deathYear }) => deathYear - birthYear);

  const validCouples = unionList.filter(
    (union) =>
      union.partner1Id &&
      union.partner2Id &&
      validPeople.has(union.partner1Id) &&
      validPeople.has(union.partner2Id)
  );
  const childrenPerCouple = validCouples.map(
    (union) => (union.childrenIds || []).filter((childId) => validPeople.has(childId)).length
  );

  const generationValues = Object.values(genMap || {}).filter(Number.isFinite);

  const peopleWithBirthYear = personList.filter((person) => getValidYear(person.birthYear) !== null).length;
  const peopleWithDeathYear = deceasedPeople.filter((person) => getValidYear(person.deathYear) !== null).length;
  const peopleWithGender = personList.filter((person) => person.gender === 'male' || person.gender === 'female').length;
  const peopleWithPhoto = personList.filter((person) => !!person.photo).length;

  return {
    totalGenerations: generationValues.length > 0 ? Math.max(...generationValues) : 0,
    maleCount: personList.filter((person) => person.gender === 'male').length,
    femaleCount: personList.filter((person) => person.gender === 'female').length,
    coupleCount: validCouples.length,
    oldestLiving: oldestLiving
      ? {
          name: getPersonLabel(oldestLiving.person),
          age: new Date().getFullYear() - oldestLiving.birthYear,
        }
      : null,
    youngestLiving: youngestLiving
      ? {
          name: getPersonLabel(youngestLiving.person),
          age: new Date().getFullYear() - youngestLiving.birthYear,
        }
      : null,
    averageAgeAtDeath: deceasedWithValidAge.length > 0
      ? deceasedWithValidAge.reduce((sum, age) => sum + age, 0) / deceasedWithValidAge.length
      : null,
    deceasedSampleSize: deceasedWithValidAge.length,
    averageChildrenPerCouple: childrenPerCouple.length > 0
      ? childrenPerCouple.reduce((sum, count) => sum + count, 0) / childrenPerCouple.length
      : null,
    coupleSampleSize: childrenPerCouple.length,
    totalPeople: personList.length,
    livingCount: livingPeople.length,
    deceasedCount: deceasedPeople.length,
    peopleWithBirthYear,
    peopleWithDeathYear,
    peopleWithGender,
    peopleWithPhoto,
  };
};
