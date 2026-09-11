import { useEffect, useCallback } from 'react';
import { useTree } from './hooks/useTree';
import { useSupabase } from './hooks/useSupabase';
import { TreeProvider } from './context/TreeContext';
import { autoArrangeTree } from './utils/layout-engine';

import HeaderBar from './components/HeaderBar';
import TreeCanvas from './components/TreeCanvas';
import SideDrawer from './components/SideDrawer';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import LoginModal from './components/LoginModal';
import SpouseSelectorModal from './components/SpouseSelectorModal';
import ParentTypeSelectorModal from './components/ParentTypeSelectorModal';
import ConfirmResetModal from './components/ConfirmResetModal';
import ExportImportModal from './components/ExportImportModal';
import StatisticsModal from './components/StatisticsModal';

function App() {
  const tree = useTree();
  const supabase = useSupabase();
  const { setPersistHandlers } = tree;

  useEffect(() => {
    if (!supabase.supabaseClient) return;

    const loadFromDb = async () => {
      const data = await supabase.fetchTreeData();
      if (data) {
        tree.setPeople(
          autoArrangeTree(data.people, data.unions, tree.layoutDirection)
        );
        tree.setUnions(data.unions);
        tree.requestCenter();
      }
    };
    loadFromDb();
  }, [supabase.supabaseClient]);

  useEffect(() => {
    if (supabase.supabaseClient) {
      setPersistHandlers({
        savePerson: supabase.savePerson,
        saveUnion: supabase.saveUnion,
      });
    }
  }, [supabase.supabaseClient, supabase.savePerson, supabase.saveUnion, setPersistHandlers]);

  const handleAddSpouse = useCallback(
    (id) => {
      if (!supabase.isAdmin) {
        supabase.setIsLoginModalOpen(true);
        return;
      }
      tree.handleAddSpouse(id);
    },
    [supabase.isAdmin, supabase.setIsLoginModalOpen, tree.handleAddSpouse]
  );

  const handleAddFirstPerson = useCallback(
    (name) => {
      if (!supabase.isAdmin) {
        supabase.setIsLoginModalOpen(true);
        return;
      }
      tree.handleAddFirstPerson(name);
    },
    [supabase.isAdmin, supabase.setIsLoginModalOpen, tree.handleAddFirstPerson]
  );

  const handleAddChildClick = useCallback(
    (id) => {
      if (!supabase.isAdmin) {
        supabase.setIsLoginModalOpen(true);
        return;
      }
      tree.handleAddChildClick(id);
    },
    [supabase.isAdmin, supabase.setIsLoginModalOpen, tree.handleAddChildClick]
  );

  const handleAddParentClick = useCallback(
    (id) => {
      if (!supabase.isAdmin) {
        supabase.setIsLoginModalOpen(true);
        return;
      }
      tree.setPendingParentTargetId(id);
      tree.setIsSelectParentModalOpen(true);
    },
    [
      supabase.isAdmin,
      supabase.setIsLoginModalOpen,
      tree.setPendingParentTargetId,
      tree.setIsSelectParentModalOpen,
    ]
  );

  const handleDeletePerson = useCallback(async (id) => {
    if (!supabase.isAdmin) return;

    const personToDelete = tree.people[id];
    const personPhoto = personToDelete?.photo;

    const unionIds = Object.values(tree.unions)
      .filter(
        (u) =>
          u.partner1Id === id ||
          u.partner2Id === id ||
          (u.childrenIds || []).includes(id)
      )
      .map((u) => u.id);

    if (personPhoto && supabase.supabaseClient) {
      try {
        if (personPhoto.includes('/storage/v1/object/public/')) {
          try {
            const url = new URL(personPhoto);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const bucketIndex = pathParts.indexOf(supabase.supabaseBucket);
            if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
              const filePath = pathParts.slice(bucketIndex + 1).join('/');
              const { error: removeError } = await supabase.supabaseClient.storage
                .from(supabase.supabaseBucket)
                .remove([filePath]);
              if (removeError) throw removeError;
            }
          } catch (err) {
            console.error('Gagal menghapus foto dari Supabase Storage:', err);
            alert('Gagal menghapus file foto dari bucket. Data anggota tetap akan dihapus dari database.');
          }
        }
      } catch (err) {
        console.error('Gagal menghapus foto dari Supabase Storage:', err);
      }
    }

    await supabase.deletePerson(id, unionIds);
    tree.handleDeletePerson(id);
  }, [supabase.isAdmin, supabase.deletePerson, supabase.supabaseClient, supabase.supabaseBucket, tree.people, tree.unions, tree.handleDeletePerson]);

  const handleResetTree = useCallback(async () => {
    if (!supabase.isAdmin || !supabase.supabaseClient) {
      tree.setIsResetConfirmOpen(false);
      return;
    }

    const personIds = Object.keys(tree.people);
    if (personIds.length === 0) {
      tree.handleResetTree();
      tree.setIsResetConfirmOpen(false);
      return;
    }

    let people = { ...tree.people };
    let unions = { ...tree.unions };
    let failed = false;

    for (const personId of personIds) {
      if (failed) break;

      const person = people[personId];
      if (!person) continue;

      const unionIds = Object.values(unions)
        .filter(
          (u) =>
            u.partner1Id === personId ||
            u.partner2Id === personId ||
            (u.childrenIds || []).includes(personId)
        )
        .map((u) => u.id);

      if (person.photo && person.photo.includes('/storage/v1/object/public/')) {
        try {
          const url = new URL(person.photo);
          const pathParts = url.pathname.split('/').filter(Boolean);
          const bucketIndex = pathParts.indexOf(supabase.supabaseBucket);
          if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            const { error: removeError } = await supabase.supabaseClient.storage
              .from(supabase.supabaseBucket)
              .remove([filePath]);
            if (removeError) throw removeError;
          }
        } catch (err) {
          console.error('Gagal menghapus foto saat reset:', err);
          alert('Gagal menghapus beberapa foto dari bucket. Proses reset tetap dilanjutkan.');
        }
      }

      const success = await supabase.deletePerson(personId, unionIds);
      if (!success) {
        alert('Gagal menghapus data dari Supabase. Reset dihentikan.');
        failed = true;
        break;
      }

      const nextPeople = { ...people };
      delete nextPeople[personId];
      people = nextPeople;

      const nextUnions = {};
      Object.values(unions).forEach((u) => {
        if (u.partner1Id === personId || u.partner2Id === personId) return;
        const cleanChildren = (u.childrenIds || []).filter(
          (cId) => cId !== personId
        );
        nextUnions[u.id] = { ...u, childrenIds: cleanChildren };
      });
      unions = nextUnions;

      tree.setPeople({ ...people });
      tree.setUnions({ ...unions });

      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    if (!failed) {
      tree.handleResetTree();
    }
    tree.setIsResetConfirmOpen(false);
  }, [supabase.isAdmin, supabase.supabaseClient, supabase.supabaseBucket, supabase.deletePerson, tree.people, tree.unions, tree.handleResetTree, tree.setIsResetConfirmOpen, tree.setPeople, tree.setUnions]);

  const uploadPhoto = useCallback(
    async (file) => {
      if (!file || !tree.selectedPerson || !supabase.supabaseClient) return;

      const oldPhoto = tree.selectedPerson.photo;

      supabase.setIsUploadingPhoto(true);
      try {
        if (oldPhoto && oldPhoto.includes('/storage/v1/object/public/')) {
          try {
            const url = new URL(oldPhoto);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const bucketIndex = pathParts.indexOf(supabase.supabaseBucket);
            if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
              const filePath = pathParts.slice(bucketIndex + 1).join('/');
              await supabase.supabaseClient.storage
                .from(supabase.supabaseBucket)
                .remove([filePath]);
            }
          } catch {
            // ignore old photo deletion errors
          }
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `avatars/${tree.selectedPerson.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.supabaseClient.storage
          .from(supabase.supabaseBucket)
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.supabaseClient.storage
          .from(supabase.supabaseBucket)
          .getPublicUrl(filePath);

        tree.setPeople((prev) => ({
          ...prev,
          [tree.selectedPerson.id]: {
            ...tree.selectedPerson,
            photo: publicUrl,
          },
        }));
      } catch (err) {
        alert('Gagal mengunggah foto: ' + err.message);
      } finally {
        supabase.setIsUploadingPhoto(false);
      }
    },
    [tree.selectedPerson, tree.setPeople, supabase.supabaseClient, supabase.supabaseBucket, supabase.setIsUploadingPhoto]
  );

  const removePhoto = useCallback(async () => {
    if (!supabase.isAdmin || !tree.selectedPerson?.photo || !supabase.supabaseClient) return;

    const photoUrl = tree.selectedPerson.photo;
    const updatedPerson = { ...tree.selectedPerson, photo: '' };

    if (photoUrl.includes('/storage/v1/object/public/')) {
      try {
        const url = new URL(photoUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const bucketIndex = pathParts.indexOf(supabase.supabaseBucket);
        if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          const { error: removeError } = await supabase.supabaseClient.storage
            .from(supabase.supabaseBucket)
            .remove([filePath]);
          if (removeError) throw removeError;
        }
      } catch (err) {
        alert('Gagal menghapus file foto dari bucket: ' + (err.message || err));
        return;
      }
    }

    try {
      const saved = await supabase.savePerson(updatedPerson);
      if (!saved) {
        alert('Gagal menghapus foto dari database.');
        return;
      }
    } catch (err) {
      alert('Gagal menghapus foto dari database: ' + (err.message || err));
      return;
    }

    tree.setPeople((prev) => ({
      ...prev,
      [tree.selectedPerson.id]: updatedPerson,
    }));
  }, [supabase.isAdmin, supabase.supabaseClient, supabase.supabaseBucket, tree.selectedPerson, tree.setPeople, supabase.savePerson]);

  const contextValue = {
    ...tree,
    isAdmin: supabase.isAdmin,
    user: supabase.user,
    supabaseClient: supabase.supabaseClient,
    supabaseBucket: supabase.supabaseBucket,
    isUploadingPhoto: supabase.isUploadingPhoto,
    uploadPhoto,
    removePhoto,
    isLoginModalOpen: supabase.isLoginModalOpen,
    setIsLoginModalOpen: supabase.setIsLoginModalOpen,
    isConfigModalOpen: supabase.isConfigModalOpen,
    setIsConfigModalOpen: supabase.setIsConfigModalOpen,
    supabaseUrl: supabase.supabaseUrl,
    setSupabaseUrl: supabase.setSupabaseUrl,
    supabaseKey: supabase.supabaseKey,
    setSupabaseKey: supabase.setSupabaseKey,
    loginError: supabase.loginError,
    saveConfig: supabase.saveConfig,
    login: supabase.login,
    logout: supabase.logout,
    deleteTreeData: supabase.deleteTreeData,
    savePerson: supabase.savePerson,
    saveUnion: supabase.saveUnion,
    handleAddSpouse,
    handleAddFirstPerson,
    handleAddChildClick,
    handleAddParentClick,
    handleDeletePerson,
    handleSavePerson: tree.handleSavePerson,
    handleResetTree,
    isResetConfirmOpen: tree.isResetConfirmOpen,
    setIsResetConfirmOpen: tree.setIsResetConfirmOpen,
  };

  return (
    <TreeProvider value={contextValue}>
      <div className="flex flex-col h-dvh w-dvw overflow-hidden bg-slate-100">
        <HeaderBar />
        <TreeCanvas />
        <SideDrawer />
        <SupabaseConfigModal />
        <LoginModal />
        <SpouseSelectorModal />
        <ParentTypeSelectorModal />
        <ConfirmResetModal />
        <ExportImportModal />
        <StatisticsModal />
      </div>
    </TreeProvider>
  );
}

export default App;
