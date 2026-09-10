import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export const useSupabase = () => {
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('sb_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('sb_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [supabaseBucket, setSupabaseBucket] = useState(() => localStorage.getItem('sb_bucket') || import.meta.env.VITE_SUPABASE_BUCKET || 'fotos');
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      try {
        const client = createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);

        client.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user || null);
          setIsAdmin(!!session?.user);
        });

        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
          setIsAdmin(!!session?.user);
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('Gagal inisialisasi Supabase client:', err);
      }
    }
  }, [supabaseUrl, supabaseKey]);

  const saveConfig = () => {
    localStorage.setItem('sb_url', supabaseUrl.trim());
    localStorage.setItem('sb_key', supabaseKey.trim());
    localStorage.setItem('sb_bucket', supabaseBucket.trim());
    setIsConfigModalOpen(false);
    window.location.reload();
  };

  const login = async (email, password) => {
    setLoginError('');
    if (!supabaseClient) {
      setLoginError('Harap atur Supabase URL & Anon Key terlebih dahulu.');
      return false;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoginError(error.message);
      return false;
    }
    setIsLoginModalOpen(false);
    setLoginError('');
    return true;
  };

  const logout = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setIsAdmin(false);
    setUser(null);
  };

  const deleteTreeData = async () => {
    if (!supabaseClient) return false;
    try {
      const { data: peopleData } = await supabaseClient
        .from('people')
        .select('photo')
        .not('photo', 'is', null);

      console.debug('[reset] bucket:', supabaseBucket);
      console.debug('[reset] peopleData:', peopleData);

      const photoPaths = [];
      if (peopleData && peopleData.length > 0) {
        for (const person of peopleData) {
          if (!person.photo) continue;
          try {
            const url = new URL(person.photo);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const bucketIndex = pathParts.indexOf(supabaseBucket);
            if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
              photoPaths.push(pathParts.slice(bucketIndex + 1).join('/'));
            }
          } catch {
            // ignore invalid photo URLs
          }
        }
      }

      console.debug('[reset] photoPaths:', photoPaths);

      if (photoPaths.length > 0) {
        const { error: removeError, data: removeData } = await supabaseClient.storage
          .from(supabaseBucket)
          .remove(photoPaths);
        console.debug('[reset] storage remove result:', removeError, removeData);
        if (removeError) throw removeError;
      }

      const { error: peopleError } = await supabaseClient
        .from('people')
        .delete()
        .neq('id', '');
      if (peopleError) throw peopleError;

      const { error: unionsError } = await supabaseClient
        .from('unions')
        .delete()
        .neq('id', '');
      if (unionsError) throw unionsError;

      return true;
    } catch (err) {
      console.error('Gagal menghapus data dari Supabase:', err);
      return false;
    }
  };

  const deletePerson = async (personId) => {
    if (!supabaseClient) return false;
    try {
      // IMPORTANT: only delete unions where the person is a PARTNER.
      // Unions where the person is merely a CHILD must be KEPT (their
      // children_ids updated) — deleting them wiped the parents' marriage
      // row and orphaned all their siblings in the database.
      const { data: allUnions, error: fetchError } = await supabaseClient
        .from('unions')
        .select('*');
      if (fetchError) throw fetchError;

      for (const row of allUnions || []) {
        const children = row.children_ids || [];
        const isPartner = row.partner1_id === personId || row.partner2_id === personId;
        const isChild = children.includes(personId);

        if (isPartner) {
          const { error } = await supabaseClient
            .from('unions')
            .delete()
            .eq('id', row.id);
          if (error) throw error;
        } else if (isChild) {
          const { error } = await supabaseClient
            .from('unions')
            .update({ children_ids: children.filter((c) => c !== personId) })
            .eq('id', row.id);
          if (error) throw error;
        }
      }

      const { error: peopleError } = await supabaseClient
        .from('people')
        .delete()
        .eq('id', personId);
      if (peopleError) throw peopleError;

      return true;
    } catch (err) {
      console.error('Gagal menghapus orang dari Supabase:', err);
      return false;
    }
  };

  const savePerson = async (person) => {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient.from('people').upsert({
        id: person.id,
        name: person.name,
        nickname: person.nickname,
        gender: person.gender,
        birth_year: person.birthYear,
        death_year: person.deathYear,
        is_deceased: person.isDeceased,
        domicile: person.domicile,
        bio: person.bio,
        photo: person.photo,
        notes: person.notes,
        x: person.x,
        y: person.y,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Gagal menyimpan orang ke Supabase:', err);
      return false;
    }
  };

  const saveUnion = async (union) => {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient.from('unions').upsert({
        id: union.id,
        partner1_id: union.partner1Id,
        partner2_id: union.partner2Id,
        children_ids: union.childrenIds || [],
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Gagal menyimpan union ke Supabase:', err);
      return false;
    }
  };

  const fetchTreeData = async () => {
    if (!supabaseClient) return null;
    try {
      const { data: peopleData } = await supabaseClient.from('people').select('*');
      const { data: unionsData } = await supabaseClient.from('unions').select('*');

      if (peopleData && peopleData.length > 0) {
        const formattedPeople = {};
        peopleData.forEach((p) => {
          formattedPeople[p.id] = {
            id: p.id,
            name: p.name,
            nickname: p.nickname,
            gender: p.gender,
            birthYear: p.birth_year || '',
            deathYear: p.death_year || '',
            isDeceased: p.is_deceased || false,
            domicile: p.domicile || '',
            bio: p.bio || '',
            photo: p.photo || '',
            notes: p.notes || '',
            x: p.x || 0,
            y: p.y || 0,
          };
        });

        const formattedUnions = {};
        (unionsData || []).forEach((u) => {
          formattedUnions[u.id] = {
            id: u.id,
            partner1Id: u.partner1_id,
            partner2Id: u.partner2_id,
            childrenIds: u.children_ids || [],
          };
        });

        return { people: formattedPeople, unions: formattedUnions };
      }
    } catch (err) {
      console.error('Gagal mengambil data dari Supabase DB:', err);
    }
    return null;
  };

  return {
    supabaseUrl,
    setSupabaseUrl,
    supabaseKey,
    setSupabaseKey,
    supabaseBucket,
    setSupabaseBucket,
    supabaseClient,
    user,
    isAdmin,
    loginError,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,
    isUploadingPhoto,
    setIsUploadingPhoto,
    saveConfig,
    login,
    logout,
    fetchTreeData,
    deleteTreeData,
    deletePerson,
    savePerson,
    saveUnion,
    setLoginError,
  };
};
