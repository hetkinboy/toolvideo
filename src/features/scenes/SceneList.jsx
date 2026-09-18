import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';
import { useNavigate } from 'react-router-dom';

export default function SceneList() {
  const navigate = useNavigate();
  const currentProject = useStore((s) => s.currentProject);
  const scenes = useStore((s) => s.scenes);
  const loadScenes = useStore((s) => s.loadScenes);
  const episodes = useStore((s) => s.episodes);
  const loadEpisodes = useStore((s) => s.loadEpisodes);
  const locations = useStore((s) => s.locations);
  const loadLocations = useStore((s) => s.loadLocations);

  const [search, setSearch] = useState('');
  const [filterEpisode, setFilterEpisode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    episode_id: '',
    scene_number: 1,
    title: '',
    purpose: '',
    summary: '',
    location_id: '',
    duration: 30,
    time_of_day: 'Ban ngày',
    weather: 'Nắng',
    status: 'draft',
  });

  useEffect(() => {
    if (currentProject) {
      loadScenes();
      loadEpisodes();
      loadLocations();
    }
  }, [currentProject]);

  useEffect(() => {
    if (episodes.length > 0 && !formData.episode_id) {
      setFormData(prev => ({ ...prev, episode_id: episodes[0].id }));
    }
  }, [episodes]);

  const filtered = scenes.filter((sc) => {
    const matchSearch = (sc.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (sc.summary || '').toLowerCase().includes(search.toLowerCase()) ||
      (sc.purpose || '').toLowerCase().includes(search.toLowerCase());
    const matchEp = filterEpisode === 'all' || sc.episode_id === filterEpisode;
    const matchSt = filterStatus === 'all' || sc.status === filterStatus;
    return matchSearch && matchEp && matchSt;
  });

  const handleCreateScene = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.episode_id || !currentProject) return;

    try {
      const created = await api.createScene({
        ...formData,
        project_id: currentProject.id,
      });
      loadScenes();
      setShowAddModal(false);
      navigate(`/scenes/${created.id}`);
    } catch (err) {
      alert('Lỗi tạo cảnh: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Bạn có chắc muốn xóa Cảnh "${title}"?`)) return;
    try {
      await api.deleteScene ? await api.deleteScene(id) : await fetch(`http://localhost:3001/api/scenes/${id}`, { method: 'DELETE' });
      loadScenes();
    } catch (err) {
      alert('Lỗi xóa cảnh: ' + err.message);
    }
  };

  const getLocationName = (locId) => {
    const loc = locations.find(l => l.id === locId);
    return loc ? loc.name : 'Chưa chọn';
  };

  const getEpisodeTitle = (epId) => {
    const ep = episodes.find(e => e.id === epId);
    return ep ? `EP${String(ep.episode_number).padStart(2, '0')}: ${ep.title}` : 'Chưa gán';
  };

  return (
    <div className="scene-list-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🎭 Scenes (Tất Cả Cảnh Quay)</h1>
          <p className="page-header__subtitle">
            {scenes.length} cảnh quay trong toàn bộ dự án — Quản lý mục tiêu, phân đoạn hành động và trạng thái phê duyệt Canon
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            + Thêm Cảnh Mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card mb-4" style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Tìm kiếm cảnh quay, mục tiêu, lời thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />

        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Tập:</span>
          <select
            className="select"
            value={filterEpisode}
            onChange={(e) => setFilterEpisode(e.target.value)}
            style={{ width: 180, fontSize: '12px' }}
          >
            <option value="all">Tất cả tập phim</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id}>EP{String(ep.episode_number).padStart(2, '0')}: {ep.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Trạng thái:</span>
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 140, fontSize: '12px' }}
          >
            <option value="all">Tất cả</option>
            <option value="draft">DRAFT</option>
            <option value="approved">APPROVED</option>
            <option value="locked">LOCKED</option>
          </select>
        </div>
      </div>

      {/* Grid of Scenes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {filtered.map((sc) => (
          <div
            key={sc.id}
            className="card"
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, border-color 0.15s ease'
            }}
            onClick={() => navigate(`/scenes/${sc.id}`)}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="badge badge--primary" style={{ fontSize: '10px', marginBottom: 'var(--space-1)' }}>
                  {getEpisodeTitle(sc.episode_id)}
                </span>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Cảnh {sc.scene_number}: {sc.title || 'Chưa đặt tên'}
                </h3>
              </div>
              <span className={`badge badge--${sc.status === 'locked' ? 'warning' : sc.status === 'approved' ? 'success' : 'muted'}`}>
                {sc.status || 'draft'}
              </span>
            </div>

            {sc.purpose && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 500 }}>
                🎯 Mục tiêu: {sc.purpose}
              </div>
            )}

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              {sc.summary ? sc.summary.slice(0, 110) + (sc.summary.length > 110 ? '...' : '') : 'Chưa có tóm tắt nội dung cảnh.'}
            </p>

            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--text-muted)'
            }}>
              <span>📍 {getLocationName(sc.location_id)}</span>
              <span>⏱️ {sc.duration || 0}s</span>
              <span>🕒 {sc.time_of_day || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center mt-auto pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn btn--primary btn--sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/scenes/${sc.id}`);
                }}
              >
                ✏️ Mở Scene Editor
              </button>

              <button
                className="btn btn--ghost btn--sm"
                style={{ color: 'var(--color-error)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(sc.id, sc.title);
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center" style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
          Không tìm thấy cảnh nào phù hợp với bộ lọc.
        </div>
      )}

      {/* Modal Add Scene */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Thêm Cảnh Mới</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateScene}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="flex gap-3">
                  <div style={{ flex: 2 }}>
                    <label className="label">Thuộc Tập Phim (Episode) *</label>
                    <select
                      className="select"
                      required
                      value={formData.episode_id}
                      onChange={(e) => setFormData({ ...formData, episode_id: e.target.value })}
                    >
                      {episodes.map(ep => (
                        <option key={ep.id} value={ep.id}>EP{String(ep.episode_number).padStart(2, '0')}: {ep.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Số Thứ Tự Cảnh</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.scene_number}
                      onChange={(e) => setFormData({ ...formData, scene_number: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Tiêu Đề Cảnh *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Quỳ Trước Đại Sảnh, Đêm Tối Bị Ám Sát..."
                  />
                </div>

                <div>
                  <label className="label">Mục Tiêu Của Cảnh (Scene Purpose)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="VD: Tạo mâu thuẫn gia tộc, kích hoạt hệ thống..."
                  />
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Bối Cảnh (Location)</label>
                    <select
                      className="select"
                      value={formData.location_id}
                      onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    >
                      <option value="">-- Chọn Địa Điểm --</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Thời Lượng Dự Kiến (Giây)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Tóm Tắt Diễn Biến Cảnh</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Tóm tắt ngắn hành động, bước ngoặt cảm xúc trong cảnh..."
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Khởi Tạo & Mở Editor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
