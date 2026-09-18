import React, { useEffect, useState } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function BibleEditor() {
  const currentProject = useStore((s) => s.currentProject);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const [bible, setBible] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProject) loadBible();
  }, [currentProject]);

  const loadBible = async () => {
    setLoading(true);
    try {
      const data = await api.getBible(currentProject.id);
      setBible(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await api.updateBible(bible.id, bible);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const updateField = (field, value) => {
    setBible((prev) => ({ ...prev, [field]: value }));
  };

  const getSectionLock = (section) => {
    try {
      const locks = JSON.parse(bible.section_locks || '{}');
      return locks[section] || 'draft';
    } catch { return 'draft'; }
  };

  if (loading || !bible) {
    return <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Đang tải Bible...</div></div>;
  }

  const sections = [
    { key: 'logline', label: 'Logline', type: 'text' },
    { key: 'main_story_summary', label: 'Main Story Summary', type: 'textarea' },
    { key: 'genre', label: 'Genre', type: 'text' },
    { key: 'story_tone', label: 'Story Tone', type: 'text' },
    { key: 'storytelling_style', label: 'Storytelling Style', type: 'text' },
    { key: 'world_description', label: 'World Description', type: 'textarea' },
    { key: 'world_rules', label: 'World Rules', type: 'textarea', lockable: true },
    { key: 'power_system', label: 'Power System', type: 'textarea', lockable: true },
    { key: 'main_conflict', label: 'Main Conflict', type: 'textarea' },
    { key: 'main_objective', label: 'Main Objective', type: 'textarea' },
    { key: 'ending_direction', label: 'Ending Direction', type: 'textarea' },
    { key: 'forbidden_changes', label: 'Forbidden Changes', type: 'textarea', lockable: true },
    { key: 'canon_rules', label: 'Canon Rules', type: 'textarea' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">📖 Project Bible</h1>
          <p className="page-header__subtitle">v{bible.version} · Luật nền của toàn bộ phim</p>
        </div>
        <div className="page-header__actions">
          <span className={`canon-badge canon-badge--${bible.is_locked ? 'locked' : 'approved'}`}>
            {bible.is_locked ? 'LOCKED' : 'EDITABLE'}
          </span>
          <button className="btn btn--primary" onClick={handleSave}>💾 Save</button>
        </div>
      </div>

      {/* Title */}
      <div className="form-group">
        <label className="label">Title</label>
        <input
          className="input"
          value={bible.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}
        />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {sections.map((section) => {
          const lockStatus = getSectionLock(section.key);
          const isLocked = lockStatus === 'locked';

          return (
            <div key={section.key} className="card" style={{
              padding: 'var(--space-4)',
              borderColor: isLocked ? 'rgba(239, 68, 68, 0.15)' : undefined,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                <label className="label" style={{ marginBottom: 0 }}>{section.label}</label>
                {section.lockable && (
                  <span className={`canon-badge canon-badge--${lockStatus}`} style={{ fontSize: '0.6rem' }}>
                    {lockStatus}
                  </span>
                )}
              </div>

              {section.type === 'text' ? (
                <input
                  className="input"
                  value={bible[section.key] || ''}
                  onChange={(e) => updateField(section.key, e.target.value)}
                  disabled={isLocked}
                />
              ) : (
                <textarea
                  className="input textarea"
                  value={bible[section.key] || ''}
                  onChange={(e) => updateField(section.key, e.target.value)}
                  disabled={isLocked}
                  rows={section.key === 'logline' ? 2 : 4}
                  style={{ lineHeight: 'var(--leading-relaxed)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
