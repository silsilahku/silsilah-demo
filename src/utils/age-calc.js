export const calculateAgeInfo = (birthYear, deathYear, isDeceased) => {
  const currentYear = new Date().getFullYear();
  const birth = parseInt(birthYear);
  if (isNaN(birth)) return null;

  if (isDeceased) {
    const death = parseInt(deathYear);
    if (isNaN(death)) return { label: 'Telah Wafat', value: 'Tahun wafat belum diisi' };
    const ageAtDeath = death - birth;
    return {
      label: 'Usia saat meninggal',
      value: ageAtDeath >= 0 ? `${ageAtDeath} tahun` : 'Tahun tidak valid'
    };
  }

  const age = currentYear - birth;
  return {
    label: 'Usia saat ini',
    value: age >= 0 ? `${age} tahun` : 'Tahun lahir belum valid'
  };
};
