import React, { useState } from 'react';
import { useStore } from '../core/store';

export default function CreateProjectModal({ onClose, onSuccess }) {
  const createProject = useStore((s) => s.createProject);

  const [formData, setFormData] = useState({
    name: '',
    genre: 'Chinese Fantasy / Action',
    language: 'vi',
    target_platform: 'TikTok',
    aspect_ratio: '9:16',
    episode_min_duration: 120,
    episode_max_duration: 180,
    visual_style: 'Anime / 3D Cinematic, vibrant colors, dramatic lighting',
    story_tone: 'Tense + Dramatic + Heroic',
    description: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const created = await createProject(formData);
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err) {
      alert('Lỗi tạo dự án: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '20px' }}>🎬</span>
            <h2 className="modal__title">Tạo Dự Án Phim / Series Mới</h2>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label className="label">Tên Dự Án (Project Name) *</label>
              <input
                type="text"
                className="input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Võ Thần Trở Lại, Phượng Hoàng Lửa, Thần Y Xuống Núi..."
              />
            </div>

            <div className="form-grid-3">
              <div>
                <label className="label">Thể Loại (Genre)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="Tiên hiệp, Đô thị..."
                />
              </div>
              <div>
                <label className="label">Nền Tảng Đích (Platform)</label>
                <select
                  className="select"
                  value={formData.target_platform}
                  onChange={(e) => setFormData({ ...formData, target_platform: e.target.value })}
                >
                  <option value="TikTok">TikTok (Phim Dọc)</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="YouTube">YouTube (Phim Ngang)</option>
                  <option value="Film">Điện Ảnh / Series Dài</option>
                </select>
              </div>
              <div>
                <label className="label">Tỷ Lệ Khung Hình</label>
                <select
                  className="select"
                  value={formData.aspect_ratio}
                  onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                >
                  <option value="9:16">9:16 (Dọc chuẩn)</option>
                  <option value="16:9">16:9 (Ngang chuẩn)</option>
                  <option value="1:1">1:1 (Vuông)</option>
                  <option value="2.35:1">2.35:1 (CinemaScope)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Tóm Tắt Ý Tưởng Cốt Truyện (Synopsis)</label>
              <textarea
                className="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tóm tắt ngắn gọn tiền đề câu chuyện, nhân vật chính, xung đột mở đầu..."
              />
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label">Phong Cách Hình Ảnh (Visual Style)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.visual_style}
                  onChange={(e) => setFormData({ ...formData, visual_style: e.target.value })}
                  placeholder="Anime, 3D Realism, Cyberpunk..."
                />
              </div>
              <div>
                <label className="label">Tông Giọng Kể Chuyện (Story Tone)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.story_tone}
                  onChange={(e) => setFormData({ ...formData, story_tone: e.target.value })}
                  placeholder="Tense, Comedic, Heroic, Dark..."
                />
              </div>
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Đang khởi tạo...' : '🚀 Khởi Tạo Dự Án Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
