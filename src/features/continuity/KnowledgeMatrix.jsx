import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function KnowledgeMatrix() {
  const currentProject = useStore((s) => s.currentProject);
  const knowledgeMatrix = useStore((s) => s.knowledgeMatrix);
  const loadKnowledgeMatrix = useStore((s) => s.loadKnowledgeMatrix);

  const [search, setSearch] = useState('');
  const [showAddFactModal, setShowAddFactModal] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { characterId, fact, currentEntry }
  const [cellState, setCellState] = useState('unknown');
  const [learnedEp, setLearnedEp] = useState('');
  const [learnedSc, setLearnedSc] = useState('');

  useEffect(() => {
    if (currentProject) loadKnowledgeMatrix();
  }, [currentProject]);

  const stateConfig = {
    knows: { label: 'KNOWS', text: 'Đã biết', bg: 'rgba(34, 197, 94, 0.15)', border: 'var(--color-success)', color: 'var(--color-success)', icon: '🟢' },
    unknown: { label: 'UNKNOWN', text: 'Chưa biết', bg: 'var(--bg-tertiary)', border: 'var(--border-color)', color: 'var(--text-muted)', icon: '⚪' },
    suspects: { label: 'SUSPECTS', text: 'Nghi ngờ', bg: 'rgba(234, 179, 8, 0.15)', border: 'var(--color-warning)', color: 'var(--color-warning)', icon: '🟡' },
    false_belief: { label: 'FALSE_BELIEF', text: 'Tin sai / Hiểu lầm', bg: 'rgba(239, 68, 68, 0.15)', border: 'var(--color-error)', color: 'var(--color-error)', icon: '🔴' },
  };

  const nextCycle = {
    unknown: 'suspects',
    suspects: 'knows',
    knows: 'false_belief',
    false_belief: 'unknown',
  };

  const characters = knowledgeMatrix?.characters || [];
  const facts = (knowledgeMatrix?.facts || []).filter(f => f.toLowerCase().includes(search.toLowerCase()));
  const matrix = knowledgeMatrix?.matrix || {};

  const handleQuickCycle = async (characterId, fact, currentEntry) => {
    const currentState = currentEntry?.knowledge_state || 'unknown';
    const nextState = nextCycle[currentState];

    try {
      await api.upsertKnowledgeEntry({
        project_id: currentProject.id,
        character_id: characterId,
        fact,
        knowledge_state: nextState,
        learned_episode: currentEntry?.learned_episode || '',
        learned_scene: currentEntry?.learned_scene || '',
      });
      loadKnowledgeMatrix();
    } catch (err) {
      alert('Lỗi cập nhật: ' + err.message);
    }
  };

  const handleOpenDetailModal = (characterId, fact, currentEntry, e) => {
    e.stopPropagation();
    setEditingCell({ characterId, fact, currentEntry });
    setCellState(currentEntry?.knowledge_state || 'unknown');
    setLearnedEp(currentEntry?.learned_episode || '');
    setLearnedSc(currentEntry?.learned_scene || '');
  };

  const handleSaveCellDetail = async (e) => {
    e.preventDefault();
    if (!editingCell || !currentProject) return;

    try {
      await api.upsertKnowledgeEntry({
        project_id: currentProject.id,
        character_id: editingCell.characterId,
        fact: editingCell.fact,
        knowledge_state: cellState,
        learned_episode: learnedEp,
        learned_scene: learnedSc,
      });
      loadKnowledgeMatrix();
      setEditingCell(null);
    } catch (err) {
      alert('Lỗi lưu: ' + err.message);
    }
  };

  const handleAddFact = async (e) => {
    e.preventDefault();
    if (!newFact.trim() || !currentProject) return;

    try {
      // Create unknown entries for all characters for this new fact
      for (const char of characters) {
        await api.upsertKnowledgeEntry({
          project_id: currentProject.id,
          character_id: char.id,
          fact: newFact.trim(),
          knowledge_state: 'unknown',
          learned_episode: '',
          learned_scene: '',
        });
      }
      setNewFact('');
      setShowAddFactModal(false);
      loadKnowledgeMatrix();
    } catch (err) {
      alert('Lỗi thêm bí mật: ' + err.message);
    }
  };

  return (
    <div className="knowledge-matrix-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">🧠 Knowledge Matrix (Ma Trận Kiến Thức)</h1>
          <p className="page-header__subtitle">
            Kiểm soát nghiêm ngặt ai biết bí mật gì — Ngăn nhân vật nói điều họ chưa biết hoặc phá vỡ tình huống bất ngờ
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => setShowAddFactModal(true)}>
            + Thêm Bí Mật / Sự Kiện Mới
          </button>
        </div>
      </div>

      {/* Legend & Search Bar */}
      <div className="card mb-4" style={{ padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Lọc bí mật, sự kiện..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />

        {/* Legend */}
        <div className="flex gap-3 items-center" style={{ fontSize: 'var(--text-xs)' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Chú giải (Bấm để đổi nhanh):</span>
          {Object.entries(stateConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <span>{cfg.icon}</span>
              <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', minWidth: 260, color: 'var(--text-secondary)' }}>
                BÍ MẬT / THÔNG TIN CỐT TRUYỆN
              </th>
              {characters.map((char) => (
                <th key={char.id} style={{ padding: 'var(--space-3)', textAlign: 'center', minWidth: 140, color: 'var(--text-primary)' }}>
                  <div style={{ fontWeight: 600 }}>{char.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{char.role}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facts.map((fact, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)', background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {fact}
                </td>
                {characters.map((char) => {
                  const entry = matrix[fact]?.[char.id];
                  const stateKey = entry?.knowledge_state || 'unknown';
                  const cfg = stateConfig[stateKey] || stateConfig.unknown;

                  return (
                    <td
                      key={char.id}
                      style={{ padding: 'var(--space-2)', textAlign: 'center' }}
                    >
                      <div
                        onClick={() => handleQuickCycle(char.id, fact, entry)}
                        style={{
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          minWidth: 110,
                          transition: 'transform 0.1s ease',
                        }}
                        title="Bấm để chuyển trạng thái nhanh, hoặc bấm bút chì để sửa tập đã biết"
                      >
                        <div className="flex items-center gap-1">
                          <span style={{ fontSize: '10px' }}>{cfg.icon}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                        </div>
                        {entry?.learned_episode && (
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            📺 {entry.learned_episode} {entry.learned_scene}
                          </div>
                        )}
                        <button
                          className="btn btn--ghost"
                          style={{ fontSize: '10px', padding: '0 4px', height: '16px', opacity: 0.7 }}
                          onClick={(e) => handleOpenDetailModal(char.id, fact, entry, e)}
                        >
                          ✏️ Chi tiết
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {facts.length === 0 && (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có thông tin bí mật nào trong ma trận.
          </div>
        )}
      </div>

      {/* Modal Add Fact */}
      {showAddFactModal && (
        <div className="modal-backdrop" onClick={() => setShowAddFactModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Thêm Bí Mật / Sự Kiện Mới</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowAddFactModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddFact}>
              <div className="modal__body">
                <label className="label">Nội Dung Bí Mật Hoặc Sự Kiện Cần Kiểm Soát *</label>
                <textarea
                  className="textarea"
                  rows={3}
                  required
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder="VD: Lâm Hạo sở hữu Hệ Thống, Thân phận thật của Tiểu Bạch..."
                />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setShowAddFactModal(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Thêm Vào Ma Trận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Cell Detail */}
      {editingCell && (
        <div className="modal-backdrop" onClick={() => setEditingCell(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Chi Tiết Kiến Thức Nhân Vật</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditingCell(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveCellDetail}>
              <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Bí mật: <strong style={{ color: 'var(--text-primary)' }}>{editingCell.fact}</strong>
                </div>

                <div>
                  <label className="label">Trạng Thái Kiến Thức</label>
                  <select
                    className="select"
                    value={cellState}
                    onChange={(e) => setCellState(e.target.value)}
                  >
                    <option value="knows">🟢 KNOWS (Đã biết)</option>
                    <option value="unknown">⚪ UNKNOWN (Chưa biết)</option>
                    <option value="suspects">🟡 SUSPECTS (Nghi ngờ)</option>
                    <option value="false_belief">🔴 FALSE_BELIEF (Tin sai / Hiểu lầm)</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <div style={{ flex: 1 }}>
                    <label className="label">Biết Được Ở Tập (Episode)</label>
                    <input
                      type="text"
                      className="input"
                      value={learnedEp}
                      onChange={(e) => setLearnedEp(e.target.value)}
                      placeholder="EP01"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Cảnh (Scene)</label>
                    <input
                      type="text"
                      className="input"
                      value={learnedSc}
                      onChange={(e) => setLearnedSc(e.target.value)}
                      placeholder="SC03"
                    />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setEditingCell(null)}>Hủy</button>
                <button type="submit" className="btn btn--primary">Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
