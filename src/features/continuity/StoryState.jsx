import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function StoryState() {
  const currentProject = useStore((s) => s.currentProject);
  const storyStateSnapshots = useStore((s) => s.storyStateSnapshots);
  const loadStoryStateSnapshots = useStore((s) => s.loadStoryStateSnapshots);
  const scenes = useStore((s) => s.scenes);
  const loadScenes = useStore((s) => s.loadScenes);

  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
  const [diffMode, setDiffMode] = useState(false);
  const [compareIdA, setCompareIdA] = useState('');
  const [compareIdB, setCompareIdB] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadStoryStateSnapshots();
      loadScenes();
    }
  }, [currentProject]);

  useEffect(() => {
    if (storyStateSnapshots.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(storyStateSnapshots[storyStateSnapshots.length - 1].id);
      if (storyStateSnapshots.length >= 2) {
        setCompareIdA(storyStateSnapshots[storyStateSnapshots.length - 2].id);
        setCompareIdB(storyStateSnapshots[storyStateSnapshots.length - 1].id);
      }
    }
  }, [storyStateSnapshots]);

  const activeSnapshot = storyStateSnapshots.find(s => s.id === selectedSnapshotId);
  const parsedData = activeSnapshot ? (typeof activeSnapshot.snapshot_data === 'string' ? JSON.parse(activeSnapshot.snapshot_data || '{}') : activeSnapshot.snapshot_data) : null;

  const handleGenerateForScene = async (sceneId) => {
    if (!sceneId) return;
    setGenerating(true);
    try {
      await api.generateSnapshot(sceneId);
      await loadStoryStateSnapshots();
      alert('Đã tạo Story State Snapshot thành công!');
    } catch (err) {
      alert('Lỗi tạo snapshot: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSnapshot = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa Snapshot này?')) return;
    try {
      await api.deleteStoryStateSnapshot(id);
      await loadStoryStateSnapshots();
      if (selectedSnapshotId === id) {
        setSelectedSnapshotId(null);
      }
    } catch (err) {
      alert('Lỗi xóa snapshot: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!currentProject) return;
    if (!confirm('Bạn có chắc muốn xóa TOÀN BỘ Snapshots của dự án này?')) return;
    try {
      await api.clearProjectSnapshots(currentProject.id);
      await loadStoryStateSnapshots();
      setSelectedSnapshotId(null);
    } catch (err) {
      alert('Lỗi xóa tất cả: ' + err.message);
    }
  };

  const handleRunDiff = async () => {
    if (!compareIdA || !compareIdB) return;
    try {
      const diff = await api.getSnapshotDiff(compareIdA, compareIdB);
      setDiffResult(diff);
    } catch (err) {
      alert('Lỗi so sánh: ' + err.message);
    }
  };

  return (
    <div className="story-state-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">📸 Story State Snapshots (Trạng Thái Câu Chuyện)</h1>
          <p className="page-header__subtitle">
            Bộ nhớ dự án qua từng Scene — Theo dõi vị trí, trang phục, chấn thương, thực lực và biến chuyển cốt truyện
          </p>
        </div>
        <div className="page-header__actions flex gap-2">
          {storyStateSnapshots.length > 0 && (
            <button
              className="btn btn--ghost text-error"
              style={{ fontSize: '13px' }}
              onClick={handleClearAll}
              title="Xóa toàn bộ snapshots của project này"
            >
              🗑️ Xóa Tất Cả
            </button>
          )}
          <button
            className={`btn ${diffMode ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => {
              setDiffMode(!diffMode);
              if (!diffMode && compareIdA && compareIdB) handleRunDiff();
            }}
          >
            ⚖️ {diffMode ? 'Xem Snapshot Chi Tiết' : 'So Sánh Biến Chuyển (Diff)'}
          </button>
        </div>
      </div>

      {diffMode ? (
        /* DIFF COMPARISON MODE */
        <div className="diff-view-container" style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <div className="card mb-4" style={{ padding: 'var(--space-4)' }}>
            <div className="flex gap-4 items-center flex-wrap">
              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="label">Cảnh Gốc (Scene A):</label>
                <select
                  className="select"
                  value={compareIdA}
                  onChange={(e) => setCompareIdA(e.target.value)}
                >
                  {storyStateSnapshots.map((snap) => {
                    const data = typeof snap.snapshot_data === 'string' ? JSON.parse(snap.snapshot_data || '{}') : snap.snapshot_data;
                    return (
                      <option key={snap.id} value={snap.id}>
                        Cảnh {data?.scene_number || '?'}: {data?.scene_title || 'Cảnh'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ fontSize: '24px', color: 'var(--accent)' }}>➔</div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="label">Cảnh So Sánh (Scene B):</label>
                <select
                  className="select"
                  value={compareIdB}
                  onChange={(e) => setCompareIdB(e.target.value)}
                >
                  {storyStateSnapshots.map((snap) => {
                    const data = typeof snap.snapshot_data === 'string' ? JSON.parse(snap.snapshot_data || '{}') : snap.snapshot_data;
                    return (
                      <option key={snap.id} value={snap.id}>
                        Cảnh {data?.scene_number || '?'}: {data?.scene_title || 'Cảnh'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ paddingTop: '22px' }}>
                <button className="btn btn--primary" onClick={handleRunDiff}>
                  ⚡ So Sánh
                </button>
              </div>
            </div>
          </div>

          {diffResult && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
                🔍 Kết Quả So Sánh: [{diffResult.from?.scene_title}] ➔ [{diffResult.to?.scene_title}]
              </h3>

              {/* Character Diffs */}
              <div className="mb-4">
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', marginBottom: 'var(--space-2)' }}>
                  👤 Biến Chuyển Nhân Vật ({diffResult.characterDiffs?.length || 0})
                </h4>
                {diffResult.characterDiffs?.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {diffResult.characterDiffs.map((cd, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3)',
                        borderLeft: '3px solid var(--accent)'
                      }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{cd.character}</strong>
                        <div className="flex flex-col gap-1 mt-2">
                          {cd.changes.map((ch, ci) => (
                            <div key={ci} style={{ fontSize: 'var(--text-xs)', display: 'flex', gap: '8px' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: 90 }}>{ch.field}:</span>
                              <span style={{ color: 'var(--color-error)', textDecoration: 'line-through' }}>{ch.from}</span>
                              <span>➔</span>
                              <strong style={{ color: 'var(--color-success)' }}>{ch.to}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Không có sự thay đổi trạng thái nhân vật nào giữa 2 cảnh.</p>
                )}
              </div>

              {/* Item Diffs */}
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning)', marginBottom: 'var(--space-2)' }}>
                  ⚔️ Biến Chuyển Vật Phẩm ({diffResult.itemDiffs?.length || 0})
                </h4>
                {diffResult.itemDiffs?.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {diffResult.itemDiffs.map((idiff, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3)',
                        borderLeft: '3px solid var(--color-warning)'
                      }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{idiff.item}</strong>
                        <div className="flex flex-col gap-1 mt-2">
                          {idiff.changes.map((ch, ci) => (
                            <div key={ci} style={{ fontSize: 'var(--text-xs)', display: 'flex', gap: '8px' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: 90 }}>{ch.field}:</span>
                              <span style={{ color: 'var(--color-error)', textDecoration: 'line-through' }}>{ch.from}</span>
                              <span>➔</span>
                              <strong style={{ color: 'var(--color-success)' }}>{ch.to}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Vị trí và chủ sở hữu vật phẩm không đổi.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* NORMAL TIMELINE & SNAPSHOT INSPECTOR */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: 'var(--space-4)',
          height: 'calc(100vh - 180px)',
          minHeight: '620px',
          overflow: 'hidden'
        }}>
          {/* Left: Snapshots Timeline */}
          <div className="card" style={{
            padding: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            height: '100%',
            overflow: 'hidden'
          }}>
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Dòng Thời Gian Snapshots
              </span>
              <span className="badge badge--muted">{storyStateSnapshots.length}</span>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              paddingRight: '4px'
            }}>
              {storyStateSnapshots.map((snap) => {
                const data = typeof snap.snapshot_data === 'string' ? JSON.parse(snap.snapshot_data || '{}') : snap.snapshot_data;
                const isSelected = snap.id === selectedSnapshotId;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshotId(snap.id)}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-tertiary)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <strong style={{ fontSize: 'var(--text-sm)', color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                        Cảnh {data?.scene_number || '?'}: {data?.scene_title || 'Cảnh'}
                      </strong>
                      <button
                        className="btn btn--ghost btn--xs"
                        style={{
                          color: 'var(--color-error)',
                          padding: '2px 6px',
                          fontSize: '12px',
                          opacity: 0.7,
                          borderRadius: '4px'
                        }}
                        title="Xóa snapshot này"
                        onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                      >
                        🗑️
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      📍 {data?.location || 'Chưa định vị'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      🕒 {new Date(snap.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                );
              })}
              {storyStateSnapshots.length === 0 && (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  Chưa có snapshot nào. Chọn cảnh bên dưới để tạo.
                </div>
              )}
            </div>

            {/* Quick Generate Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)', marginTop: 'auto' }}>
              <label className="label">Tạo Snapshot Mới Cho Cảnh:</label>
              <div className="flex gap-2">
                <select id="quickSceneSelect" className="select" style={{ flex: 1, fontSize: '12px' }}>
                  {scenes.map(s => (
                    <option key={s.id} value={s.id}>Cảnh {s.scene_number}: {s.title}</option>
                  ))}
                </select>
                <button
                  className="btn btn--secondary btn--sm"
                  disabled={generating}
                  onClick={() => {
                    const sel = document.getElementById('quickSceneSelect');
                    if (sel) handleGenerateForScene(sel.value);
                  }}
                >
                  {generating ? '...' : 'Tạo'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Snapshot Detail View */}
          {parsedData ? (
            <div className="card" style={{
              height: '100%',
              overflowY: 'auto',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)'
            }}>
              {/* Snapshot Title */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-3)' }}>
                <div className="flex justify-between items-center">
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Cảnh {parsedData.scene_number}: {parsedData.scene_title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="badge badge--success">CANON SNAPSHOT</span>
                    <button
                      className="btn btn--ghost btn--sm text-error"
                      onClick={() => handleDeleteSnapshot(selectedSnapshotId)}
                      title="Xóa snapshot này"
                    >
                      🗑️ Xóa Snapshot
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  📍 Bối cảnh: <strong>{parsedData.location}</strong>
                </p>
              </div>

              {/* Characters State Grid */}
              <div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  👤 Trạng Thái Nhân Vật Tại Thời Điểm Này
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--space-3)',
                }}>
                  {Object.entries(parsedData.characters || {}).map(([name, charState]) => (
                    <div key={name} style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: 'var(--text-xs)'
                    }}>
                      <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                        <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{name}</strong>
                        <span style={{
                          color: charState.health === 'critical' ? 'var(--color-error)' : 'var(--color-success)',
                          fontWeight: 600
                        }}>
                          {charState.health || 'Bình thường'}
                        </span>
                      </div>

                      <div><span style={{ color: 'var(--text-muted)' }}>📍 Vị trí:</span> {charState.location || 'N/A'}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>👗 Trang phục:</span> {charState.outfit || 'N/A'}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>⚡ Thực lực:</span> {charState.power || '0'}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>💭 Cảm xúc:</span> {charState.emotion || 'N/A'}</div>

                      {charState.injuries && charState.injuries !== 'Không' && charState.injuries !== 'none' && (
                        <div style={{ color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px' }}>
                          🩹 Chấn thương: {charState.injuries}
                        </div>
                      )}

                      {charState.inventory?.length > 0 && (
                        <div style={{ marginTop: '2px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>🎒 Mang theo:</span> {charState.inventory.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Items in Scene */}
              {parsedData.items && Object.keys(parsedData.items).length > 0 && (
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-warning)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                    ⚔️ Vật Phẩm & Bảo Vật
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 'var(--space-2)',
                  }}>
                    {Object.entries(parsedData.items).map(([itemName, itemState]) => (
                      <div key={itemName} style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--text-xs)'
                      }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{itemName}</strong>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                          Sở hữu: {itemState.owner || 'Chưa gán'} | Tình trạng: {itemState.condition || 'normal'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Threads */}
              {parsedData.active_threads?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                    🧵 Tuyến Truyện Đang Mở Sau Cảnh Này
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {parsedData.active_threads.map((t, idx) => (
                      <span key={idx} className="badge badge--primary" style={{ padding: '4px 10px' }}>
                        🧵 {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex items-center justify-center text-center" style={{ height: '100%', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                <p>Chưa chọn Snapshot nào.</p>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Nhấp vào một snapshot ở danh sách bên trái để xem chi tiết.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
