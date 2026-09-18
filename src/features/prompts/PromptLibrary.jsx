import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function PromptLibrary() {
  const currentProject = useStore((s) => s.currentProject);
  const prompts = useStore((s) => s.prompts);
  const loadPrompts = useStore((s) => s.loadPrompts);

  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'PROMPT_CREATE_SCENE',
    description: '',
    template: '',
    variables: '[]',
  });

  useEffect(() => {
    if (currentProject) loadPrompts();
  }, [currentProject]);

  const availableVariables = [
    { tag: '{{PROJECT_BIBLE}}', desc: 'Luật nền, thế giới quan, quy tắc thế giới từ Story Bible' },
    { tag: '{{CURRENT_ARC}}', desc: 'Tên, mục tiêu và tóm tắt của Cung truyện (Arc) hiện tại' },
    { tag: '{{EPISODE}}', desc: 'Mục tiêu, Hook mở đầu, Xung đột chính, Cao trào của tập phim' },
    { tag: '{{PREVIOUS_SCENE}}', desc: 'Diễn biến và Ending State của cảnh quay liền trước' },
    { tag: '{{CHARACTERS}}', desc: 'Hồ sơ, ngoại hình, tính cách và trạng thái hiện tại của các nhân vật' },
    { tag: '{{CURRENT_STATE}}', desc: 'Snapshot trạng thái (vị trí, chấn thương, túi đồ) của nhân vật' },
    { tag: '{{LOCATIONS}}', desc: 'Mô tả bối cảnh, kiến trúc, ánh sáng và chi tiết địa điểm' },
    { tag: '{{ITEMS}}', desc: 'Vật phẩm, bảo vật, tình trạng hư hại và chủ sở hữu' },
    { tag: '{{STORY_THREADS}}', desc: 'Danh sách các tuyến truyện đang mở cần được phát triển/giải quyết' },
    { tag: '{{KNOWLEDGE}}', desc: 'Giới hạn tri thức từ Knowledge Matrix (ngăn nhân vật nói lộ bí mật)' },
    { tag: '{{USER_INPUT}}', desc: 'Dàn ý hoặc yêu cầu cụ thể từ người dùng khi tạo cảnh' },
  ];

  const handleOpenModal = (p = null) => {
    if (p) {
      setSelectedPrompt(p);
      setFormData({ ...p });
    } else {
      setSelectedPrompt(null);
      setFormData({
        name: '',
        type: 'PROMPT_CUSTOM',
        description: '',
        template: '{{PROJECT_BIBLE}}\n\n{{CHARACTERS}}\n\n{{USER_INPUT}}',
        variables: JSON.stringify(['PROJECT_BIBLE', 'CHARACTERS', 'USER_INPUT']),
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentProject) return;

    try {
      if (selectedPrompt) {
        await api.updatePrompt ? await api.updatePrompt(selectedPrompt.id, formData) : await fetch(`http://localhost:3001/api/prompts/${selectedPrompt.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      } else {
        await fetch('http://localhost:3001/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, project_id: currentProject.id })
        });
      }
      loadPrompts();
      setShowModal(false);
    } catch (err) {
      alert('Lỗi lưu template: ' + err.message);
    }
  };

  const handleInsertVariable = (tag) => {
    setFormData(prev => ({ ...prev, template: prev.template + '\n' + tag }));
  };

  return (
    <div className="prompt-library-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">📚 Prompt Library (Thư Viện Mẫu Prompt)</h1>
          <p className="page-header__subtitle">
            Hệ thống mẫu prompt chuẩn hóa kết hợp biến động `{'{{...}}'}` — Không hardcode prompt trong code
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => handleOpenModal()}>
            + Thêm Mẫu Prompt
          </button>
        </div>
      </div>

      {/* Variables Cheat Sheet */}
      <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
          🏷️ Danh Mục Biến Động Được Hỗ Trợ (Dynamic Variables)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-2)',
        }}>
          {availableVariables.map((v, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-tertiary)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
            }}>
              <code style={{ color: 'var(--accent)', fontWeight: 600 }}>{v.tag}</code>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompts List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {prompts.map((p) => (
          <div key={p.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="badge badge--primary" style={{ fontSize: '10px', marginBottom: '4px' }}>
                  {p.type}
                </span>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {p.name}
                </h3>
              </div>
              <span className="badge badge--muted">v{p.current_version || 1}</span>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              {p.description || 'Chưa có mô tả.'}
            </p>

            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              maxHeight: 120,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {p.template}
            </div>

            <div className="flex justify-end gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn--secondary btn--sm" onClick={() => handleOpenModal(p)}>
                ✏️ Chỉnh Sửa Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedPrompt ? 'Chỉnh Sửa Mẫu Prompt' : 'Thêm Mẫu Prompt Mới'}</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="flex gap-3">
                  <div style={{ flex: 2 }}>
                    <label className="label">Tên Template *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Tạo Scene Nhanh..."
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Mã Định Danh (Type)</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="PROMPT_..."
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Mô Tả Mục Đích</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả khi nào nên dùng mẫu prompt này..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label" style={{ margin: 0 }}>Nội Dung Template (Hỗ trợ chèn biến {'{{...}}'})</label>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bấm để chèn nhanh:</span>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {availableVariables.slice(0, 7).map(v => (
                      <button
                        key={v.tag}
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ fontSize: '10px', padding: '1px 6px' }}
                        onClick={() => handleInsertVariable(v.tag)}
                      >
                        + {v.tag}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="textarea"
                    rows={10}
                    required
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
