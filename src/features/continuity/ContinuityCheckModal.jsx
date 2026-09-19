import React, { useState } from 'react';
import { api } from '../../core/api';

const statusMeta = {
  pass: { label: 'PASS', color: 'var(--color-success)', background: 'rgba(34, 197, 94, 0.1)' },
  warning: { label: 'WARNING', color: 'var(--color-warning)', background: 'rgba(234, 179, 8, 0.1)' },
  blocker: { label: 'BLOCKER', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.1)' },
};

function ResultGroup({ title, items, color, background }) {
  if (!items?.length) return null;
  return (
    <div style={{ background, border: '1px solid ' + color, borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
      <div style={{ fontWeight: 700, color, marginBottom: 'var(--space-1)' }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, index) => (
          <li key={(item.type || title) + '-' + index} style={{ color: 'var(--text-primary)' }}>
            <strong>{item.title}</strong>{item.description ? ': ' + item.description : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ContinuityCheckModal({ sceneId, projectId, onClose, onResult, initialContent = '' }) {
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
      onResult?.(res);
    } catch (err) {
      alert('Lỗi kiểm tra tính liên tục: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resultTone = result?.ready ? statusMeta.pass : result?.valid ? statusMeta.warning : statusMeta.blocker;
  const resultLabel = result?.ready ? 'SẴN SÀNG' : result?.valid ? 'CẦN XEM LẠI CẢNH BÁO' : 'CÓ BLOCKER';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 760 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>🔍</span>
            <div>
              <h2>Continuity Check</h2>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 3 }}>
                Kiểm tra Canon, Story State và độ sẵn sàng để tạo hình/video.
              </div>
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="card" style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Hệ thống đối chiếu Scene với Canon Bible, Ending State của cảnh trước, Knowledge Matrix, tình trạng vật phẩm,
            ảnh tham chiếu nhân vật và bộ Character/Image/Video Prompt. Ảnh/video đầu ra vẫn cần được kiểm tra trực quan ở Shot Editor.
          </div>

          <div>
            <label className="label">Ghi chú hoặc nội dung cần kiểm tra thêm (không bắt buộc)</label>
            <textarea
              className="textarea"
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Nhập thêm lời thoại, hành động hoặc thay đổi trạng thái cần đối chiếu..."
            />
          </div>

          <div className="flex justify-end">
            <button className="btn btn--primary" disabled={loading} onClick={handleRunCheck}>
              {loading ? 'Đang phân tích...' : '⚡ Chạy kiểm tra'}
            </button>
          </div>

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)' }}>
              <div className="flex justify-between items-center" style={{ gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Kết quả kiểm tra</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 3 }}>
                    Điểm readiness: {result.score ?? '—'}/100
                  </div>
                </div>
                <span className="badge" style={{ color: resultTone.color, background: resultTone.background, border: '1px solid ' + resultTone.color, padding: '5px 10px' }}>
                  {resultLabel}
                </span>
              </div>

              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="badge" style={{ color: 'var(--color-error)' }}>Blocker: {result.errors?.length || 0}</span>
                <span className="badge" style={{ color: 'var(--color-warning)' }}>Warning: {result.warnings?.length || 0}</span>
                <span className="badge" style={{ color: 'var(--color-success)' }}>Pass: {result.checks?.filter((check) => check.status === 'pass').length || 0}</span>
              </div>

              {result.checks?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
                  {result.checks.map((check) => {
                    const meta = statusMeta[check.status] || statusMeta.warning;
                    return (
                      <div key={check.key} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: meta.background, border: '1px solid ' + meta.color }}>
                        <div style={{ color: meta.color, fontSize: 'var(--text-xs)', fontWeight: 700 }}>{meta.label}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', marginTop: 3 }}>{check.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <ResultGroup title="BLOCKER — cần sửa trước khi duyệt" items={result.errors} color="var(--color-error)" background="rgba(239, 68, 68, 0.1)" />
              <ResultGroup title="WARNING — cần xem lại hoặc xác nhận" items={result.warnings} color="var(--color-warning)" background="rgba(234, 179, 8, 0.1)" />
              {result.suggestions?.length > 0 && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 'var(--space-1)' }}>💡 Gợi ý tiếp theo</div>
                  <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
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
