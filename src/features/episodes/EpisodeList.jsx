import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../core/store';

export default function EpisodeList() {
  const currentProject = useStore((s) => s.currentProject);
  const episodes = useStore((s) => s.episodes);
  const loadEpisodes = useStore((s) => s.loadEpisodes);
  const storyArcs = useStore((s) => s.storyArcs);
  const loadStoryArcs = useStore((s) => s.loadStoryArcs);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentProject) {
      loadEpisodes();
      loadStoryArcs();
    }
  }, [currentProject]);

  const getArcName = (arcId) => {
    const arc = storyArcs.find((a) => a.id === arcId);
    return arc?.name || '';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🎬 Episodes</h1>
          <p className="page-header__subtitle">{episodes.length} tập phim</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary">+ Tạo Episode</button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {episodes.map((ep) => (
          <div
            key={ep.id}
            className="card card--clickable"
            onClick={() => navigate(`/episodes/${ep.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--accent-subtle), var(--bg-hover))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: 'var(--accent)', fontSize: 'var(--text-lg)',
                }}>
                  {String(ep.episode_number).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {ep.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {getArcName(ep.arc_id) && <span style={{ color: 'var(--accent)', marginRight: 'var(--space-2)' }}>{getArcName(ep.arc_id)}</span>}
                    {ep.duration_target}s · {ep.summary?.slice(0, 80)}{ep.summary?.length > 80 ? '...' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`canon-badge canon-badge--${ep.status}`}>{ep.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {episodes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">🎬</div>
          <div className="empty-state__title">Chưa có Episode nào</div>
          <div className="empty-state__desc">Tạo Story Arc trước, sau đó thêm Episodes</div>
        </div>
      )}
    </div>
  );
}
