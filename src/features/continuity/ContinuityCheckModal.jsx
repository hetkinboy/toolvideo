import React, { useState } from 'react';
import { api } from '../../core/api';

export default function ContinuityCheckModal({ sceneId, projectId, onClose, initialContent = '' }) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunCheck = async () => {
    setLoading(true);
    try {
      const res = await api.checkContinuity({
        project_id: projectId,
        scene_id: sceneId,
        draft_content: content,
      });
      setResult(res);
    } catch (err) {
      alert('Lỗi kiểm tra tính liên tục: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <h2>Kiểm Tra Tính Liên Tục (Continuity Check)</h2>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
            Hệ thống đối chiếu kịch bản cảnh này với: <strong>Canon Bible</strong>, <strong>Ending State cảnh trước</strong>, <strong>Ma trận kiến thức (Knowledge Matrix)</strong> và <strong>Tình trạng vật phẩm</strong>.
          </p>

          <div>
            <label className="label">Nội Dung Hoặc Dàn Ý Kịch Bản Cần Kiểm Tra:</label>
            <textarea
              className="textarea"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập hoặc dán lời thoại, hành động, diễn biến cảnh cần kiểm tra..."
            />
          </div>

          <div className="flex justify-end">
            <button
              className="btn btn--primary"
              disabled={loading}
              onClick={handleRunCheck}
            >
              {loading ? 'Đang phân tích...' : '⚡ Bắt Đầu Kiểm Tra Ngay'}
            </button>
          </div>

          {/* Results Display */}
          {result && (
            <div style={{
              marginTop: 'var(--space-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              borderTop: '1px solid var(--border-color)',
              paddingTop: 'var(--space-3)'
            }}>
              {/* Overall status */}
              <div className="flex justify-between items-center">
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Kết Quả Thẩm Định:</span>
                <span className={`badge badge--${result.valid ? 'success' : 'error'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {result.valid ? '✓ HỢP LỆ (CANON APPROVED)' : '✕ CÓ XUNG ĐỘT LIÊN TỤC'}
                </span>
              </div>

              {/* Errors */}
              {result.errors?.length > 0 && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-error)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-xs)',
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-error)', marginBottom: 'var(--space-1)' }}>
                    ❌ LỖI NGHIÊM TRỌNG (Continuity Errors):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {result.errors.map((err, idx) => (
                      <li key={idx} style={{ color: 'var(--text-primary)' }}>
                        <strong>{err.title}</strong>: {err.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.warnings?.length > 0 && (
                <div style={{
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid var(--color-warning)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-xs)',
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-warning)', marginBottom: 'var(--space-1)' }}>
                    ⚠️ CẢNH BÁO TIỀM ẨN (Continuity Warnings):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {result.warnings.map((warn, idx) => (
                      <li key={idx} style={{ color: 'var(--text-primary)' }}>
                        <strong>{warn.title}</strong>: {warn.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-xs)',
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 'var(--space-1)' }}>
                    💡 GỢI Ý ĐIỀU CHỈNH:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {result.suggestions.map((sug, idx) => (
                      <li key={idx} style={{ color: 'var(--text-secondary)' }}>
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
