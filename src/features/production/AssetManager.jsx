import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../core/api';
import { useStore } from '../../core/store';
import { ASSET_TYPES } from './productionUtils';

const EMPTY_ASSET = { asset_type: 'image', target_type: 'shot', target_id: '', file_path: '', thumbnail: '', version: 1, status: 'draft' };

export default function AssetManager() {
  const currentProject = useStore((s) => s.currentProject);
  const [assets, setAssets] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [shots, setShots] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = async () => {
    if (!currentProject) return;
    try {
      const [assetRows, sceneRows, shotRows] = await Promise.all([api.getAssets(currentProject.id), api.getScenes(currentProject.id), api.getShots(currentProject.id)]);
      setAssets(assetRows); setScenes(sceneRows); setShots(shotRows);
    } catch (err) { setError(err.message); }
  };
  useEffect(() => { load(); }, [currentProject?.id]);

  const targetNames = useMemo(() => {
    const map = {};
    scenes.forEach((scene) => { map[scene.id] = `SC${String(scene.scene_number).padStart(2, '0')} · ${scene.title}`; });
    shots.forEach((shot) => { map[shot.id] = `SH${String(shot.shot_number).padStart(2, '0')}`; });
    return map;
  }, [scenes, shots]);
  const visible = filter === 'all' ? assets : assets.filter((asset) => asset.asset_type === filter);

  const save = async (event) => {
    event.preventDefault();
    try {
      const data = { ...editing, project_id: currentProject.id, version: Number(editing.version) || 1 };
      if (editing.id) await api.updateAsset(editing.id, data); else await api.createAsset(data);
      setEditing(null); await load();
    } catch (err) { setError(err.message); }
  };
  const remove = async (asset) => {
    if (!window.confirm('Xóa asset này?')) return;
    try { await api.deleteAsset(asset.id); await load(); } catch (err) { setError(err.message); }
  };

  if (!currentProject) return <div className="empty-state"><div className="empty-state__title">Chưa chọn project</div></div>;
  return <div>
    <div className="page-header"><div className="page-header__left"><h1 className="page-header__title">📁 Asset Manager</h1><p className="page-header__subtitle">Quản lý image, video, voice, music và SFX theo Scene/Shot.</p></div><div className="page-header__actions"><span className="badge badge--primary">{assets.length} assets</span><button className="btn btn--primary" onClick={() => setEditing({ ...EMPTY_ASSET })}>＋ Thêm Asset</button></div></div>
    {error && <div className="alert alert--error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
    <div className="flex gap-2" style={{ marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}><button className={`btn btn--sm ${filter === 'all' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setFilter('all')}>Tất cả</button>{ASSET_TYPES.map((type) => <button key={type} className={`btn btn--sm ${filter === type ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setFilter(type)}>{type}</button>)}</div>
    {visible.length === 0 ? <div className="empty-state card"><div className="empty-state__icon">📁</div><div className="empty-state__title">Chưa có Asset</div><div className="empty-state__desc">Thêm đường dẫn file hoặc URL sau khi tạo hình/video/voice.</div></div> : <div className="table-container"><table className="table"><thead><tr><th>Type</th><th>Target</th><th>File</th><th>Version</th><th>Status</th><th /></tr></thead><tbody>{visible.map((asset) => <tr key={asset.id}><td><span className="badge badge--primary">{asset.asset_type}</span></td><td>{targetNames[asset.target_id] || asset.target_id || asset.target_type || 'Project'}</td><td style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.file_path || '—'}</td><td>v{asset.version || 1}</td><td><span className="badge badge--muted">{asset.status}</span></td><td><div className="flex gap-2"><button className="btn btn--ghost btn--sm" onClick={() => setEditing(asset)}>Sửa</button><button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => remove(asset)}>Xóa</button></div></td></tr>)}</tbody></table></div>}
    {editing && <div className="modal-overlay" onClick={() => setEditing(null)}><form className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()} onSubmit={save}><div className="modal__header"><h3 className="modal__title">📁 {editing.id ? 'Sửa Asset' : 'Thêm Asset'}</h3><button type="button" className="btn btn--ghost btn--icon" onClick={() => setEditing(null)}>✕</button></div><div className="modal__body"><div className="form-grid-2"><div className="form-group"><label className="label">Asset type</label><select className="input" value={editing.asset_type} onChange={(e) => setEditing({ ...editing, asset_type: e.target.value })}>{ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div><div className="form-group"><label className="label">Status</label><select className="input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option value="draft">draft</option><option value="approved_reference">approved reference</option><option value="approved">approved</option><option value="archived">archived</option></select></div><div className="form-group"><label className="label">Target type</label><select className="input" value={editing.target_type} onChange={(e) => setEditing({ ...editing, target_type: e.target.value })}><option value="character">character reference</option><option value="shot">shot</option><option value="scene">scene</option><option value="episode">episode</option><option value="project">project</option></select></div><div className="form-group"><label className="label">Version</label><input className="input" type="number" min="1" value={editing.version} onChange={(e) => setEditing({ ...editing, version: e.target.value })} /></div></div><div className="form-group"><label className="label">Target ID</label><input className="input" value={editing.target_id} onChange={(e) => setEditing({ ...editing, target_id: e.target.value })} placeholder="ID của character/shot/scene/episode" /></div><div className="form-group"><label className="label">File path / URL</label><input className="input" value={editing.file_path} onChange={(e) => setEditing({ ...editing, file_path: e.target.value })} placeholder="D:\\renders\\shot-01.png hoặc https://..." /></div><div className="form-group"><label className="label">Thumbnail URL / path</label><input className="input" value={editing.thumbnail} onChange={(e) => setEditing({ ...editing, thumbnail: e.target.value })} /></div></div><div className="modal__footer"><button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Hủy</button><button type="submit" className="btn btn--primary">💾 Lưu Asset</button></div></form></div>}
  </div>;
}
