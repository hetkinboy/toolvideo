import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';
import { useNavigate } from 'react-router-dom';

export default function StoryArcList() {
  const navigate = useNavigate();
  const currentProject = useStore((s) => s.currentProject);
  const storyArcs = useStore((s) => s.storyArcs);
  const loadStoryArcs = useStore((s) => s.loadStoryArcs);
  const episodes = useStore((s) => s.episodes);
  const loadEpisodes = useStore((s) => s.loadEpisodes);

  const [selectedArc, setSelectedArc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    summary: '',
    goal: '',
    start_episode: 1,
    end_episode: 10,
    status: 'draft',
    order_index: 0,
  });

  useEffect(() => {
    if (currentProject) {
      loadStoryArcs();
      loadEpisodes();
    }
  }, [currentProject]);

  const handleAutoGenerateArcs = async () => {
    if (!currentProject) return;
    setGenerating(true);
    try {
      const res = await api.autoGenerateArcs(currentProject.id);
      await loadStoryArcs();
      await loadEpisodes();
      alert(res.message || 'Đã tự động tạo các Cung Truyện thành công!');
    } catch (err) {
      alert('Lỗi tự động tạo Arcs: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenModal = (arc = null) => {
    if (arc) {
      setSelectedArc(arc);
      setFormData({ ...arc });
    } else {
      setSelectedArc(null);
      setFormData({
        name: '',
        summary: '',
        goal: '',
        start_episode: 1,
        end_episode: 10,
        status: 'draft',
        order_index: storyArcs.length,
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentProject) return;

    try {
      if (selectedArc) {
        await api.updateStoryArc(selectedArc.id, formData);
      } else {
        await api.createStoryArc({ ...formData, project_id: currentProject.id });
      }
      loadStoryArcs();
      setShowModal(false);
    } catch (err) {
      alert('Lỗi lưu Story Arc: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa Cung Truyện này?')) return;
    try {
      await api.deleteStoryArc(id);
      loadStoryArcs();
    } catch (err) {
      alert('Lỗi xóa Arc: ' + err.message);
    }
  };

  return (
    <div className="story-arc-list-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🎯 Story Arcs (Cung Truyện Lớn)</h1>
          <p className="page-header__subtitle">
            Cấu trúc kịch bản theo từng giai đoạn phát triển lớn của series (Mỗi Arc quản lý 10-30 tập)
          </p>
        </div>
        <div className="page-header__actions flex gap-2">
          <button
            className="btn btn--secondary"
            disabled={generating}
            onClick={handleAutoGenerateArcs}
            title="Tự động phân bổ các tập phim hiện có thành 3 Cung Truyện hoàn chỉnh"
          >
            ⚡ {generating ? 'Đang tạo...' : 'Tự Động Phân Bổ Arcs (1-Click)'}
          </button>
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            + Thêm Story Arc
          </button>
        </div>
      </div>

      {/* Arcs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {storyArcs.map((arc, index) => {
          const arcEpisodes = episodes.filter(e => e.arc_id === arc.id || (e.episode_number >= arc.start_episode && e.episode_number <= arc.end_episode));

          return (
            <div key={arc.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {arc.name}
                    </h2>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>
                      📺 Tập {arc.start_episode} ➔ Tập {arc.end_episode} ({arcEpisodes.length} tập đã tạo)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`badge badge--${arc.status === 'locked' ? 'warning' : arc.status === 'approved' ? 'success' : 'muted'}`}>
                    {arc.status || 'draft'}
                  </span>
                  <button className="btn btn--ghost btn--sm" onClick={() => handleOpenModal(arc)}>
                    ✏️ Sửa
                  </button>
                  <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(arc.id)}>
                    🗑️ Xóa
                  </button>
                </div>
              </div>

              {arc.summary && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                  {arc.summary}
                </p>
              )}

              {arc.goal && (
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                }}>
                  <strong style={{ color: 'var(--accent)' }}>🎯 Mục tiêu tối thượng của Arc:</strong> {arc.goal}
                </div>
              )}

              {/* Episodes in this arc */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Các Tập Phim Trong Arc:
                </div>
                <div className="flex gap-2 flex-wrap">
                  {arcEpisodes.map((ep) => (
                    <button
                      key={ep.id}
                      className="btn btn--secondary btn--sm"
                      onClick={() => navigate(`/episodes/${ep.id}`)}
                      style={{ fontSize: '12px' }}
                    >
                      EP{String(ep.episode_number).padStart(2, '0')}: {ep.title}
                    </button>
                  ))}
                  {arcEpisodes.length === 0 && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      Chưa có tập phim nào được gán vào Arc này.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {storyArcs.length === 0 && (
          <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '40px', marginBottom: 'var(--space-2)' }}>🎯</div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              Chưa Có Cung Truyện Nào Được Thiết Lập
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto var(--space-4)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
              Bạn không cần phải tự nghĩ và gõ từng cung truyện! Nhấp nút bên dưới để hệ thống tự động bóc tách và liên kết {episodes.length} tập phim thành 3 Cung Truyện lớn hoàn chỉnh với mục tiêu và tóm tắt chi tiết.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="btn btn--primary"
                disabled={generating}
                onClick={handleAutoGenerateArcs}
              >
                ⚡ {generating ? 'Đang phân bổ...' : 'Tự Động Phân Bổ Arcs Từ Các Tập Phim (1-Click)'}
              </button>
              <button className="btn btn--secondary" onClick={() => handleOpenModal()}>
                + Tự Tạo Thủ Công
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedArc ? 'Chỉnh Sửa Story Arc' : 'Thêm Story Arc Mới'}</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="label">Tên Cung Truyện (Arc Name) *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: PHẾ VẬT THỨC TỈNH, ĐẠI HỘI GIA TỘC, TIẾN VÀO TÔNG MÔN..."
                  />
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Tập Bắt Đầu</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.start_episode}
                      onChange={(e) => setFormData({ ...formData, start_episode: parseInt(e.target.value) })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Tập Kết Thúc</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.end_episode}
                      onChange={(e) => setFormData({ ...formData, end_episode: parseInt(e.target.value) })}
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
                  <label className="label">Tóm Tắt Cung Truyện</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Tóm tắt biến cố chính, bước ngoặt của nhân vật trong arc này..."
                  />
                </div>

                <div>
                  <label className="label">Mục Tiêu Đạt Được Của Arc</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    placeholder="VD: Nhân vật chính chứng minh bản thân trước gia tộc, đạt Luyện Khí tầng 5..."
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Cung Truyện</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
