import { toSvg, toBlob } from 'html-to-image';

export const fileDownload = (blob, filename) => {
  if (!blob || blob.size === 0) {
    throw new Error('Hasil export kosong atau tidak valid.');
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Gagal membuat file download:', err);
    throw new Error('Gagal membuat file download. Coba lagi atau gunakan format lain.');
  }
};

export const fetchPhotoBase64 = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const exportJSON = async (people, unions, includePhotos = false) => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    people,
    unions,
  };

  if (includePhotos) {
    const peopleArray = Object.values(people);
    for (let i = 0; i < peopleArray.length; i++) {
      const person = peopleArray[i];
      if (person.photo) {
        const base64 = await fetchPhotoBase64(person.photo);
        if (base64) {
          payload.people = { ...payload.people, [person.id]: { ...person, photoBase64: base64 } };
        }
      }
    }
  }

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  fileDownload(blob, `family-tree-${Date.now()}.json`);
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const createHtmlConnections = (people, unions, minX, minY, layoutDirection) => {
  const isVertical = layoutDirection === 'vertical';
  const personUnionsMap = {};
  Object.values(unions).forEach((union) => {
    [union.partner1Id, union.partner2Id].filter(Boolean).forEach((personId) => {
      if (!personUnionsMap[personId]) personUnionsMap[personId] = [];
      personUnionsMap[personId].push(union);
    });
  });

  const path = (d, color) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="5 4" />`;
  const translate = (value, offset) => value - offset;

  return Object.values(unions).map((union, index) => {
    const first = people[union.partner1Id];
    const second = people[union.partner2Id];
    if (!first && !second) return '';

    const children = (union.childrenIds || []).map((id) => people[id]).filter(Boolean);
    const firstUnions = first ? personUnionsMap[first.id] || [] : [];
    const secondUnions = second ? personUnionsMap[second.id] || [] : [];
    const firstIndex = firstUnions.findIndex((item) => item.id === union.id);
    const secondIndex = secondUnions.findIndex((item) => item.id === union.id);
    const color = ['#db2777', '#7c3aed', '#059669', '#d97706', '#0891b2', '#e11d48', '#4f46e5', '#65a30d'][index % 8];
    const paths = [];
    let unionX;
    let unionY;

    if (!isVertical) {
      const firstAnchorY = first
        ? first.y + (firstUnions.length > 1 ? (110 * (firstIndex + 1)) / (firstUnions.length + 1) : 55)
        : 0;
      const secondAnchorY = second
        ? second.y + (secondUnions.length > 1 ? (110 * (secondIndex + 1)) / (secondUnions.length + 1) : 55)
        : 0;
      const childYs = children.map((child) => child.y + 55);
      const childCenterY = childYs.length ? (Math.min(...childYs) + Math.max(...childYs)) / 2 : null;
      const spouseTier = Math.max(firstIndex >= 0 ? firstIndex : 0, secondIndex >= 0 ? secondIndex : 0);
      unionX = Math.max(first ? first.x + 220 : 0, second ? second.x + 220 : 0) + 40 + spouseTier * 35;
      unionY = childCenterY ?? (first ? firstAnchorY : secondAnchorY);
      const minV = Math.min(...[firstAnchorY, secondAnchorY, unionY].filter((value) => value));
      const maxV = Math.max(firstAnchorY, secondAnchorY, unionY);
      if (first) paths.push(`M ${translate(first.x + 220, minX)} ${translate(firstAnchorY, minY)} H ${translate(unionX, minX)}`);
      if (second) paths.push(`M ${translate(second.x + 220, minX)} ${translate(secondAnchorY, minY)} H ${translate(unionX, minX)}`);
      paths.push(`M ${translate(unionX, minX)} ${translate(minV, minY)} V ${translate(maxV, minY)}`);
      if (children.length) {
        const midX = unionX + 40;
        paths.push(`M ${translate(unionX, minX)} ${translate(unionY, minY)} H ${translate(midX, minX)}`);
        paths.push(`M ${translate(midX, minX)} ${translate(Math.min(...childYs), minY)} V ${translate(Math.max(...childYs), minY)}`);
        children.forEach((child) => paths.push(`M ${translate(midX, minX)} ${translate(child.y + 55, minY)} H ${translate(child.x, minX)}`));
      }
    } else {
      const firstAnchorX = first
        ? first.x + (firstUnions.length > 1 ? (220 * (firstIndex + 1)) / (firstUnions.length + 1) : 110)
        : 0;
      const secondAnchorX = second
        ? second.x + (secondUnions.length > 1 ? (220 * (secondIndex + 1)) / (secondUnions.length + 1) : 110)
        : 0;
      const childXs = children.map((child) => child.x + 110);
      const childCenterX = childXs.length ? (Math.min(...childXs) + Math.max(...childXs)) / 2 : null;
      const spouseTier = Math.max(firstIndex >= 0 ? firstIndex : 0, secondIndex >= 0 ? secondIndex : 0);
      unionY = Math.max(first ? first.y + 110 : 0, second ? second.y + 110 : 0) + 30 + spouseTier * 25;
      unionX = childCenterX ?? (first ? firstAnchorX : secondAnchorX);
      const minH = Math.min(...[firstAnchorX, secondAnchorX, unionX].filter((value) => value));
      const maxH = Math.max(firstAnchorX, secondAnchorX, unionX);
      if (first) paths.push(`M ${translate(firstAnchorX, minX)} ${translate(first.y + 110, minY)} V ${translate(unionY, minY)}`);
      if (second) paths.push(`M ${translate(secondAnchorX, minX)} ${translate(second.y + 110, minY)} V ${translate(unionY, minY)}`);
      paths.push(`M ${translate(minH, minX)} ${translate(unionY, minY)} H ${translate(maxH, minX)}`);
      if (children.length) {
        const midY = unionY + 30;
        paths.push(`M ${translate(unionX, minX)} ${translate(unionY, minY)} V ${translate(midY, minY)}`);
        paths.push(`M ${translate(Math.min(...childXs), minX)} ${translate(midY, minY)} H ${translate(Math.max(...childXs), minX)}`);
        children.forEach((child) => paths.push(`M ${translate(child.x + 110, minX)} ${translate(midY, minY)} V ${translate(child.y, minY)}`));
      }
    }

    return `<g>${paths.map((value) => path(value, color)).join('')}</g>`;
  }).join('');
};

export const exportHTML = async (people, unions, layoutDirection = 'horizontal') => {
  const peopleArray = Object.values(people);
  const validPeople = peopleArray.filter(
    (person) => Number.isFinite(person.x) && Number.isFinite(person.y)
  );
  const padding = 168;
  const minX = validPeople.length ? Math.min(...validPeople.map((person) => person.x)) - padding : 0;
  const minY = validPeople.length ? Math.min(...validPeople.map((person) => person.y)) - padding : 0;
  const maxX = validPeople.length ? Math.max(...validPeople.map((person) => person.x + 220)) + padding : 220 + padding * 2;
  const maxY = validPeople.length ? Math.max(...validPeople.map((person) => person.y + 110)) + padding : 110 + padding * 2;
  const width = maxX - minX;
  const height = maxY - minY;
  const connectionsHtml = createHtmlConnections(people, unions, minX, minY, layoutDirection);
  const peopleHtml = (await Promise.all(validPeople.map(async (p) => {
      const photo = p.photo ? await fetchPhotoBase64(p.photo) : null;
      return `
    <div class="person-card" style="left:${p.x - minX}px;top:${p.y - minY}px;">
      <div class="card-header">
        ${photo ? `<img src="${photo}" alt="${escapeHtml(p.name)}" />` : `<div class="avatar">${escapeHtml((p.nickname || p.name || 'T').charAt(0).toUpperCase())}</div>`}
        <div>
          <div class="name">${escapeHtml(p.nickname || p.name || 'Tanpa Nama')}</div>
          <div class="meta">${escapeHtml(p.birthYear || '')}${p.birthYear && p.deathYear ? ' - ' : ''}${escapeHtml(p.deathYear || '')}${p.isDeceased ? ' (Wafat)' : ''}</div>
        </div>
      </div>
      ${p.notes ? `<div class="notes">${escapeHtml(p.notes)}</div>` : ''}
    </div>
  `;
    }))).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Family Tree</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: 'Inter', sans-serif; background: #f8fafc; }
  .viewport { width: 100%; height: 100%; overflow: hidden; cursor: grab; touch-action: none; }
  .viewport:active { cursor: grabbing; }
  .transform-layer { transform-origin: 0 0; position: absolute; top: 0; left: 0; }
  .tree-container { position: relative; width: ${width}px; height: ${height}px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
  .connections { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
  .person-card {
    position: absolute;
    width: 220px;
    height: 110px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 2px solid #e2e8f0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-header { display: flex; align-items: center; gap: 10px; }
  .card-header img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: #dbeafe; color: #1e40af; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
  .name { font-weight: 600; font-size: 13px; color: #1e293b; }
  .meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .notes { font-size: 10px; color: #94a3b8; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 6px; margin-top: 4px; }
  .controls { position: fixed; bottom: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
  .controls button { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); cursor: pointer; font-size: 16px; color: #334155; display: flex; align-items: center; justify-content: center; }
  .controls button:hover { background: #f1f5f9; }
  .hint { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); font-size: 11px; color: #94a3b8; background: rgba(255,255,255,0.9); padding: 4px 10px; border-radius: 999px; border: 1px solid #e2e8f0; pointer-events: none; z-index: 10; }
</style>
</head>
<body>
  <div class="hint">Drag untuk menggeser • Scroll untuk zoom</div>
  <div class="viewport" id="viewport">
    <div class="transform-layer" id="layer">
      <div class="tree-container">
        <svg class="connections" width="${width}" height="${height}" aria-hidden="true">${connectionsHtml}</svg>
        ${peopleHtml}
      </div>
    </div>
  </div>
  <div class="controls">
    <button id="zoomIn" title="Zoom in">+</button>
    <button id="zoomOut" title="Zoom out">−</button>
    <button id="resetView" title="Reset">⟲</button>
  </div>
  <script>
    (function() {
      const viewport = document.getElementById('viewport');
      const layer = document.getElementById('layer');
      const zoomIn = document.getElementById('zoomIn');
      const zoomOut = document.getElementById('zoomOut');
      const resetView = document.getElementById('resetView');

      let scale = 1;
      let panning = false;
      let pointX = 0;
      let pointY = 0;
      let startX = 0;
      let startY = 0;
      let viewX = 0;
      let viewY = 0;

      const minScale = 0.1;
      const maxScale = 5;

      function setTransform() {
        layer.style.transform = 'translate(' + viewX + 'px, ' + viewY + 'px) scale(' + scale + ')';
      }

      function clampScale(value) {
        return Math.max(minScale, Math.min(maxScale, value));
      }

      function zoomAt(newScale, clientX, clientY) {
        newScale = clampScale(newScale);
        const rect = viewport.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        viewX = x - (x - viewX) * (newScale / scale);
        viewY = y - (y - viewY) * (newScale / scale);
        scale = newScale;
        setTransform();
      }

      viewport.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        panning = true;
        startX = e.clientX - viewX;
        startY = e.clientY - viewY;
        viewport.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', function(e) {
        if (!panning) return;
        e.preventDefault();
        viewX = e.clientX - startX;
        viewY = e.clientY - startY;
        setTransform();
      });

      window.addEventListener('mouseup', function() {
        panning = false;
        viewport.style.cursor = 'grab';
      });

      viewport.addEventListener('wheel', function(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        zoomAt(scale * factor, e.clientX, e.clientY);
      }, { passive: false });

      let lastTouchDistance = null;
      let lastTouchCenter = null;

      viewport.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
          panning = true;
          startX = e.touches[0].clientX - viewX;
          startY = e.touches[0].clientY - viewY;
        } else if (e.touches.length === 2) {
          panning = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastTouchDistance = Math.hypot(dx, dy);
          lastTouchCenter = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          };
        }
      }, { passive: false });

      viewport.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1 && panning) {
          e.preventDefault();
          viewX = e.touches[0].clientX - startX;
          viewY = e.touches[0].clientY - startY;
          setTransform();
        } else if (e.touches.length === 2 && lastTouchDistance !== null) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const distance = Math.hypot(dx, dy);
          const center = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          };
          if (lastTouchDistance > 0) {
            zoomAt(scale * (distance / lastTouchDistance), center.x, center.y);
          }
          lastTouchDistance = distance;
          lastTouchCenter = center;
        }
      }, { passive: false });

      viewport.addEventListener('touchend', function() {
        panning = false;
        lastTouchDistance = null;
        lastTouchCenter = null;
      });

      zoomIn.addEventListener('click', function() {
        zoomAt(scale * 1.2, window.innerWidth / 2, window.innerHeight / 2);
      });

      zoomOut.addEventListener('click', function() {
        zoomAt(scale * 0.8, window.innerWidth / 2, window.innerHeight / 2);
      });

      resetView.addEventListener('click', function() {
        scale = 1;
        viewX = 0;
        viewY = 0;
        setTransform();
      });

      setTransform();
    })();
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  fileDownload(blob, `family-tree-${Date.now()}.html`);
};

export const exportImage = async (element, format = 'png') => {
  if (!element) return;

  const peopleCount = Object.keys(JSON.parse(element.dataset.people || '{}')).length;
  if (peopleCount > 50) {
    const confirmed = window.confirm(
      `Pohon memiliki ${peopleCount} anggota. Export gambar mungkin memakan waktu dan memori. Lanjutkan?`
    );
    if (!confirmed) return;
  }

  try {
    const options = {
      backgroundColor: '#ffffff',
      pixelRatio: format === 'png' ? 2 : undefined,
      imagePlaceholder: '',
    };

    const inlineImages = async (root) => {
      const imgs = root.querySelectorAll('img');
      const replacements = [];
      for (const img of imgs) {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) continue;
        const base64 = await fetchPhotoBase64(src);
        if (!base64) continue;
        replacements.push({ img, src });
        img.setAttribute('src', base64);
      }
      return () => {
        replacements.forEach(({ img, src }) => img.setAttribute('src', src));
      };
    };

    const restore = await inlineImages(element);

    let blob;
    if (format === 'svg') {
      const svgDataUrl = await toSvg(element, options);
      const svgResponse = await fetch(svgDataUrl);
      if (!svgResponse.ok) {
        restore();
        throw new Error('Gagal membaca hasil SVG.');
      }
      blob = await svgResponse.blob();
      restore();
    } else {
      blob = await toBlob(element, options);
      if (!blob) {
        throw new Error('Gagal membuat gambar. Coba kurangi ukuran pohon atau nonaktifkan foto.');
      }
      restore();
    }

    if (blob.size === 0) {
      throw new Error('Hasil export kosong. Coba perbesar area ekspor atau kurangi jumlah anggota.');
    }

    const ext = format === 'svg' ? 'svg' : format;
    fileDownload(blob, `family-tree-${Date.now()}.${ext}`);
  } catch (err) {
    console.error('Export gagal:', err);
    alert('Gagal export gambar: ' + (err.message || 'Pastikan semua foto dapat diakses.'));
  }
};
