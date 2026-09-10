export const importJSON = async (file, ctx) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload.people || !payload.unions) {
          throw new Error('Format JSON tidak valid. File harus mengandung people dan unions.');
        }

        let people = { ...payload.people };
        let unions = { ...payload.unions };

        if (Object.keys(people).length === 0) {
          throw new Error('Data pohon kosong.');
        }

        let uploadedCount = 0;
        const photoPromises = [];

        Object.values(people).forEach((person) => {
          if (person.photoBase64) {
            const p = { ...person };
            photoPromises.push(
              (async () => {
                try {
                  const publicUrl = await uploadBase64ToStorage(p.photoBase64, ctx.supabaseClient, ctx.supabaseBucket);
                  p.photo = publicUrl;
                  delete p.photoBase64;
                } catch {
                  p.photo = '';
                  delete p.photoBase64;
                }
                return p;
              })()
            );
          }
        });

        if (photoPromises.length > 0) {
          const results = await Promise.all(photoPromises);
          results.forEach((p) => {
            people[p.id] = p;
          });
          uploadedCount = results.filter((p) => p.photo).length;
        }

        if (ctx.supabaseClient) {
          if (typeof ctx.deleteTreeData !== 'function') {
            throw new Error('Fitur penghapusan data Supabase belum tersedia. Muat ulang aplikasi lalu coba lagi.');
          }

          const deleted = await ctx.deleteTreeData();
          if (!deleted) {
            throw new Error('Gagal menghapus data lama di Supabase.');
          }
        }

        const peoplePromises = [];
        Object.values(people).forEach((person) => {
          peoplePromises.push(ctx.savePerson(person));
        });

        await Promise.all(peoplePromises);

        const unionPromises = [];
        Object.values(unions).forEach((union) => {
          unionPromises.push(ctx.saveUnion(union));
        });

        await Promise.all(unionPromises);

        ctx.setPeople(people);
        ctx.setUnions(unions);

        resolve({
          peopleCount: Object.keys(people).length,
          unionsCount: Object.keys(unions).length,
          uploadedPhotos: uploadedCount,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsText(file);
  });
};

const uploadBase64ToStorage = async (base64DataUrl, supabaseClient, bucket) => {
  if (!supabaseClient || !base64DataUrl) return '';

  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return '';

  const mimeType = matches[1];
  const base64Data = matches[2];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const ext = mimeType.split('/')[1] || 'jpg';
  const filePath = `avatars/import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabaseClient.storage.from(bucket).upload(filePath, blob, {
    upsert: true,
    contentType: mimeType,
  });

  if (error) throw error;

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || '';
};
