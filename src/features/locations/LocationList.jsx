import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function LocationList() {
  const currentProject = useStore((s) => s.currentProject);
  const locations = useStore((s) => s.locations);
  const loadLocations = useStore((s) => s.loadLocations);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'indoor',
    description: '',
    architecture: '',
    environment: '',
    colors: '',
    lighting: '',
    default_weather: 'Nắng',
    important_objects: '',
    layout_description: '',
    visual_prompt: '',
    status: 'draft',
  });

  useEffect(() => {
    if (currentProject) loadLocations();
  }, [currentProject]);

  const filtered = locations.filter((loc) => {
    const matchSearch = loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || loc.type === filterType;
    return matchSearch && matchType;
  });

  const handleOpenModal = (loc = null) => {
    if (loc) {
      setSelectedLocation(loc);
      setFormData({ ...loc });
    } else {
      setSelectedLocation(null);
      setFormData({
        name: '',
        type: 'indoor',
        description: '',
        architecture: '',
        environment: '',
        colors: '',
        lighting: '',
        default_weather: 'Nắng',
        important_objects: '',
        layout_description: '',
        visual_prompt: '',
        status: 'draft',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentProject) return;

    try {
      if (selectedLocation) {
        await api.updateLocation(selectedLocation.id, formData);
      } else {
        await api.createLocation({ ...formData, project_id: currentProject.id });
      }
      loadLocations();
      setShowModal(false);
    } catch (err) {
      alert('Lỗi lưu địa điểm: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa địa điểm này?')) return;
    try {
      await api.deleteLocation(id);
      loadLocations();
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  const handleCopyPrompt = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="location-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🏛️ Locations (Địa Điểm)</h1>
          <p className="page-header__subtitle">
            {locations.length} bối cảnh thế giới — Lưu trữ cấu trúc, màu sắc, ánh sáng và Visual Prompt cho AI
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            + Thêm Địa Điểm
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card mb-4" style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Tìm kiếm địa điểm, bối cảnh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div className="flex gap-2">
          {['all', 'estate', 'training_ground', 'secret_room', 'indoor', 'outdoor'].map((t) => (
            <button
              key={t}
              className={`btn btn--sm ${filterType === t ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? 'Tất cả' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {filtered.map((loc) => (
          <div key={loc.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="badge badge--primary" style={{ marginBottom: 'var(--space-1)', textTransform: 'uppercase', fontSize: '10px' }}>
                  {loc.type || 'Chung'}
                </span>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {loc.name}
                </h3>
              </div>
              <span className={`badge badge--${loc.status === 'locked' ? 'warning' : loc.status === 'approved' ? 'success' : 'muted'}`}>
                {loc.status || 'draft'}
              </span>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
              {loc.description || 'Chưa có mô tả chi tiết.'}
            </p>

            {/* Architecture & Visual details */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)'
            }}>
              {loc.architecture && (
                <div><span style={{ color: 'var(--text-muted)' }}>Kiến trúc:</span> {loc.architecture}</div>
              )}
              {loc.lighting && (
                <div><span style={{ color: 'var(--text-muted)' }}>Ánh sáng:</span> {loc.lighting}</div>
              )}
              {loc.colors && (
                <div><span style={{ color: 'var(--text-muted)' }}>Tông màu:</span> {loc.colors}</div>
              )}
              {loc.important_objects && (
                <div><span style={{ color: 'var(--text-muted)' }}>Vật thể then chốt:</span> {loc.important_objects}</div>
              )}
            </div>

            {/* Visual Prompt Section */}
            {loc.visual_prompt && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
              }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>✨ Visual Prompt (AI Image):</span>
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ padding: '2px 6px', fontSize: '11px' }}
                    onClick={() => handleCopyPrompt(loc.visual_prompt, loc.id)}
                  >
                    {copiedId === loc.id ? '✓ Đã chép' : '📋 Chép Prompt'}
                  </button>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  maxHeight: '60px',
                  overflowY: 'auto'
                }}>
                  {loc.visual_prompt}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => handleOpenModal(loc)}>
                ✏️ Chỉnh sửa
              </button>
              <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(loc.id)}>
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center" style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
          Không tìm thấy địa điểm nào phù hợp.
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedLocation ? 'Chỉnh Sửa Địa Điểm' : 'Thêm Địa Điểm Mới'}</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="flex gap-3">
                  <div style={{ flex: 2 }}>
                    <label className="label">Tên Địa Điểm *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Lâm Gia Đại Viện..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Phân Loại</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="estate, secret_room..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Trạng Thái</label>
                    <select
                      className="select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="draft">DRAFT</option>
                      <option value="approved">APPROVED</option>
                      <option value="locked">LOCKED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Mô Tả Tổng Quan</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả bối cảnh diễn ra câu chuyện..."
                  />
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Phong Cách Kiến Trúc</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.architecture}
                      onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                      placeholder="Cổ trang, hiện đại..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Môi Trường / Thiên Nhiên</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.environment}
                      onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                      placeholder="Vườn hoa, hang đá, thung lũng..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Tông Màu</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                      placeholder="Đỏ, vàng kim, lam tối..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Ánh Sáng & Thời Tiết</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.lighting}
                      onChange={(e) => setFormData({ ...formData, lighting: e.target.value })}
                      placeholder="Nắng sớm, đèn lồng đêm..."
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Vật Thể Quan Trọng</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.important_objects}
                    onChange={(e) => setFormData({ ...formData, important_objects: e.target.value })}
                    placeholder="Bàn thờ cổ, tượng rồng, giá vũ khí..."
                  />
                </div>

                <div>
                  <label className="label">Visual Prompt (Dành cho AI sinh ảnh Midjourney / Stable Diffusion)</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={formData.visual_prompt}
                    onChange={(e) => setFormData({ ...formData, visual_prompt: e.target.value })}
                    placeholder="Grand ancient Chinese estate, ornate architecture, dramatic lighting, 8k resolution..."
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Địa Điểm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
