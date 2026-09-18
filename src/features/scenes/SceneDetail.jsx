import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../core/api';
import { useStore } from '../../core/store';
import ContinuityCheckModal from '../continuity/ContinuityCheckModal';

export default function SceneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scene, setScene] = useState(null);
  const [episode, setEpisode] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [panelTab, setPanelTab] = useState('context');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showContinuityModal, setShowContinuityModal] = useState(false);
  const [copiedVisualPrompt, setCopiedVisualPrompt] = useState(false);
  const [shots, setShots] = useState([]);
  const [contextText, setContextText] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptType, setPromptType] = useState('image');
  const [rawAiResponse, setRawAiResponse] = useState('');
  const [parsedAiData, setParsedAiData] = useState(null);
  const [panelMessage, setPanelMessage] = useState('');
  const [identityPack, setIdentityPack] = useState({ characters: [], references: [], identity_lock: '' });
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const currentProject = useStore((s) => s.currentProject);

  const characters = useStore((s) => s.characters);
  const loadCharacters = useStore((s) => s.loadCharacters);
  const locations = useStore((s) => s.locations);
  const loadLocations = useStore((s) => s.loadLocations);
  const items = useStore((s) => s.items);
  const loadItems = useStore((s) => s.loadItems);
  const storyThreads = useStore((s) => s.storyThreads);
  const loadStoryThreads = useStore((s) => s.loadStoryThreads);

  useEffect(() => {
    loadScene();
    if (currentProject) {
      loadCharacters();
      loadLocations();
      loadItems();
      loadStoryThreads();
    }
  }, [id, currentProject]);

  const loadScene = async () => {
    setLoading(true);
    try {
      const s = await api.getScene(id);
      setScene(s);
      setEditData(s);
      try { setShots(await api.getSceneShots(id)); } catch { setShots([]); }
      try { setIdentityPack(await api.getSceneIdentityPack(id)); } catch { setIdentityPack({ characters: [], references: [], identity_lock: '' }); }
      if (s.episode_id) {
        const ep = await api.getEpisode(s.episode_id);
        setEpisode(ep);
      }
      if (s.location_id) {
        try {
          const loc = await api.getLocation(s.location_id);
          setLocation(loc);
        } catch { }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const updated = await api.updateScene(id, editData);
      setScene(updated);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleApprove = async () => {
    if (window.confirm('Approve scene này? Nội dung sẽ được sử dụng làm Canon và tự động lưu Story State Snapshot.')) {
      setSaveStatus('saving');
      try {
        const updated = await api.updateScene(id, { ...editData, status: 'approved' });
        try {
          await api.generateSnapshot(id);
        } catch (snapErr) {
          console.warn('Lỗi tự động tạo snapshot:', snapErr);
        }
        setScene(updated);
        setEditData(updated);
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }
  };

  const handleLock = async () => {
    if (window.confirm('⚠️ Lock scene? Thay đổi sau này có thể ảnh hưởng đến các scene sau.')) {
      setSaveStatus('saving');
      try {
        const updated = await api.updateScene(id, { ...editData, status: 'locked' });
        setScene(updated);
        setEditData(updated);
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }
  };

  const updateField = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const parseArray = (raw) => {
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  };

  const toggleArrayItem = (field, itemId) => {
    const current = parseArray(editData[field]);
    const updated = current.includes(itemId) ? current.filter(x => x !== itemId) : [...current, itemId];
    updateField(field, JSON.stringify(updated));
  };

  const buildSceneVisualPrompt = () => {
    const selectedChars = characters.filter((c) => parseArray(editData.character_ids).includes(c.id));
    const selectedLoc = locations.find((l) => l.id === editData.location_id);
    const ar = currentProject?.aspect_ratio || '9:16';
    const visualStyle = currentProject?.visual_style || 'cinematic anime, highly detailed, dramatic lighting';
    const charTokens = selectedChars.map((c) => `${c.name}: ${c.appearance || 'detailed face and eyes'}, wearing ${c.default_outfit || 'signature outfit'}`).join('; ');
    const locToken = selectedLoc ? (selectedLoc.visual_prompt || `${selectedLoc.name}, ${selectedLoc.architecture || ''}, ${selectedLoc.lighting || 'cinematic lighting'}`) : '';
    return [
      visualStyle,
      locToken ? `Environment: ${locToken}` : '',
      charTokens ? `Characters: ${charTokens}` : '',
      identityPack.identity_lock || '',
      editData.action ? `Action: ${editData.action}` : '',
      editData.emotion_change ? `Emotion: ${editData.emotion_change}` : '',
      editData.time_of_day ? `Time of day: ${editData.time_of_day}` : '',
      `--ar ${ar}`,
    ].filter(Boolean).join(', ');
  };

  const buildContext = () => {
    const selectedChars = characters.filter((c) => parseArray(editData.character_ids).includes(c.id));
    const selectedItems = items.filter((item) => parseArray(editData.item_ids).includes(item.id));
    const selectedThreads = storyThreads.filter((thread) => parseArray(editData.story_thread_ids).includes(thread.id));
    const text = [
      `PROJECT: ${currentProject?.name || ''}`,
      `EPISODE: EP${String(episode?.episode_number || '').padStart(2, '0')} ${episode?.title || ''}`,
      `SCENE: SC${String(scene.scene_number).padStart(2, '0')} ${scene.title || ''}`,
      `PURPOSE: ${editData.purpose || ''}`,
      `SUMMARY: ${editData.summary || ''}`,
      `LOCATION: ${location?.name || 'Chưa gán'}`,
      `TIME: ${editData.time_of_day || ''} | WEATHER: ${editData.weather || ''}`,
      `STARTING STATE: ${stateDisplay(startState)}`,
      `ACTION: ${editData.action || ''}`,
      `DIALOGUE: ${editData.dialogue || ''}`,
      `ENDING STATE: ${stateDisplay(endState)}`,
      selectedChars.length ? `CHARACTERS: ${selectedChars.map((c) => `${c.name} (${c.role || ''})`).join(', ')}` : '',
      selectedItems.length ? `ITEMS: ${selectedItems.map((item) => item.name).join(', ')}` : '',
      selectedThreads.length ? `OPEN THREADS: ${selectedThreads.map((thread) => thread.title).join(', ')}` : '',
    ].filter(Boolean).join('\n');
    setContextText(text);
    setPanelMessage('Context đã được build.');
    return text;
  };

  const buildPanelPrompt = () => {
    const videoPrompt = [
      'Cinematic video scene',
      editData.action || editData.summary || scene.title || '',
      editData.dialogue ? `Dialogue: ${editData.dialogue}` : '',
      editData.emotion_change ? `Emotional arc: ${editData.emotion_change}` : '',
      'natural acting, coherent motion, cinematic camera, consistent character identity',
    ].filter(Boolean).join(', ');
    const nextPrompt = promptType === 'video' ? videoPrompt : buildSceneVisualPrompt();
    setPromptText(nextPrompt);
    setPanelMessage(`${promptType === 'video' ? 'Video' : 'Image'} prompt đã được build.`);
    return nextPrompt;
  };

  const copyToClipboard = async (text, message) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setPanelMessage(message);
  };

  const parseAiResponse = () => {
    try {
      const match = rawAiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const firstBrace = rawAiResponse.indexOf('{');
      const lastBrace = rawAiResponse.lastIndexOf('}');
      const jsonText = match ? match[1] : rawAiResponse.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonText);
      setParsedAiData(parsed.scene || parsed);
      setPanelMessage('Đã nhận diện dữ liệu AI. Kiểm tra rồi bấm Apply.');
    } catch (err) {
      setParsedAiData(null);
      setPanelMessage(`Không đọc được JSON: ${err.message}`);
    }
  };

  const applyAiResponse = async () => {
    if (!parsedAiData) return;
    const allowed = ['title', 'purpose', 'summary', 'action', 'dialogue', 'emotion_change', 'transition', 'time_of_day', 'weather', 'starting_state', 'ending_state'];
    const patch = {};
    allowed.forEach((key) => {
      if (parsedAiData[key] !== undefined) {
        patch[key] = typeof parsedAiData[key] === 'object' ? JSON.stringify(parsedAiData[key]) : parsedAiData[key];
      }
    });
    try {
      const updated = await api.updateScene(id, patch);
      setScene(updated);
      setEditData(updated);
      setShowPromptModal(false);
      setRawAiResponse('');
      setParsedAiData(null);
      setPanelMessage('Đã áp dụng phản hồi AI vào Scene.');
    } catch (err) {
      setPanelMessage(`Lỗi áp dụng: ${err.message}`);
    }
  };

  if (loading || !scene) {
    return <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Đang tải Scene...</div></div>;
  }

  const isLocked = scene.status === 'locked';

  let startState = {};
  let endState = {};
  try { startState = JSON.parse(scene.starting_state || '{}'); } catch { }
  try { endState = JSON.parse(scene.ending_state || '{}'); } catch { }

  const stateDisplay = (stateObj) => {
    if (!stateObj || Object.keys(stateObj).length === 0) return '(chưa có)';
    return Object.entries(stateObj).map(([charKey, vals]) => {
      if (typeof vals === 'object') {
        return `${charKey}: ${Object.entries(vals).map(([k, v]) => `${k}=${v}`).join(', ')}`;
      }
      return `${charKey}: ${vals}`;
    }).join('\n');
  };

  const editorFields = [
    { key: 'purpose', label: '🎯 Scene Purpose', type: 'text' },
    { key: 'summary', label: '📝 Summary', type: 'textarea' },
    { key: 'time_of_day', label: '🕐 Thời gian', type: 'text' },
    { key: 'weather', label: '🌤️ Thời tiết', type: 'text' },
    { key: 'starting_state', label: '📥 Starting State', type: 'state' },
    { key: 'action', label: '🎬 Action', type: 'textarea' },
    { key: 'dialogue', label: '💬 Dialogue', type: 'textarea', mono: true },
    { key: 'emotion_change', label: '😢→😠 Emotion Change', type: 'text' },
    { key: 'ending_state', label: '📤 Ending State', type: 'state' },
    { key: 'transition', label: '🔄 Transition', type: 'textarea' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, margin: 'calc(var(--space-8) * -1)', height: 'calc(100vh - var(--header-height))' }}>
      {/* Main Editor */}
      <div style={{ overflow: 'auto', padding: 'var(--space-6)' }}>
        {/* Back + Header */}
        <button className="btn btn--ghost btn--sm" onClick={() => episode ? navigate(`/episodes/${episode.id}`) : navigate('/scenes')} style={{ marginBottom: 'var(--space-3)' }}>
          ← {episode ? `EP${String(episode.episode_number).padStart(2, '0')} ${episode.title}` : 'Quay lại'}
        </button>

        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="page-header__left">
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--accent)', opacity: 0.5 }}>
                SC{String(scene.scene_number).padStart(2, '0')}
              </span>
              <h1 className="page-header__title">{scene.title || 'Untitled Scene'}</h1>
            </div>
          </div>
          <div className="page-header__actions">
            <span className={`canon-badge canon-badge--${scene.status}`}>{scene.status}</span>
            <button className="btn btn--secondary btn--sm" onClick={handleSave}>💾 Save</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setShowPromptModal(true)}>📋 Copy Prompt</button>
            {scene.status === 'draft' && <button className="btn btn--primary btn--sm" onClick={handleApprove}>✓ Approve</button>}
            {scene.status === 'approved' && <button className="btn btn--danger btn--sm" onClick={handleLock}>🔒 Lock</button>}
          </div>
        </div>

        {/* Lock Warning */}
        {isLocked && (
          <div style={{
            background: 'var(--color-error-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-error)',
          }}>
            🔒 Scene đã bị LOCKED. Thay đổi có thể ảnh hưởng đến các scene sau.
          </div>
        )}

        {/* Selectors Section: Location, Characters, Items, Threads */}
        <div className="card mb-4" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label className="label">📍 Bối Cảnh (Location)</label>
              <select
                className="select"
                value={editData.location_id || ''}
                onChange={(e) => updateField('location_id', e.target.value)}
                disabled={isLocked}
              >
                <option value="">-- Chưa gán địa điểm --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Characters involved */}
          <div>
            <label className="label">👥 Nhân Vật Tham Gia Cảnh:</label>
            <div className="flex gap-2 flex-wrap">
              {characters.map(char => {
                const isSelected = parseArray(editData.character_ids).includes(char.id);
                return (
                  <button
                    key={char.id}
                    type="button"
                    className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--ghost'}`}
                    style={{ fontSize: '12px', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}
                    onClick={() => !isLocked && toggleArrayItem('character_ids', char.id)}
                    disabled={isLocked}
                  >
                    {isSelected ? '✓ ' : '+ '} {char.name} ({char.role})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items involved */}
          <div>
            <label className="label">⚔️ Vật Phẩm Xuất Hiện:</label>
            <div className="flex gap-2 flex-wrap">
              {items.map(it => {
                const isSelected = parseArray(editData.item_ids).includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    className={`btn btn--sm ${isSelected ? 'btn--secondary' : 'btn--ghost'}`}
                    style={{ fontSize: '12px', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}
                    onClick={() => !isLocked && toggleArrayItem('item_ids', it.id)}
                    disabled={isLocked}
                  >
                    {isSelected ? '✓ ' : '+ '} {it.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Story Threads */}
          <div>
            <label className="label">🧵 Tuyến Truyện Liên Quan:</label>
            <div className="flex gap-2 flex-wrap">
              {storyThreads.map(th => {
                const isSelected = parseArray(editData.story_thread_ids).includes(th.id);
                return (
                  <button
                    key={th.id}
                    type="button"
                    className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--ghost'}`}
                    style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}
                    onClick={() => !isLocked && toggleArrayItem('story_thread_ids', th.id)}
                    disabled={isLocked}
                  >
                    {isSelected ? '✓ ' : '+ '} {th.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Standardized Visual Prompt for AI Image Gen (Midjourney / Flux / Runway) */}
        <div className="card mb-4" style={{
          padding: 'var(--space-4)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)'
        }}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '18px' }}>🎨</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Standardized Visual Prompt (Tạo Hình AI Chuẩn Hóa)
              </span>
              <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                {currentProject?.aspect_ratio || '9:16'}
              </span>
            </div>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => {
                const selectedChars = characters.filter(c => parseArray(editData.character_ids).includes(c.id));
                const selectedLoc = locations.find(l => l.id === editData.location_id);
                const ar = currentProject?.aspect_ratio || '9:16';
                const visualStyle = currentProject?.visual_style || 'Anime cinematic style, unreal engine 5 render, dramatic lighting, 8k';

                const charTokens = selectedChars.map(c => `${c.name}: ${c.appearance || 'detailed face and eyes'}, wearing ${c.default_outfit || 'signature robes'}`).join('; ');
                const locToken = selectedLoc ? (selectedLoc.visual_prompt || `${selectedLoc.name}, ${selectedLoc.architecture || ''}, ${selectedLoc.lighting || 'cinematic lighting'}`) : '';

                const vp = [
                  visualStyle,
                  locToken ? `Environment: ${locToken}` : '',
                  charTokens ? `Characters: ${charTokens}` : '',
                  editData.action ? `Action: ${editData.action}` : '',
                  editData.time_of_day ? `Time of day: ${editData.time_of_day}` : '',
                  `--ar ${ar.replace(':', ':')}`
                ].filter(Boolean).join(', ');

                navigator.clipboard.writeText(vp);
                setCopiedVisualPrompt(true);
                setTimeout(() => setCopiedVisualPrompt(false), 2000);
              }}
            >
              {copiedVisualPrompt ? '✓ Đã Chép Prompt!' : '📋 Chép Visual Prompt Tạo Hình'}
            </button>
          </div>

          <div style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            lineHeight: 1.6,
            wordBreak: 'break-word'
          }}>
            {(() => {
              const selectedChars = characters.filter(c => parseArray(editData.character_ids).includes(c.id));
              const selectedLoc = locations.find(l => l.id === editData.location_id);
              const ar = currentProject?.aspect_ratio || '9:16';
              const visualStyle = currentProject?.visual_style || 'Anime cinematic style, unreal engine 5 render, dramatic lighting, 8k';
              const charTokens = selectedChars.map(c => `${c.name}: ${c.appearance || 'detailed face and eyes'}, wearing ${c.default_outfit || 'signature robes'}`).join('; ');
              const locToken = selectedLoc ? (selectedLoc.visual_prompt || `${selectedLoc.name}, ${selectedLoc.architecture || ''}, ${selectedLoc.lighting || 'cinematic lighting'}`) : '';

              return [
                visualStyle,
                locToken ? `Environment: ${locToken}` : '',
                charTokens ? `Characters: ${charTokens}` : '',
                editData.action ? `Action: ${editData.action}` : '',
                editData.time_of_day ? `Time of day: ${editData.time_of_day}` : '',
                `--ar ${ar.replace(':', ':')}`
              ].filter(Boolean).join(', ');
            })()}
          </div>

          <div className="flex justify-between items-center mt-2" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            <span>
              💡 Chuẩn hóa tự động: Gắn chặt Token diện mạo nhân vật + Ánh sáng bối cảnh + Tỷ lệ khung hình
            </span>
            <span style={{ color: 'var(--accent)' }}>
              Midjourney / Flux / Runway ready
            </span>
          </div>
        </div>

        {/* Editor Fields */}
        <div className="flex flex-col gap-4">
          {editorFields.map((field) => (
            <div key={field.key} className="form-group">
              <label className="label">{field.label}</label>
              {field.type === 'text' && (
                <input
                  className="input"
                  value={editData[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  disabled={isLocked}
                />
              )}
              {field.type === 'textarea' && (
                <textarea
                  className="input textarea"
                  value={editData[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  disabled={isLocked}
                  style={field.mono ? { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' } : {}}
                  rows={5}
                />
              )}
              {field.type === 'state' && (
                <div className="card" style={{
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-tertiary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {stateDisplay(field.key === 'starting_state' ? startState : endState)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Context Panel */}
      <div style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="right-panel__tabs">
          {['context', 'prompt', 'continuity'].map((tab) => (
            <button
              key={tab}
              className={`right-panel__tab ${panelTab === tab ? 'right-panel__tab--active' : ''}`}
              onClick={() => setPanelTab(tab)}
            >
              {tab === 'context' ? '📖 Context' : tab === 'prompt' ? '✨ Prompt' : '🔍 Continuity'}
            </button>
          ))}
        </div>

        <div className="right-panel__content">
          {panelTab === 'context' && (
            <div className="flex flex-col gap-4">
              {/* Location */}
              <div>
                <div className="label">📍 Location</div>
                <div className="card" style={{ padding: 'var(--space-3)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {location?.name || 'Chưa gán location'}
                  </div>
                  {location?.description && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                      {location.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Episode Info */}
              {episode && (
                <div>
                  <div className="label">🎬 Episode</div>
                  <div className="card" style={{ padding: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      EP{String(episode.episode_number).padStart(2, '0')}: {episode.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                      {episode.goal}
                    </div>
                  </div>
                </div>
              )}

              {/* Starting State */}
              <div>
                <div className="label">📥 Starting State</div>
                <div className="card" style={{
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {stateDisplay(startState)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button className="btn btn--secondary btn--sm w-full" onClick={buildContext}>🔨 Build Context</button>
                <button className="btn btn--secondary btn--sm w-full" onClick={() => copyToClipboard(contextText || buildContext(), 'Đã chép context.')} disabled={!contextText}>📋 Copy Context</button>
              </div>
              {contextText && <textarea className="input textarea" rows={10} value={contextText} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />}
              <div className="card" style={{ padding: 'var(--space-3)' }}>
                <div className="flex items-center justify-between"><span className="label" style={{ margin: 0 }}>🎬 Phase 3 Production</span><span className="badge badge--primary">{shots.length} shots</span></div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', margin: 'var(--space-2) 0' }}>Tách Scene thành shot, storyboard và prompt hình/video.</div>
                <div style={{ color: identityPack.references.length ? 'var(--color-success)' : 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>🔒 Identity Lock: {identityPack.references.length} ảnh tham chiếu / {identityPack.characters.length} nhân vật</div>
                <button className="btn btn--primary btn--sm w-full" onClick={() => navigate(`/shots?scene=${id}`)}>Mở Shot Editor →</button>
              </div>
            </div>
          )}

          {panelTab === 'prompt' && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="label">Prompt Type</div>
                <select className="input" value={promptType} onChange={(e) => setPromptType(e.target.value)}>
                  <option value="image">Image Prompt</option>
                  <option value="video">Video Prompt</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <button className="btn btn--primary btn--sm w-full" onClick={buildPanelPrompt}>✨ Build Prompt</button>
                <button className="btn btn--secondary btn--sm w-full" onClick={() => copyToClipboard(promptText, 'Đã chép prompt.')} disabled={!promptText}>📋 Copy Prompt</button>
                <button className="btn btn--secondary btn--sm w-full" onClick={() => setShowPromptModal(true)}>📥 Paste AI Response</button>
              </div>

              {promptText && <textarea className="input textarea" rows={10} value={promptText} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />}

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                💡 Build prompt → Copy → Paste vào ChatGPT → Copy response → Paste lại đây
              </div>
            </div>
          )}

          {panelTab === 'continuity' && (
            <div className="flex flex-col gap-4">
              <button
                className="btn btn--primary btn--sm w-full"
                onClick={() => setShowContinuityModal(true)}
              >
                🔍 Run Continuity Check
              </button>

              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                padding: 'var(--space-3)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                lineHeight: 'var(--leading-relaxed)',
              }}>
                Kiểm tra tính nhất quán tự động:
                <ul style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)' }}>
                  <li>Vị trí nhân vật</li>
                  <li>Trang phục</li>
                  <li>Chấn thương chưa lành</li>
                  <li>Kiến thức (Knowledge Matrix)</li>
                  <li>Tình trạng vật phẩm</li>
                  <li>Quy tắc thế giới (Bible)</li>
                </ul>
              </div>
            </div>
          )}
          {panelMessage && <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)' }}>✓ {panelMessage}</div>}
        </div>
      </div>

      {/* Continuity Check Modal */}
      {showContinuityModal && (
        <ContinuityCheckModal
          sceneId={id}
          projectId={currentProject?.id}
          initialContent={`${editData.title || ''}\n${editData.action || ''}\n${editData.dialogue || ''}`}
          onClose={() => setShowContinuityModal(false)}
        />
      )}

      {/* Paste AI Response Modal */}
      {showPromptModal && (
        <div className="modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">📥 Paste AI Response</h3>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowPromptModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="label">Paste ChatGPT response tại đây</label>
                <textarea
                  className="input textarea"
                  rows={12}
                  placeholder="Paste nội dung AI đã tạo..."
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
                  value={rawAiResponse}
                  onChange={(e) => setRawAiResponse(e.target.value)}
                />
              </div>
              {parsedAiData && <div className="card" style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{JSON.stringify(parsedAiData, null, 2)}</div>}
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setShowPromptModal(false)}>Hủy</button>
              <button className="btn btn--secondary" onClick={parseAiResponse}>🔍 Parse Response</button>
              <button className="btn btn--primary" onClick={applyAiResponse} disabled={!parsedAiData}>✓ Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
