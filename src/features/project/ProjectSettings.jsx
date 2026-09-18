import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';
import CreateProjectModal from '../../shared/CreateProjectModal';

export default function ProjectSettings() {
  const projects = useStore((s) => s.projects);
  const currentProject = useStore((s) => s.currentProject);
  const switchProject = useStore((s) => s.switchProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const loadProjects = useStore((s) => s.loadProjects);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setFormData({ ...currentProject });
    }
  }, [currentProject]);

  const handleUpdateCurrent = async (e) => {
    e.preventDefault();
    if (!currentProject) return;

    setSaving(true);
    try {
      await api.updateProject(currentProject.id, formData);
      await loadProjects();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert('Lỗi cập nhật dự án: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pId, pName) => {
    if (projects.length <= 1) {
      alert('Không thể xóa dự án duy nhất trong hệ thống!');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN dự án "${pName}" cùng toàn bộ kịch bản, nhân vật, cảnh quay liên quan?`)) {
      return;
    }

    try {
      await deleteProject(pId);
      alert(`Đã xóa dự án "${pName}".`);
    } catch (err) {
      alert('Lỗi xóa dự án: ' + err.message);
    }
  };

  return (
    <div className="project-settings-page" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="page-header__left">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '24px' }}>⚙️</span>
            <h1 className="page-header__title">Quản Lý Dự Án & Cài Đặt (Project Settings)</h1>
          </div>
          <p className="page-header__subtitle">
            Hệ thống quản lý đa dự án độc lập — Chuyển đổi linh hoạt giữa các phim/series, thiết lập tỷ lệ khung hình và nền tảng phát hành
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            + Tạo Dự Án Mới
          </button>
        </div>
      </div>

      {/* Projects Grid Overview */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📁</span> Danh Sách Dự Án Trong Studio
            <span className="badge badge--muted">{projects.length} dự án</span>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {projects.map((p) => {
            const isSelected = p.id === currentProject?.id;
            return (
              <div
                key={p.id}
                className={`card ${isSelected ? 'card--selected' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-5)',
                  position: 'relative',
                  borderWidth: isSelected ? '2px' : '1px',
                }}
              >
                {/* Top Badges */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="badge badge--primary">
                      {p.target_platform || 'TikTok'} • {p.aspect_ratio || '9:16'}
                    </span>
                    {p.genre && (
                      <span className="badge badge--muted">
                        {p.genre.split('/')[0].trim()}
                      </span>
                    )}
                  </div>
                  {isSelected ? (
                    <span className="badge badge--success">
                      ● Đang hoạt động
                    </span>
                  ) : (
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => switchProject(p.id)}
                    >
                      Chọn Làm Việc
                    </button>
                  )}
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    color: isSelected ? '#a5b4fc' : 'var(--text-primary)',
                    marginBottom: '4px'
                  }}>
                    {p.name}
                  </h3>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '36px'
                  }}>
                    {p.description || 'Chưa có mô tả chi tiết cho dự án này.'}
                  </p>
                </div>

                {/* Meta details */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  paddingTop: 'var(--space-2)',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <span>⏱️ {p.episode_min_duration || 120}s - {p.episode_max_duration || 180}s/tập</span>
                  <span style={{ marginLeft: 'auto' }}>
                    Trạng thái: <strong style={{ color: 'var(--text-secondary)' }}>{p.status || 'draft'}</strong>
                  </span>
                </div>

                {/* Card Footer Action */}
                <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                  {isSelected ? (
                    <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 500 }}>
                      ✓ Dự án hiện tại đang mở
                    </span>
                  ) : (
                    <button
                      className="btn btn--ghost btn--sm"
                      style={{ fontSize: '11px', color: 'var(--accent)' }}
                      onClick={() => switchProject(p.id)}
                    >
                      ➔ Mở dự án này
                    </button>
                  )}

                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ color: 'var(--color-error)', opacity: 0.8 }}
                    onClick={() => handleDelete(p.id, p.name)}
                    title="Xóa vĩnh viễn dự án này"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Project Details Editor */}
      {currentProject && (
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge--primary">DỰ ÁN HIỆN TẠI</span>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentProject.name}
                </h3>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Thay đổi cấu hình nền tảng, định dạng khung hình, phong cách visual và kịch bản tổng thể
              </p>
            </div>
            {saveSuccess && (
              <span className="badge badge--success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                ✓ Đã lưu cài đặt dự án thành công!
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateCurrent}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 'var(--space-4)',
              alignItems: 'start'
            }}>
              {/* Row 1 */}
              <div style={{ gridColumn: 'span 6' }}>
                <label className="label">Tên Dự Án (Project Name) *</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên dự án..."
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="label">Thể Loại (Genre)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.genre || ''}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="Tu Tiên, Đô Thị, Sci-Fi..."
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="label">Trạng Thái Dự Án</label>
                <select
                  className="select"
                  value={formData.status || 'draft'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft (Bản nháp)</option>
                  <option value="preproduction">Pre-production (Tiền kỳ)</option>
                  <option value="production">Production (Đang quay)</option>
                  <option value="completed">Completed (Hoàn thành)</option>
                  <option value="archived">Archived (Lưu trữ)</option>
                </select>
              </div>

              {/* Row 2 */}
              <div style={{ gridColumn: 'span 4' }}>
                <label className="label">Nền Tảng Phát Hành Chính</label>
                <select
                  className="select"
                  value={formData.target_platform || 'TikTok'}
                  onChange={(e) => setFormData({ ...formData, target_platform: e.target.value })}
                >
                  <option value="TikTok">TikTok (Phim Dọc)</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="YouTube">YouTube (Phim Ngang)</option>
                  <option value="Film">Điện Ảnh / Series Dài</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 4' }}>
                <label className="label">Tỷ Lệ Khung Hình Chuẩn</label>
                <select
                  className="select"
                  value={formData.aspect_ratio || '9:16'}
                  onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                >
                  <option value="9:16">9:16 (Dọc chuẩn điện thoại)</option>
                  <option value="16:9">16:9 (Ngang chuẩn màn hình)</option>
                  <option value="1:1">1:1 (Vuông mạng xã hội)</option>
                  <option value="2.35:1">2.35:1 (Điện ảnh CinemaScope)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 4' }}>
                <label className="label">Thời Lượng Mỗi Tập (Giây)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="input"
                    placeholder="Min"
                    value={formData.episode_min_duration || 120}
                    onChange={(e) => setFormData({ ...formData, episode_min_duration: parseInt(e.target.value) || 0 })}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>đến</span>
                  <input
                    type="number"
                    className="input"
                    placeholder="Max"
                    value={formData.episode_max_duration || 180}
                    onChange={(e) => setFormData({ ...formData, episode_max_duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Row 3: Full Width Textarea */}
              <div style={{ gridColumn: 'span 12' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                  <label className="label" style={{ marginBottom: 0 }}>Tóm Tắt Tổng Thể Dự Án (Synopsis)</label>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Bối cảnh khởi đầu, nhân vật trọng tâm và xung đột chính
                  </span>
                </div>
                <textarea
                  className="textarea"
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả tóm tắt tổng thể về thế giới, bối cảnh, nhân vật chính và hành trình trong câu chuyện..."
                  style={{ width: '100%', minHeight: '100px' }}
                />
              </div>

              {/* Row 4 */}
              <div style={{ gridColumn: 'span 6' }}>
                <label className="label">Phong Cách Hình Ảnh (Visual Style)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.visual_style || ''}
                  onChange={(e) => setFormData({ ...formData, visual_style: e.target.value })}
                  placeholder="Anime-style Chinese Fantasy, vibrant colors, dramatic lighting..."
                />
              </div>

              <div style={{ gridColumn: 'span 6' }}>
                <label className="label">Tông Giọng Kể Chuyện (Story Tone)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.story_tone || ''}
                  onChange={(e) => setFormData({ ...formData, story_tone: e.target.value })}
                  placeholder="Tense + Comedic + Underdog Rising..."
                />
              </div>

              {/* Submit Button */}
              <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
                <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
                  {saving ? 'Đang lưu cài đặt...' : '✓ Lưu Cập Nhật Cài Đặt'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
