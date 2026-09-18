import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../core/api';
import { useStore } from '../../core/store';
import ShotEditor from './ShotEditor';
import { statusClass, statusLabel } from './productionUtils';

export default function ShotList() {
  const currentProject = useStore((s) => s.currentProject);
  const [searchParams] = useSearchParams();
  const [scenes, setScenes] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [shots, setShots] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedSceneId, setSelectedSceneId] = useState(searchParams.get('scene') || 'all');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const [sceneRows, episodeRows, shotRows, characterRows, assetRows] = await Promise.all([
        api.getScenes(currentProject.id),
        api.getEpisodes(currentProject.id),
        api.getShots(currentProject.id),
        api.getCharacters(currentProject.id),
        api.getAssets(currentProject.id),
      ]);
      setScenes(sceneRows);
      setEpisodes(episodeRows);
      setShots(shotRows);
      setCharacters(characterRows);
      setAssets(assetRows);
      if (searchParams.get('scene')) setSelectedSceneId(searchParams.get('scene'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentProject?.id]);

  const episodeMap = useMemo(() => Object.fromEntries(episodes.map((episode) => [episode.id, episode])), [episodes]);
  const sceneMap = useMemo(() => Object.fromEntries(scenes.map((scene) => [scene.id, scene])), [scenes]);
  const visibleShots = selectedSceneId === 'all' ? shots : shots.filter((shot) => shot.scene_id === selectedSceneId);

  const openNew = (scene) => {
    const nextNumber = shots.filter((shot) => shot.scene_id === scene.id).reduce((max, shot) => Math.max(max, shot.shot_number || 0), 0) + 1;
    setEditing({ shot: { shot_number: nextNumber }, scene });
  };

  const generateFromScene = async (scene) => {
    try {
      await api.generateShotFromScene(scene.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeShot = async (shot) => {
    if (!window.confirm(`Xóa shot #${shot.shot_number}?`)) return;
    try {
      await api.deleteShot(shot.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (shot, status) => {
    try {
      await api.updateShot(shot.id, { status });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!currentProject || loading) return <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Đang tải production...</div></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">📷 Shots</h1>
          <p className="page-header__subtitle">Chia Scene thành các đơn vị quay và hoàn thiện prompt hình/video.</p>
        </div>
        <div className="page-header__actions">
          <span className="badge badge--primary">{shots.length} shots</span>
          <button className="btn btn--secondary" onClick={() => scenes[0] && openNew(scenes[0])} disabled={!scenes.length}>＋ Tạo Shot</button>
        </div>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="flex items-center justify-between gap-3">
          <div style={{ flex: 1 }}>
            <label className="label">Lọc theo Scene</label>
            <select className="input" value={selectedSceneId} onChange={(e) => setSelectedSceneId(e.target.value)}>
              <option value="all">Tất cả Scene ({shots.length})</option>
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>SC{String(scene.scene_number).padStart(2, '0')} · {scene.title} ({shots.filter((shot) => shot.scene_id === scene.id).length})</option>
              ))}
            </select>
          </div>
          {selectedSceneId !== 'all' && sceneMap[selectedSceneId] && (
            <div className="flex gap-2" style={{ alignSelf: 'end' }}>
              <button className="btn btn--secondary btn--sm" onClick={() => generateFromScene(sceneMap[selectedSceneId])}>⚡ Tạo từ Scene</button>
              <button className="btn btn--primary btn--sm" onClick={() => openNew(sceneMap[selectedSceneId])}>＋ Thêm Shot</button>
            </div>
          )}
        </div>
      </div>

      {visibleShots.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state__icon">🎬</div>
          <div className="empty-state__title">Chưa có Shot</div>
          <div className="empty-state__desc">Chọn một Scene rồi bấm “Tạo từ Scene” để bắt đầu Phase 3.</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Shot</th><th>Scene</th><th>Mô tả</th><th>Camera</th><th>Duration</th><th>Status</th><th /></tr></thead>
            <tbody>
              {visibleShots.map((shot) => {
                const scene = sceneMap[shot.scene_id];
                const episode = scene ? episodeMap[scene.episode_id] : null;
                return (
                  <tr key={shot.id}>
                    <td><span className="badge badge--primary">SH{String(shot.shot_number).padStart(2, '0')}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>SC{String(scene?.scene_number || '?').padStart(2, '0')}<div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{episode?.title || scene?.title}</div></td>
                    <td style={{ minWidth: 260 }}>{shot.description || '—'}</td>
                    <td>{shot.camera_shot || '—'}<div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{shot.camera_movement || ''}</div></td>
                    <td>{shot.duration || 0}s</td>
                    <td><select className={`badge ${statusClass(shot.status)}`} value={shot.status} onChange={(e) => updateStatus(shot, e.target.value)} style={{ border: 0, cursor: 'pointer' }}>{['draft', 'script_done', 'image_prompt_done', 'image_done', 'video_prompt_done', 'video_done', 'approved'].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></td>
                    <td><div className="flex gap-2"><button className="btn btn--ghost btn--sm" onClick={() => setEditing({ shot, scene })}>Mở</button><button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => removeShot(shot)}>Xóa</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <ShotEditor shot={editing.shot} scene={editing.scene} project={currentProject} characters={characters} referenceAssets={assets} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />}
    </div>
  );
}
