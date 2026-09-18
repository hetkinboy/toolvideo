import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function Foreshadowing() {
  const currentProject = useStore((s) => s.currentProject);
  const foreshadows = useStore((s) => s.foreshadows);
  const loadForeshadows = useStore((s) => s.loadForeshadows);

  const [selectedForeshadow, setSelectedForeshadow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    setup: '',
    setup_episode: 'EP01',
    setup_scene: 'SC01',
    planned_reveal: '',
    planned_reveal_episode: 'EP05',
    status: 'planned',
  });

  useEffect(() => {
    if (currentProject) loadForeshadows();
  }, [currentProject]);

  const statusColors = {
    planned: 'var(--text-tertiary)',
    setup_done: 'var(--accent)',
    revealed: 'var(--color-success)',
    cancelled: 'var(--color-error)',
  };

  const statusLabels = {
    planned: 'Đã lên kế hoạch',
    setup_done: 'Đã cài cắm trong kịch bản',
    revealed: 'Đã chính thức hé lộ',
    cancelled: 'Đã hủy bỏ',
  };

  const filtered = foreshadows.filter(f =>
    filterStatus === 'all' || f.status === filterStatus
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setSelectedForeshadow(item);
      setFormData({ ...item });
    } else {
      setSelectedForeshadow(null);
      setFormData({
        setup: '',
        setup_episode: 'EP01',
        setup_scene: 'SC01',
        planned_reveal: '',
        planned_reveal_episode: 'EP05',
        status: 'planned',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.setup.trim() || !currentProject) return;

    try {
      if (selectedForeshadow) {
        await api.updateForeshadow(selectedForeshadow.id, formData);
      } else {
        await api.createForeshadow({ ...formData, project_id: currentProject.id });
      }
      loadForeshadows();
      setShowModal(false);
    } catch (err) {
      alert('Lỗi lưu: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa manh mối này?')) return;
    try {
      await api.deleteForeshadow(id);
      loadForeshadows();
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      await api.updateForeshadow(item.id, { ...item, status: newStatus });
      loadForeshadows();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  };

  const setupCount = foreshadows.filter(f => f.status === 'setup_done').length;
  const revealedCount = foreshadows.filter(f => f.status === 'revealed').length;

  return (
    <div className="foreshadowing-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🔮 Foreshadowing (Manh Mối & Tiên Báo)</h1>
          <p className="page-header__subtitle">
            Theo dõi chi tiết gài gắm chi tiết nhỏ ở tập trước và thời điểm bùng nổ hé lộ bí mật ở tập sau
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            + Thêm Manh Mối / Tiên Báo
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div className="card" style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Tổng số manh mối</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>{foreshadows.length}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Đã cài cắm trong cảnh</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent)' }}>{setupCount}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Đã hé lộ / Bật mí</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success)' }}>{revealedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
        {['all', 'planned', 'setup_done', 'revealed', 'cancelled'].map((st) => (
          <button
            key={st}
            className={`btn btn--sm ${filterStatus === st ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setFilterStatus(st)}
          >
            {st === 'all' ? 'Tất cả' : statusLabels[st]}
          </button>
        ))}
      </div>

      {/* List / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.map((item) => (
          <div key={item.id} className="card" style={{
            padding: 'var(--space-4)',
            display: 'grid',
            gridTemplateColumns: '1fr 40px 1fr 180px',
            gap: 'var(--space-4)',
            alignItems: 'center',
            borderLeft: `4px solid ${statusColors[item.status] || 'var(--text-muted)'}`
          }}>
            {/* Setup Column */}
            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>🌱 ĐIỂM CÀI CẮM (SETUP)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📺 {item.setup_episode} {item.setup_scene}</span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0 }}>
                {item.setup}
              </p>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: 'center', fontSize: '20px', color: 'var(--text-muted)' }}>
              ➔
            </div>

            {/* Reveal Column */}
            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-warning)' }}>💥 DỰ KIẾN HÉ LỘ (REVEAL)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🎯 {item.planned_reveal_episode}</span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0 }}>
                {item.planned_reveal || 'Chưa định rõ tình tiết hé lộ'}
              </p>
            </div>

            {/* Status & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <select
                className="select"
                value={item.status}
                onChange={(e) => handleStatusChange(item, e.target.value)}
                style={{ fontSize: '12px' }}
              >
                <option value="planned">Đã lên kế hoạch</option>
                <option value="setup_done">Đã cài cắm</option>
                <option value="revealed">Đã hé lộ</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              <div className="flex justify-end gap-1">
                <button className="btn btn--ghost btn--sm" onClick={() => handleOpenModal(item)}>✏️ Sửa</button>
                <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(item.id)}>🗑️ Xóa</button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center" style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            Không có manh mối nào trong danh mục này.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedForeshadow ? 'Chỉnh Sửa Manh Mối' : 'Thêm Manh Mối / Tiên Báo'}</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="label">Chi Tiết Cài Cắm Ban Đầu (Setup Clue) *</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    required
                    value={formData.setup}
                    onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                    placeholder="VD: Ám khí khắc ấn gia huy Vương Gia rơi tại hiện trường vụ ám sát..."
                  />
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Tập Cài Cắm</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.setup_episode}
                      onChange={(e) => setFormData({ ...formData, setup_episode: e.target.value })}
                      placeholder="EP01"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Cảnh Cài Cắm</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.setup_scene}
                      onChange={(e) => setFormData({ ...formData, setup_scene: e.target.value })}
                      placeholder="SC02"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Tình Tiết Hé Lộ Dự Kiến (Planned Reveal)</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={formData.planned_reveal}
                    onChange={(e) => setFormData({ ...formData, planned_reveal: e.target.value })}
                    placeholder="VD: Lâm Thanh cấu kết với sát thủ bên ngoài để ám hại Lâm Hạo..."
                  />
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Tập Dự Kiến Hé Lộ</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.planned_reveal_episode}
                      onChange={(e) => setFormData({ ...formData, planned_reveal_episode: e.target.value })}
                      placeholder="EP06"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Trạng Thái</label>
                    <select
                      className="select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="planned">Đã lên kế hoạch</option>
                      <option value="setup_done">Đã cài cắm</option>
                      <option value="revealed">Đã hé lộ</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Manh Mối</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
