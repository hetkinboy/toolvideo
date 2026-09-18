import React, { useState } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function CharacterCreateModal({ onClose, onSuccess }) {
  const currentProject = useStore((s) => s.currentProject);
  const loadCharacters = useStore((s) => s.loadCharacters);

  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    role: 'main',
    age: '18',
    gender: 'Nam',
    height: '175cm',
    description: '',
    appearance: '',
    face: '',
    hair: '',
    eyes: '',
    body: '',
    default_outfit: '',
    personality: '',
    speaking_style: '',
    background: '',
    goal: '',
    motivation: '',
    strength: '',
    weakness: '',
    secret: '',
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentProject) return;

    setLoading(true);
    try {
      const created = await api.createCharacter({
        ...formData,
        project_id: currentProject.id,
      });

      // Also create initial character state
      try {
        await fetch('http://localhost:3001/api/character-states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character_id: created.id,
            project_id: currentProject.id,
            current_location: 'Chưa xác định',
            current_outfit: formData.default_outfit || 'Thường phục',
            health: 'normal',
            injuries: '',
            emotion: 'neutral',
            power_level: '0',
            inventory: '[]',
            knowledge: '[]',
          })
        });
      } catch (e) {}

      await loadCharacters();
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err) {
      alert('Lỗi tạo nhân vật: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '20px' }}>👤</span>
            <h2>Thêm Nhân Vật Mới (Character Profile)</h2>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Basic Info */}
            <div className="flex gap-3">
              <div style={{ flex: 2 }}>
                <label className="label">Họ & Tên Nhân Vật *</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Lâm Hạo, Tiêu Viêm, Sở Phong..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Biệt Hiệu / Danh Xưng</label>
                <input
                  type="text"
                  className="input"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="VD: Phế Vật, Kiếm Thánh..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Vai Trò</label>
                <select
                  className="select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="main">Nhân Vật Chính (Main)</option>
                  <option value="supporting">Nhân Vật Phụ (Supporting)</option>
                  <option value="enemy">Đối Thủ / Phản Diện (Enemy)</option>
                  <option value="npc">Quần Chúng (NPC)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="label">Tuổi</label>
                <input
                  type="text"
                  className="input"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="18"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Giới Tính</label>
                <select
                  className="select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác / Linh thú</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Chiều Cao</label>
                <input
                  type="text"
                  className="input"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="175cm"
                />
              </div>
            </div>

            <div>
              <label className="label">Mô Tả Tổng Quan & Ngoại Hình</label>
              <textarea
                className="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Thanh niên gầy gò, đôi mắt sáng kiên nghị, vẻ ngoài bình phàm nhưng nội tâm thâm trầm..."
              />
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="label">Trang Phục Mặc Định</label>
                <input
                  type="text"
                  className="input"
                  value={formData.default_outfit}
                  onChange={(e) => setFormData({ ...formData, default_outfit: e.target.value })}
                  placeholder="Bạch y đơn giản, đai lưng xám..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Tính Cách Nổi Bật</label>
                <input
                  type="text"
                  className="input"
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="Kiên nhẫn, mỉa mai, thận trọng..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="label">Mục Tiêu (Goal)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="Chứng minh bản thân, bảo vệ người thân..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Bí Mật Không Thể Tiết Lộ</label>
                <input
                  type="text"
                  className="input"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="Sở hữu hệ thống, thân phận hoàng tộc..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="label">Thế Mạnh (Strength)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="Hệ thống, trí nhớ siêu phàm..."
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Điểm Yếu (Weakness)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.weakness}
                  onChange={(e) => setFormData({ ...formData, weakness: e.target.value })}
                  placeholder="Sức mạnh ban đầu thấp, phải giấu diếm..."
                />
              </div>
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Lưu Hồ Sơ Nhân Vật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
