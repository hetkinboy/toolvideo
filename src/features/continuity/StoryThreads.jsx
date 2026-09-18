import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function StoryThreads() {
  const currentProject = useStore((s) => s.currentProject);
  const storyThreads = useStore((s) => s.storyThreads);
  const loadStoryThreads = useStore((s) => s.loadStoryThreads);

  const [selectedThread, setSelectedThread] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    introduced_episode: 'EP01',
    introduced_scene: 'SC01',
    priority: 'normal',
    planned_resolution_episode: 'EP05',
    resolved_episode: '',
    status: 'open',
  });

  useEffect(() => {
    if (currentProject) loadStoryThreads();
  }, [currentProject]);

  const columns = [
    { key: 'open', label: 'Mở (Open)', color: 'var(--color-info)' },
    { key: 'developing', label: 'Đang Phát Triển', color: 'var(--color-warning)' },
    { key: 'ready_to_resolve', label: 'Sắp Giải Quyết', color: 'var(--accent)' },
    { key: 'resolved', label: 'Đã Giải Quyết', color: 'var(--color-success)' },
    { key: 'abandoned', label: 'Tạm Bỏ', color: 'var(--text-muted)' },
  ];

  const priorityColors = {
    critical: '#ef4444',
    high: 'var(--color-error)',
    normal: 'var(--text-tertiary)',
    low: 'var(--text-muted)',
  };

  const handleOpenModal = (thread = null) => {
    if (thread) {
      setSelectedThread(thread);
      setFormData({ ...thread });
    } else {
      setSelectedThread(null);
      setFormData({
        title: '',
        description: '',
        introduced_episode: 'EP01',
        introduced_scene: 'SC01',
        priority: 'normal',
        planned_resolution_episode: 'EP05',
        resolved_episode: '',
        status: 'open',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !currentProject) return;

    try {
      if (selectedThread) {
        await api.updateStoryThread(selectedThread.id, formData);
      } else {
        await api.createStoryThread({ ...formData, project_id: currentProject.id });
      }
      loadStoryThreads();
      setShowModal(false);
    } catch (err) {
      alert('Lỗi lưu thread: ' + err.message);
    }
  };

  const handleMoveStatus = async (thread, newStatus) => {
    try {
      await api.updateStoryThread(thread.id, { ...thread, status: newStatus });
      loadStoryThreads();
    } catch (err) {
      alert('Lỗi chuyển trạng thái: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa tuyến truyện này?')) return;
    try {
      await api.deleteStoryThread(id);
      loadStoryThreads();
    } catch (err) {
      alert('Lỗi xóa thread: ' + err.message);
    }
  };

  return (
    <div className="story-threads-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🧵 Story Threads (Tuyến Truyện)</h1>
          <p className="page-header__subtitle">
            {storyThreads.length} tuyến truyện — Ngăn ngừa AI "bỏ quên" plot twist, mối thù hoặc bí mật chưa giải quyết
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            + Thêm Tuyến Truyện
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`,
        gap: 'var(--space-3)',
        minHeight: 500,
        overflowX: 'auto',
      }}>
        {columns.map((col) => {
          const threads = storyThreads.filter((t) => t.status === col.key);
          return (
            <div key={col.key} style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}>
              {/* Column Header */}
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-1)' }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {col.label}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-tertiary)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {threads.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {threads.map((thread) => (
                  <div key={thread.id} className="card" style={{
                    padding: 'var(--space-3)',
                    borderLeft: `3px solid ${priorityColors[thread.priority] || priorityColors.normal}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)'
                  }}>
                    <div className="flex justify-between items-start">
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {thread.title}
                      </div>
                      <span style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        color: priorityColors[thread.priority] || 'var(--text-muted)',
                        fontWeight: 700
                      }}>
                        {thread.priority}
                      </span>
                    </div>

                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
                      {thread.description}
                    </p>

                    <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>📺 {thread.introduced_episode || 'EP?'}</span>
                      {thread.planned_resolution_episode && (
                        <span>🎯 Dự kiến: {thread.planned_resolution_episode}</span>
                      )}
                    </div>

                    {/* Quick Move and Edit Menu */}
                    <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <select
                        className="select"
                        value={thread.status}
                        onChange={(e) => handleMoveStatus(thread, e.target.value)}
                        style={{ fontSize: '11px', padding: '2px 4px', width: 'auto' }}
                      >
                        <option value="open">Mở</option>
                        <option value="developing">Đang phát triển</option>
                        <option value="ready_to_resolve">Sắp giải quyết</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="abandoned">Tạm bỏ</option>
                      </select>

                      <div className="flex gap-1">
                        <button className="btn btn--ghost btn--sm" style={{ padding: '2px 6px' }} onClick={() => handleOpenModal(thread)}>
                          ✏️
                        </button>
                        <button className="btn btn--ghost btn--sm" style={{ padding: '2px 6px', color: 'var(--color-error)' }} onClick={() => handleDelete(thread.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {threads.length === 0 && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                    Trống
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedThread ? 'Chỉnh Sửa Tuyến Truyện' : 'Thêm Tuyến Truyện Mới'}</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="label">Tiêu Đề Tuyến Truyện *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Ai là kẻ đứng sau vụ ám sát?"
                  />
                </div>

                <div>
                  <label className="label">Mô Tả & Tình Tiết</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả xung đột, nút thắt..."
                  />
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Độ Ưu Tiên</label>
                    <select
                      className="select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Thấp (Low)</option>
                      <option value="normal">Bình thường (Normal)</option>
                      <option value="high">Cao (High)</option>
                      <option value="critical">Khẩn cấp (Critical)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Trạng Thái Kanban</label>
                    <select
                      className="select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="open">Mở (Open)</option>
                      <option value="developing">Đang phát triển</option>
                      <option value="ready_to_resolve">Sắp giải quyết</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="abandoned">Tạm bỏ</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Xuất Hiện Ở Tập / Cảnh</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.introduced_episode}
                      onChange={(e) => setFormData({ ...formData, introduced_episode: e.target.value })}
                      placeholder="VD: EP01 SC02"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Dự Kiến Giải Quyết</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.planned_resolution_episode}
                      onChange={(e) => setFormData({ ...formData, planned_resolution_episode: e.target.value })}
                      placeholder="VD: EP06 hoặc Cuối Arc 1"
                    />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Tuyến Truyện</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
