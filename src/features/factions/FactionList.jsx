import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function FactionList() {
  const currentProject = useStore((s) => s.currentProject);
  const factions = useStore((s) => s.factions);
  const loadFactions = useStore((s) => s.loadFactions);

  const [search, setSearch] = useState('');
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'family',
    description: '',
    leader: '',
    alignment: 'neutral',
    headquarters: '',
    relationships: '',
    status: 'draft',
  });

  useEffect(() => {
    if (currentProject) loadFactions();
  }, [currentProject]);

  const handleAutoGenerateFactions = async () => {
    if (!currentProject) return;
    setGenerating(true);
    try {
      const res = await api.autoGenerateFactions(currentProject.id);
      await loadFactions();
      alert(res.message || 'Đã tự động tạo các Thế Lực / Phe Phái thành công!');
    } catch (err) {
      alert('Lỗi tự động tạo Phe Phái: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const alignmentColors = {
    ally: 'var(--color-success)',
    rival: 'var(--color-warning)',
    enemy: 'var(--color-error)',
    neutral: 'var(--text-tertiary)',
  };

  const alignmentLabels = {
    ally: 'Đồng minh',
    rival: 'Đối thủ cạnh tranh',
    enemy: 'Kẻ thù đối địch',
    neutral: 'Trung lập',
  };

  const filtered = factions.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.leader || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (fac = null) => {
    if (fac) {
      setSelectedFaction(fac);
      setFormData({ ...fac });
    } else {
      setSelectedFaction(null);
      setFormData({
        name: '',
        type: 'family',
        description: '',
        leader: '',
        alignment: 'neutral',
        headquarters: '',
        relationships: '',
        status: 'draft',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentProject) return;

    try {
      if (selectedFaction) {
        await api.updateFaction(selectedFaction.id, formData);
      } else {
        await api.createFaction({ ...formData, project_id: currentProject.id });
      }
      loadFactions();
      setShowModal(false);
    } catch (err) {
      alert('Lỗi lưu phe phái: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa thế lực này?')) return;
    try {
      await api.deleteFaction(id);
      loadFactions();
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  return (
    <div className="faction-list-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🏴 Factions & Sects (Phe Phái / Thế Lực)</h1>
          <p className="page-header__subtitle">
            {factions.length} gia tộc, tông môn, thế lực ngầm chi phối cục diện thế giới
          </p>
        </div>
        <div className="page-header__actions flex gap-2">
          <button
            className="btn btn--secondary"
            disabled={generating}
            onClick={handleAutoGenerateFactions}
            title="Tự động phân tích cốt truyện và nhân vật để tạo các thế lực đối đầu/đồng minh"
          >
            ⚡ {generating ? 'Đang tạo...' : 'Tự Động Tạo Thế Lực (1-Click)'}
          </button>
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            + Thêm Phe Phái
          </button>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: 'var(--space-3)' }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Tìm kiếm thế lực, tông chủ, đại bản doanh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {filtered.map((fac) => (
          <div key={fac.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="badge badge--primary" style={{ marginBottom: 'var(--space-1)', textTransform: 'uppercase', fontSize: '10px' }}>
                  {fac.type || 'Gia tộc'}
                </span>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {fac.name}
                </h3>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${alignmentColors[fac.alignment] || 'var(--text-muted)'}`,
                color: alignmentColors[fac.alignment] || 'var(--text-muted)'
              }}>
                ● {alignmentLabels[fac.alignment] || fac.alignment}
              </span>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
              {fac.description || 'Chưa có mô tả chi tiết.'}
            </p>

            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)'
            }}>
              {fac.leader && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>👑 Thủ lĩnh / Tông chủ:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{fac.leader}</strong>
                </div>
              )}
              {fac.headquarters && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>🏰 Đại bản doanh:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{fac.headquarters}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => handleOpenModal(fac)}>
                ✏️ Chỉnh sửa
              </button>
              <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(fac.id)}>
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center" style={{ padding: 'var(--space-8)', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '40px', marginBottom: 'var(--space-2)' }}>🏴</div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              Chưa Có Phe Phái / Thế Lực Nào
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-4)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              Hệ thống có thể tự động bóc tách từ danh sách nhân vật và cốt truyện để sinh ra các tông môn, thế gia, băng đảng đối nghịch & đồng minh.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="btn btn--primary"
                disabled={generating}
                onClick={handleAutoGenerateFactions}
              >
                ⚡ {generating ? 'Đang tạo...' : 'Tự Động Tạo Thế Lực Từ Cốt Truyện (1-Click)'}
              </button>
              <button className="btn btn--secondary" onClick={() => handleOpenModal()}>
                + Tạo Thủ Công
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedFaction ? 'Chỉnh Sửa Phe Phái' : 'Thêm Phe Phái Mới'}</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="flex gap-3">
                  <div style={{ flex: 2 }}>
                    <label className="label">Tên Phe Phái / Thế Lực *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Thiên Kiếm Tông, Lâm Gia..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Loại Hình</label>
                    <select
                      className="select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="family">Gia tộc (Family)</option>
                      <option value="sect">Tông môn (Sect)</option>
                      <option value="organization">Tổ chức ngầm</option>
                      <option value="court">Hoàng triều</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Lãnh Đạo / Gia Chủ</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.leader}
                      onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                      placeholder="VD: Lâm Đức Chính..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Thái Độ / Lập Trường</label>
                    <select
                      className="select"
                      value={formData.alignment}
                      onChange={(e) => setFormData({ ...formData, alignment: e.target.value })}
                    >
                      <option value="ally">Đồng minh (Ally)</option>
                      <option value="neutral">Trung lập (Neutral)</option>
                      <option value="rival">Cạnh tranh (Rival)</option>
                      <option value="enemy">Kẻ thù (Enemy)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Đại Bản Doanh</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.headquarters}
                    onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                    placeholder="VD: Lâm Gia Đại Viện, Đỉnh Thiên Sơn..."
                  />
                </div>

                <div>
                  <label className="label">Mô Tả & Bối Cảnh</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Lịch sử thế lực, thế mạnh tu luyện..."
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Thế Lực</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
