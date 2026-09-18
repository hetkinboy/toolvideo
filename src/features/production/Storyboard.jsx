import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../core/api';
import { useStore } from '../../core/store';
import { statusClass, statusLabel } from './productionUtils';

export default function Storyboard() {
  const currentProject = useStore((s) => s.currentProject);
  const navigate = useNavigate();
  const [scenes, setScenes] = useState([]);
  const [shots, setShots] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [episodeFilter, setEpisodeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const [sceneRows, shotRows, episodeRows] = await Promise.all([
        api.getScenes(currentProject.id), api.getShots(currentProject.id), api.getEpisodes(currentProject.id),
      ]);
      setScenes(sceneRows); setShots(shotRows); setEpisodes(episodeRows);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentProject?.id]);

  const episodeMap = useMemo(() => Object.fromEntries(episodes.map((episode) => [episode.id, episode])), [episodes]);
  const filteredScenes = scenes.filter((scene) => episodeFilter === 'all' || scene.episode_id === episodeFilter);
  const shotsByScene = useMemo(() => shots.reduce((acc, shot) => { (acc[shot.scene_id] ||= []).push(shot); return acc; }, {}), [shots]);

  const createShot = async (scene) => {
    try { await api.generateShotFromScene(scene.id); await load(); } catch (err) { setError(err.message); }
  };

  if (!currentProject || loading) return <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Đang tải storyboard...</div></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left"><h1 className="page-header__title">🖼️ Storyboard</h1><p className="page-header__subtitle">Nhìn toàn bộ nhịp quay của từng Scene trước khi tạo hình và video.</p></div>
        <div className="page-header__actions"><span className="badge badge--primary">{shots.length} shots</span><button className="btn btn--secondary" onClick={() => navigate('/shots')}>Quản lý Shots</button></div>
      </div>
      {error && <div className="alert alert--error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <label className="label">Episode</label>
        <select className="input" value={episodeFilter} onChange={(e) => setEpisodeFilter(e.target.value)}><option value="all">Tất cả Episode</option>{episodes.map((episode) => <option key={episode.id} value={episode.id}>EP{String(episode.episode_number).padStart(2, '0')} · {episode.title}</option>)}</select>
      </div>
      <div className="flex flex-col gap-6">
        {filteredScenes.map((scene) => {
          const sceneShots = (shotsByScene[scene.id] || []).sort((a, b) => a.shot_number - b.shot_number);
          return <section key={scene.id} className="section">
            <div className="section__header"><div><h2 className="section__title">SC{String(scene.scene_number).padStart(2, '0')} · {scene.title}</h2><span className="section__subtitle">{episodeMap[scene.episode_id]?.title || 'Episode'} · {sceneShots.length} shots</span></div><div className="flex gap-2"><button className="btn btn--secondary btn--sm" onClick={() => createShot(scene)}>⚡ Tạo Shot</button><button className="btn btn--ghost btn--sm" onClick={() => navigate(`/shots?scene=${scene.id}`)}>Mở Editor</button></div></div>
            {sceneShots.length === 0 ? <div className="card" style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>Chưa có shot cho Scene này.</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>{sceneShots.map((shot) => <div key={shot.id} className="card" style={{ padding: 0, overflow: 'hidden' }}><div style={{ height: 120, background: 'linear-gradient(135deg, rgba(99,102,241,.25), rgba(15,15,25,.95))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 34 }}>🎞️</div><div style={{ padding: 'var(--space-4)' }}><div className="flex items-center justify-between"><span className="badge badge--primary">SH{String(shot.shot_number).padStart(2, '0')}</span><span className={`badge ${statusClass(shot.status)}`}>{statusLabel(shot.status)}</span></div><div style={{ marginTop: 'var(--space-3)', minHeight: 44, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{shot.description || 'Chưa có mô tả'}</div><div style={{ marginTop: 'var(--space-3)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{shot.camera_shot || 'camera'} · {shot.duration || 0}s</div><button className="btn btn--ghost btn--sm w-full" style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate(`/shots?scene=${scene.id}`)}>Mở Shot Editor →</button></div></div>)}</div>}
          </section>;
        })}
      </div>
      {filteredScenes.length === 0 && <div className="empty-state card"><div className="empty-state__icon">🖼️</div><div className="empty-state__title">Chưa có Scene</div></div>}
    </div>
  );
}
