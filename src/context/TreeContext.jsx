import { createContext, useContext, useState } from 'react';

const TreeContext = createContext(null);

export const TreeProvider = ({ children, value }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  return (
    <TreeContext.Provider
      value={{
        ...value,
        isExportModalOpen,
        setIsExportModalOpen,
        isStatsModalOpen,
        setIsStatsModalOpen,
      }}
    >
      {children}
    </TreeContext.Provider>
  );
};

export const useTreeContext = () => {
  const ctx = useContext(TreeContext);
  if (!ctx) {
    throw new Error('useTreeContext must be used within TreeProvider');
  }
  return ctx;
};
