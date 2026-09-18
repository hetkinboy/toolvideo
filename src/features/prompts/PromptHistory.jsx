import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function PromptHistory() {
  const currentProject = useStore((s) => s.currentProject);
  const [promptRuns, setPromptRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    if (currentProject) {
      loadHistory();
    }
  }, [currentProject]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const runs = await api.getPromptRuns(currentProject.id);
      setPromptRuns(runs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prompt-history-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">📜 Prompt History (Lịch Sử Chạy Prompt)</h1>
          <p className="page-header__subtitle">
            Nhật ký các lần sinh prompt và kết quả tương tác với AI — Không làm mất phiên làm việc cũ
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Runs List */}
        <div className="card" style={{ padding: 'var(--space-3)' }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Danh Sách Lần Chạy ({promptRuns.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {promptRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => setSelectedRun(run)}
                style={{
                  background: selectedRun?.id === run.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-tertiary)',
                  border: selectedRun?.id === run.id ? '1px solid var(--accent)' : '1px solid transparent',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{run.target_type || 'Kịch bản'}</strong>
                  <span className="badge badge--muted">{run.status || 'prepared'}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  🕒 {new Date(run.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}

            {promptRuns.length === 0 && !loading && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                Chưa có lịch sử chạy prompt nào trong dự án này.
              </div>
            )}
          </div>
        </div>

        {/* Detail view */}
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          {selectedRun ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Chi Tiết Prompt Run</h3>
                <span className="badge badge--primary">{selectedRun.target_type}</span>
              </div>

              <div>
                <label className="label">Generated Prompt:</label>
                <textarea
                  className="textarea"
                  rows={8}
                  readOnly
                  value={selectedRun.generated_prompt || ''}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                />
              </div>

              {selectedRun.ai_response && (
                <div>
                  <label className="label">AI Response:</label>
                  <textarea
                    className="textarea"
                    rows={8}
                    readOnly
                    value={selectedRun.ai_response || ''}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chọn một lần chạy từ danh sách bên trái để xem lại prompt và phản hồi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
