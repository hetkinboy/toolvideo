import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../core/store';

export default function Dashboard() {
  const currentProject = useStore((s) => s.currentProject);
  const dashboardData = useStore((s) => s.dashboardData);
  const loadDashboard = useStore((s) => s.loadDashboard);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentProject) loadDashboard();
  }, [currentProject]);

  if (!dashboardData) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">⏳</div>
        <div className="empty-state__title">Đang tải dữ liệu...</div>
      </div>
    );
  }

  const { project, stats, episode_status, scene_status, recent_scenes } = dashboardData;

  const statusStyles = {
    draft: { bg: 'var(--color-draft-bg)', color: 'var(--color-draft)' },
    approved: { bg: 'var(--color-approved-bg)', color: 'var(--color-approved)' },
    locked: { bg: 'var(--color-locked-bg)', color: 'var(--color-locked)' },
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">{project.name}</h1>
          <p className="page-header__subtitle">{project.genre} · {project.target_platform} · {project.aspect_ratio}</p>
        </div>
        <div className="page-header__actions">
          <span className={`canon-badge canon-badge--${project.status}`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid--4 mb-6">
        <div className="stat-card" onClick={() => navigate('/episodes')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__value">{stats.episodes}</div>
          <div className="stat-card__label">Episodes</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/scenes')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__value">{stats.scenes}</div>
          <div className="stat-card__label">Scenes</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/characters')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__value">{stats.characters}</div>
          <div className="stat-card__label">Characters</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.story_threads}</div>
          <div className="stat-card__label">Story Threads</div>
        </div>
      </div>

      {/* Production Progress */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">📈 Production Progress</h2>
        </div>
        <div className="card">
          <div className="flex flex-col gap-4">
            {[
              { label: 'Episodes', total: stats.episodes, done: episode_status.find(s => s.status === 'approved')?.count || 0 },
              { label: 'Scenes', total: stats.scenes, done: scene_status.find(s => s.status === 'approved')?.count || 0 },
            ].map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between mb-2" style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {p.done} / {p.total}
                  </span>
                </div>
                <div className="progress">
                  <div
                    className="progress__bar"
                    style={{ width: `${p.total > 0 ? (p.done / p.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid--2 mb-6">
        <div className="section">
          <div className="section__header">
            <h2 className="section__title">🎬 Episode Status</h2>
          </div>
          <div className="card">
            <div className="flex flex-col gap-2">
              {episode_status.map((s) => (
                <div key={s.status} className="flex items-center justify-between" style={{ fontSize: 'var(--text-sm)' }}>
                  <span className={`canon-badge canon-badge--${s.status}`}>{s.status}</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{s.count}</span>
                </div>
              ))}
              {episode_status.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Chưa có episode</span>
              )}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section__header">
            <h2 className="section__title">🎭 Scene Status</h2>
          </div>
          <div className="card">
            <div className="flex flex-col gap-2">
              {scene_status.map((s) => (
                <div key={s.status} className="flex items-center justify-between" style={{ fontSize: 'var(--text-sm)' }}>
                  <span className={`canon-badge canon-badge--${s.status}`}>{s.status}</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{s.count}</span>
                </div>
              ))}
              {scene_status.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Chưa có scene</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Continue Working */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">🚀 Continue Working</h2>
          <span className="section__subtitle">Các scene đang làm dở</span>
        </div>
        <div className="flex flex-col gap-2">
          {recent_scenes.map((scene) => (
            <div
              key={scene.id}
              className="card card--clickable"
              onClick={() => navigate(`/scenes/${scene.id}`)}
              style={{ padding: 'var(--space-3) var(--space-4)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    width: 80,
                  }}>
                    EP{String(scene.episode_number).padStart(2, '0')} · SC{String(scene.scene_number).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {scene.title || 'Untitled Scene'}
                  </span>
                </div>
                <span className={`canon-badge canon-badge--${scene.status}`}>
                  {scene.status}
                </span>
              </div>
            </div>
          ))}
          {recent_scenes.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state__icon">📝</div>
              <div className="empty-state__title">Chưa có scene nào</div>
              <div className="empty-state__desc">Tạo Episode và Scene đầu tiên để bắt đầu</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid--3 mt-4">
        <div className="stat-card">
          <div className="stat-card__value">{stats.locations}</div>
          <div className="stat-card__label">Locations</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.items}</div>
          <div className="stat-card__label">Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats.shots}</div>
          <div className="stat-card__label">Shots</div>
        </div>
      </div>
    </div>
  );
}
