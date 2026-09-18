import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function ItemList() {
  const currentProject = useStore((s) => s.currentProject);
  const items = useStore((s) => s.items);
  const loadItems = useStore((s) => s.loadItems);
  const characters = useStore((s) => s.characters);
  const loadCharacters = useStore((s) => s.loadCharacters);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'weapon',
    description: '',
    appearance: '',
    abilities: '',
    history: '',
    owner: '',
    current_location: '',
    condition: 'normal',
    introduced_episode: 'EP01',
    status: 'draft',
  });

  useEffect(() => {
    if (currentProject) {
      loadItems();
      loadCharacters();
    }
  }, [currentProject]);

  const conditionColors = {
    normal: 'var(--color-success)',
    damaged: 'var(--color-warning)',
    broken: 'var(--color-error)',
    lost: 'var(--accent)',
    destroyed: '#64748b',
  };

  const conditionLabels = {
    normal: 'Bình thường',
    damaged: 'Hư hại',
    broken: 'Gãy hỏng',
    lost: 'Thất lạc',
    destroyed: 'Đã hủy',
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.abilities || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || item.type === filterType;
    const matchCondition = filterCondition === 'all' || item.condition === filterCondition;
    return matchSearch && matchType && matchCondition;
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({ ...item });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        type: 'weapon',
        description: '',
        appearance: '',
        abilities: '',
        history: '',
        owner: '',
        current_location: '',
        condition: 'normal',
        introduced_episode: 'EP01',
        status: 'draft',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentProject) return;

    try {
      if (selectedItem) {
        await api.updateItem(selectedItem.id, formData);
      } else {
        await api.createItem({ ...formData, project_id: currentProject.id });
      }
      loadItems();
      setShowModal(false);
    } catch (err) {
      alert('Lỗi lưu vật phẩm: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa vật phẩm này?')) return;
    try {
      await api.deleteItem(id);
      loadItems();
    } catch (err) {
      alert('Lỗi xóa vật phẩm: ' + err.message);
    }
  };

  // Helper to get character name if owner is a character ID
  const getOwnerName = (ownerIdOrName) => {
    if (!ownerIdOrName) return 'Vô chủ / Chưa rõ';
    const found = characters.find(c => c.id === ownerIdOrName);
    return found ? found.name : ownerIdOrName;
  };

  return (
    <div className="item-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">⚔️ Items & Artifacts (Vật Phẩm)</h1>
          <p className="page-header__subtitle">
            {items.length} bảo vật, vũ khí, kỳ trân dị bảo — Quản lý quyền sở hữu, tình trạng hư hại và tính liên tục
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            + Thêm Vật Phẩm
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card mb-4" style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Tìm kiếm vật phẩm, vũ khí, công năng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div className="flex gap-2">
          {['all', 'weapon', 'system', 'artifact', 'magic', 'story'].map((t) => (
            <button
              key={t}
              className={`btn btn--sm ${filterType === t ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? 'Tất cả' : t}
            </button>
          ))}
        </div>
        <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
          {['all', 'normal', 'damaged', 'broken', 'lost', 'destroyed'].map((c) => (
            <button
              key={c}
              className={`btn btn--sm ${filterCondition === c ? 'btn--secondary' : 'btn--ghost'}`}
              onClick={() => setFilterCondition(c)}
            >
              {c === 'all' ? 'Mọi tình trạng' : conditionLabels[c] || c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {filtered.map((item) => (
          <div key={item.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="badge badge--primary" style={{ marginBottom: 'var(--space-1)', textTransform: 'uppercase', fontSize: '10px' }}>
                  {item.type || 'Vật phẩm'}
                </span>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.name}
                </h3>
              </div>
              <div className="flex gap-1 items-center">
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${conditionColors[item.condition] || 'var(--text-muted)'}`,
                  color: conditionColors[item.condition] || 'var(--text-muted)'
                }}>
                  ● {conditionLabels[item.condition] || item.condition}
                </span>
                <span className={`badge badge--${item.status === 'locked' ? 'warning' : item.status === 'approved' ? 'success' : 'muted'}`}>
                  {item.status || 'draft'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
              {item.description || 'Chưa có mô tả.'}
            </p>

            {/* Owner and location bar */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)'
            }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>👤 Người sở hữu:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{getOwnerName(item.owner)}</strong>
              </div>
              {item.current_location && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>📍 Vị trí hiện tại:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.current_location}</span>
                </div>
              )}
            </div>

            {/* Abilities */}
            {item.abilities && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.05)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
                fontSize: 'var(--text-xs)',
              }}>
                <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>⚡ Khả năng / Uy lực:</span>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{item.abilities}</div>
              </div>
            )}

            {/* Appearance */}
            {item.appearance && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngoại quan:</span> {item.appearance}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => handleOpenModal(item)}>
                ✏️ Chỉnh sửa
              </button>
              <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(item.id)}>
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center" style={{ padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
          Không tìm thấy vật phẩm nào.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedItem ? 'Chỉnh Sửa Vật Phẩm' : 'Thêm Vật Phẩm Mới'}</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="flex gap-3">
                  <div style={{ flex: 2 }}>
                    <label className="label">Tên Vật Phẩm *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Huyết Phong Kiếm..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Phân Loại</label>
                    <select
                      className="select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="weapon">Vũ khí (Weapon)</option>
                      <option value="system">Hệ thống (System)</option>
                      <option value="artifact">Bảo vật (Artifact)</option>
                      <option value="magic">Pháp bảo (Magic)</option>
                      <option value="story">Cốt truyện (Story)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Tình Trạng</label>
                    <select
                      className="select"
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    >
                      <option value="normal">Bình thường</option>
                      <option value="damaged">Hư hại</option>
                      <option value="broken">Gãy hỏng</option>
                      <option value="lost">Thất lạc</option>
                      <option value="destroyed">Đã hủy</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Người Nắm Giữ / Sở Hữu</label>
                    <select
                      className="select"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    >
                      <option value="">-- Vô chủ / Chưa gán --</option>
                      {characters.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Vị Trí Hiện Tại</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.current_location}
                      onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                      placeholder="VD: Phòng riêng, Túi trữ vật..."
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
                  <label className="label">Mô Tả & Xuất Xứ</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả nguồn gốc và vai trò..."
                  />
                </div>

                <div>
                  <label className="label">Ngoại Quan (Visual Appearance)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.appearance}
                    onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                    placeholder="Kiếm dài đỏ thẫm, hoa văn rồng uốn lượn..."
                  />
                </div>

                <div>
                  <label className="label">Công Năng & Kỹ Năng (Abilities)</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={formData.abilities}
                    onChange={(e) => setFormData({ ...formData, abilities: e.target.value })}
                    placeholder="Tốc độ chém x2, phát ra lôi hỏa kiếm khí..."
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Vật Phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
