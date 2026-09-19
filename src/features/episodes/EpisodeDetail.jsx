import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function EpisodeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentProject = useStore((s) => s.currentProject);
  const characters = useStore((s) => s.characters);
  const locations = useStore((s) => s.locations);

  const [episode, setEpisode] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [shots, setShots] = useState([]);
  const [planningForm, setPlanningForm] = useState({ duration_target: 120, duration_min: 90, duration_max: 300, content_density: 'adaptive', word_budget: 0, duration_notes: '' });
  const [planningSaving, setPlanningSaving] = useState(false);
  const [planningMessage, setPlanningMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // AI Prompt & Import Modal State
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [generatedEpisodePrompt, setGeneratedEpisodePrompt] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [rawAiScenesText, setRawAiScenesText] = useState('');
  const [parsedScenes, setParsedScenes] = useState([]);
  const [parsedOutfits, setParsedOutfits] = useState([]);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [wardrobeOnly, setWardrobeOnly] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [id, currentProject?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ep, sc, allShots] = await Promise.all([
        api.getEpisode(id),
        api.getEpisodeScenes(id),
        currentProject?.id ? api.getShots(currentProject.id) : Promise.resolve([]),
      ]);
      setEpisode(ep);
      setScenes(sc);
      const sceneIds = new Set(sc.map((scene) => scene.id));
      setShots((allShots || []).filter((shot) => sceneIds.has(shot.scene_id)));
      setPlanningForm({
        duration_target: ep.duration_target ?? 120,
        duration_min: ep.duration_min ?? 90,
        duration_max: ep.duration_max ?? 300,
        content_density: ep.content_density || 'adaptive',
        word_budget: ep.word_budget ?? 0,
        duration_notes: ep.duration_notes || '',
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updatePlanningField = (field, value) => {
    setPlanningForm((previous) => ({ ...previous, [field]: value }));
    setPlanningMessage('');
  };

  const handleSavePlanning = async () => {
    setPlanningSaving(true);
    setPlanningMessage('');
    try {
      const updated = await api.updateEpisode(id, {
        ...planningForm,
        duration_target: Number(planningForm.duration_target) || 120,
        duration_min: Number(planningForm.duration_min) || 90,
        duration_max: Number(planningForm.duration_max) || 300,
        word_budget: Number(planningForm.word_budget) || 0,
        planned_duration: plannedDuration,
      });
      setEpisode(updated);
      setPlanningForm({
        duration_target: updated.duration_target ?? 120,
        duration_min: updated.duration_min ?? 90,
        duration_max: updated.duration_max ?? 300,
        content_density: updated.content_density || 'adaptive',
        word_budget: updated.word_budget ?? 0,
        duration_notes: updated.duration_notes || '',
      });
      setPlanningMessage('Đã lưu kế hoạch thời lượng.');
    } catch (err) {
      setPlanningMessage('Không thể lưu kế hoạch: ' + err.message);
    } finally {
      setPlanningSaving(false);
    }
  };

  // Build the detailed scene writing prompt for this specific episode
  const handleOpenPromptModal = () => {
    if (!episode || !currentProject) return;

    const platform = currentProject.target_platform || 'TikTok';
    const aspectRatio = currentProject.aspect_ratio || '9:16';

    const charListStr = characters.slice(0, 8).map(c => `- ${c.name} (${c.role}): ${c.description || ''}, trang phục: ${c.default_outfit || 'signature robes'}`).join('\n');
    const locListStr = locations.slice(0, 6).map(l => `- ${l.name}: ${l.description || l.architecture || ''}`).join('\n');

    const prompt = `Bạn là biên kịch chuyên nghiệp cho phim ngắn ${platform} (${aspectRatio}).

HÃY VIẾT KỊCH BẢN CHI TIẾT TỪNG CẢNH CHO TẬP ${episode.episode_number}: "${episode.title}"
- Dự án: ${currentProject.name} (${currentProject.genre || 'Tu Tiên / Kịch Tính'})
- Tông giọng: ${currentProject.story_tone || 'Tense + Dramatic'}
- Tỷ lệ khung hình: ${aspectRatio}
- Thời lượng mục tiêu: ${episode.duration_target || 120} giây
- Khoảng cho phép: ${episode.duration_min || 90}–${episode.duration_max || 300} giây
- Mật độ nội dung: ${episode.content_density || 'adaptive'}
- Ngân sách lời thoại: ${episode.word_budget || 'tự cân đối theo nội dung'} từ
- Mục tiêu tập: ${episode.goal || 'Tạo đột phá cho nhân vật'}
- Opening Hook (3s đầu): ${episode.opening_hook || 'Căng thẳng mở màn'}
- Xung đột chính: ${episode.main_conflict || 'Đối đầu kẻ thù'}
- Cao trào (Climax): ${episode.climax || 'Khoảnh khắc bùng nổ'}
- Ending Cliffhanger: ${episode.ending_hook || episode.cliffhanger || episode.ending || 'Kết thúc mở kịch tính'}

## NHÂN VẬT THAM GIA:
${charListStr || '- Nhân vật chính và đối thủ'}

## BỐI CẢNH CÓ THỂ DIỄN RA:
${locListStr || '- Đại bản doanh, võ đài hoặc sơn cốc'}

---
## YÊU CẦU ĐẦU RA (JSON BẮT BUỘC):
Hãy chia tập theo đúng thời lượng và mật độ nội dung đã định. Không nhồi nhiều sự kiện vào một tập; nếu nội dung vượt quá giới hạn, đánh dấu điểm nên tách sang Episode tiếp theo. Mỗi Scene phải có thời lượng ước tính và tổng các Scene phải nằm trong khoảng mục tiêu. Trả về cấu trúc JSON hợp lệ bọc trong \`\`\`json và \`\`\`:

\`\`\`json
{
  "outfits": [
    {
      "character_name": "Tên nhân vật",
      "name": "Tên trang phục theo thời kỳ/bối cảnh",
      "era": "hiện đại / cổ trang / chiến đấu",
      "description": "Mô tả đầy đủ",
      "visual_prompt": "Detailed English outfit prompt",
      "tags": "từ khóa nhận diện",
      "is_default": false
    }
  ],
  "scenes": [
    {
      "scene_number": 1,
  "duration": 30,
      "title": "Tên cảnh 1",
      "purpose": "Mục đích cảnh",
      "summary": "Tóm tắt diễn biến ngắn gọn",
      "action": "Mô tả hành động, diễn xuất kịch tính của các nhân vật",
      "dialogue": "Lâm Hạo: 'Ngươi nghĩ hôm nay có thể bước ra khỏi đây?'\\nĐối thủ: 'Muốn chết!'",
      "emotion_change": "Bình thản ➔ Sát khí đằng đằng",
      "character_appearances": [{ "character_name": "Tên nhân vật", "outfit_name": "Tên trang phục", "reference_mode": "identity_outfit", "notes": "biến thể trong cảnh" }],
      "transition": "Cut nhanh sang cảnh tiếp",
      "starting_state": "Nhân vật đầy đủ thể lực",
      "ending_state": "Đối thủ bị áp chế, bảo vật xuất hiện"
    }
  ]
}
\`\`\`
Viết thật chi tiết, hành động và thoại dồn dập, đậm chất phim ngắn đỉnh cao!`;

    setGeneratedEpisodePrompt(prompt);
    setShowPromptModal(true);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedEpisodePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Parse pasted AI response for scenes
  const handleParseScenes = () => {
    setParsedScenes([]);
    setParsedOutfits([]);
    if (!rawAiScenesText.trim()) return;

    try {
      let jsonString = '';
      const codeBlockMatch = rawAiScenesText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else {
        const firstBrace = rawAiScenesText.indexOf('{');
        const lastBrace = rawAiScenesText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = rawAiScenesText.substring(firstBrace, lastBrace + 1);
        }
      }

      if (jsonString) {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed.scenes)) {
          setParsedScenes(parsed.scenes);
          setParsedOutfits(Array.isArray(parsed.outfits) ? parsed.outfits : []);
          return;
        }
      }

      alert('Không nhận diện được mảng "scenes" trong JSON. Hãy kiểm tra định dạng AI!');
    } catch (e) {
      alert('Lỗi đọc JSON: ' + e.message);
    }
  };

  // Submit batch scenes to backend
  const handleImportScenesSubmit = async () => {
    if (parsedScenes.length === 0) return;

    setImporting(true);
    try {
      const res = await api.importEpisodeScenes(id, {
        scenes: parsedScenes,
        outfits: parsedOutfits,
        replaceExisting,
        wardrobeOnly
      });

      await loadData();
      setImportSuccessMsg((res.message || 'Import success') + (res.outfitsCount ? ' | Outfits: ' + res.outfitsCount : ''));
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccessMsg('');
        setParsedScenes([]);
        setParsedOutfits([]);
        setRawAiScenesText('');
      }, 1500);
    } catch (err) {
      alert('Lỗi import scenes: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading || !episode) {
    return <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Đang tải Episode...</div></div>;
  }

  const countWords = (value) => String(value || '').trim().split(/\s+/).filter(Boolean).length;
  const sceneDuration = scenes.reduce((total, scene) => total + (Number(scene.duration) || 0), 0);
  const shotDuration = shots.reduce((total, shot) => total + (Number(shot.duration) || 0), 0);
  const dialogueWords = scenes.reduce((total, scene) => total + countWords(scene.dialogue), 0);
  const dialogueDuration = Math.ceil(dialogueWords / 2.3);
  const plannedDuration = Math.max(sceneDuration, shotDuration, dialogueDuration);
  const targetSeconds = Number(planningForm.duration_target || episode.duration_target || 120);
  const minSeconds = Number(planningForm.duration_min || episode.duration_min || 90);
  const maxSeconds = Number(planningForm.duration_max || episode.duration_max || 300);
  const durationStatus = scenes.length === 0 ? 'Chưa có Scene để đo' : plannedDuration === 0 ? 'Chưa có thời lượng Scene/Shot' : plannedDuration < minSeconds ? 'Nội dung đang ngắn hơn mức tối thiểu' : plannedDuration > maxSeconds ? 'Nội dung đang quá dày, nên tách Episode' : 'Đang nằm trong khoảng phù hợp';

  const sections = [
    { label: 'Mục tiêu', value: episode.goal, icon: '🎯' },
    { label: 'Opening Hook (3s đầu)', value: episode.opening_hook, icon: '🪝' },
    { label: 'Xung đột chính', value: episode.main_conflict, icon: '⚡' },
    { label: 'Climax Cao trào', value: episode.climax, icon: '🔥' },
    { label: 'Ending Cliffhanger', value: episode.ending_hook || episode.ending, icon: '❓' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <button className="btn btn--ghost btn--sm" onClick={() => navigate('/episodes')} style={{ marginBottom: 'var(--space-3)' }}>
        ← Quay lại Danh Sách Episodes
      </button>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="page-header__left">
          <div className="flex items-center gap-3">
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 'var(--text-3xl)',
              background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              EP{String(episode.episode_number).padStart(2, '0')}
            </span>
            <h1 className="page-header__title">{episode.title}</h1>
          </div>
          <p className="page-header__subtitle">
            Quản lý cấu trúc kịch bản và sinh prompt cảnh quay cho tập {episode.episode_number}
          </p>
        </div>
        <div className="page-header__actions">
          <span className={`canon-badge canon-badge--${episode.status}`}>{episode.status}</span>
          <button className="btn btn--primary" onClick={handleOpenPromptModal}>
            ✨ Lấy Prompt Viết Kịch Bản Tập Này
          </button>
          <button className="btn btn--secondary" onClick={() => setShowImportModal(true)}>
            📥 Dán & Import Cảnh Quay
          </button>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="card" style={{
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-5)',
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)'
      }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '24px' }}>🎬</span>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Quy Trình Sản Xuất Tập {episode.episode_number}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Bấm <strong>"Lấy Prompt Viết Kịch Bản"</strong> ➔ Gửi ChatGPT ➔ Bấm <strong>"Dán & Import Cảnh Quay"</strong> để cập nhật toàn bộ cảnh chỉ trong 1 thao tác.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn--primary btn--sm" onClick={handleOpenPromptModal}>
            1. Tạo Prompt Viết Tập
          </button>
          <button className="btn btn--secondary btn--sm" onClick={() => setShowImportModal(true)}>
            2. Import Cảnh AI
          </button>
        </div>
      </div>

      {/* Episode Duration Planner */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)', border: '1px solid rgba(99, 102, 241, 0.28)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.04))' }}>
        <div className="flex justify-between items-center" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div>
            <div className="label" style={{ marginBottom: 3 }}>⏱️ Kế hoạch thời lượng tập</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Không ép mọi tập về 120 giây. Hệ thống đo từ Scene, Shot và thoại để phát hiện tập quá ngắn hoặc quá dày.</div>
          </div>
          <button className="btn btn--primary btn--sm" onClick={handleSavePlanning} disabled={planningSaving}>{planningSaving ? 'Đang lưu...' : '💾 Lưu kế hoạch'}</button>
        </div>
        <div className="form-grid-2" style={{ marginTop: 'var(--space-3)' }}>
          <div className="form-group"><label className="label">Thời lượng mục tiêu (giây)</label><input className="input" type="number" min="30" value={planningForm.duration_target} onChange={(event) => updatePlanningField('duration_target', event.target.value)} /></div>
          <div className="form-group"><label className="label">Mật độ nội dung</label><select className="input" value={planningForm.content_density} onChange={(event) => updatePlanningField('content_density', event.target.value)}><option value="light">Nhẹ — ít sự kiện, nhiều cảm xúc</option><option value="adaptive">Linh hoạt — tự chọn theo nội dung</option><option value="medium">Vừa — cân bằng thông tin và hành động</option><option value="dense">Dày — nhiều sự kiện, nên tách nếu quá tải</option></select></div>
          <div className="form-group"><label className="label">Tối thiểu (giây)</label><input className="input" type="number" min="30" value={planningForm.duration_min} onChange={(event) => updatePlanningField('duration_min', event.target.value)} /></div>
          <div className="form-group"><label className="label">Tối đa (giây)</label><input className="input" type="number" min="30" value={planningForm.duration_max} onChange={(event) => updatePlanningField('duration_max', event.target.value)} /></div>
          <div className="form-group"><label className="label">Ngân sách lời thoại (từ)</label><input className="input" type="number" min="0" value={planningForm.word_budget} onChange={(event) => updatePlanningField('word_budget', event.target.value)} placeholder="0 = tự cân đối" /></div>
          <div className="form-group"><label className="label">Ghi chú phân bổ</label><input className="input" value={planningForm.duration_notes} onChange={(event) => updatePlanningField('duration_notes', event.target.value)} placeholder="Ví dụ: tách sau khi Lâm Phàm cứu người" /></div>
        </div>
        <div className="grid grid--4" style={{ marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
          <div className="card" style={{ padding: 'var(--space-2)' }}><div className="label">Mục tiêu</div><strong>{targetSeconds}s</strong></div>
          <div className="card" style={{ padding: 'var(--space-2)' }}><div className="label">Theo Scene</div><strong>{sceneDuration || '—'}s</strong></div>
          <div className="card" style={{ padding: 'var(--space-2)' }}><div className="label">Theo Shot</div><strong>{shotDuration || '—'}s</strong></div>
          <div className="card" style={{ padding: 'var(--space-2)' }}><div className="label">Dự kiến</div><strong>{plannedDuration || '—'}s</strong></div>
        </div>
        <div style={{ marginTop: 'var(--space-3)', color: plannedDuration > maxSeconds ? 'var(--color-error)' : plannedDuration > 0 && plannedDuration < minSeconds ? 'var(--color-warning)' : 'var(--color-success)', fontSize: 'var(--text-xs)' }}>📊 {durationStatus} · {dialogueWords} từ thoại (~{dialogueDuration}s thoại)</div>
        {planningMessage && <div style={{ marginTop: 'var(--space-2)', color: planningMessage.startsWith('Không') ? 'var(--color-error)' : 'var(--color-success)', fontSize: 'var(--text-xs)' }}>✓ {planningMessage}</div>}
      </div>

      {/* Episode Sections Overview */}
      <div className="grid grid--2 mb-6">
        {sections.filter(s => s.value).map((s) => (
          <div key={s.label} className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="label">{s.icon} {s.label}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Scenes List */}
      <div className="section">
        <div className="section__header">
          <div className="flex items-center gap-2">
            <h2 className="section__title">🎭 Danh Sách Cảnh Quay ({scenes.length} Scenes)</h2>
            <span className="badge badge--muted">Tập {episode.episode_number}</span>
          </div>
          <div className="flex gap-2">
            <button className="btn btn--secondary btn--sm" onClick={() => setShowImportModal(true)}>
              📥 Import Nhiều Cảnh (Batch)
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => navigate(`/scenes`)}>
              + Quản Lý Cảnh Quay
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="card card--clickable"
              onClick={() => navigate(`/scenes/${scene.id}`)}
              style={{ padding: 'var(--space-4)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700,
                    color: 'var(--accent)', background: 'var(--accent-subtle)',
                    padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.25)'
                  }}>
                    SC{String(scene.scene_number).padStart(2, '0')}
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {scene.title || 'Cảnh quay chưa đặt tên'}
                    </div>
                    {scene.purpose && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                        🎯 Mục đích: {scene.purpose}
                      </div>
                    )}
                    {scene.action && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 800 }}>
                        🎬 <strong>Hành động:</strong> {scene.action.slice(0, 120)}{scene.action.length > 120 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`canon-badge canon-badge--${scene.status}`}>{scene.status}</span>
                  <button className="btn btn--ghost btn--sm" style={{ color: 'var(--accent)' }}>
                    Chi tiết ➔
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {scenes.length === 0 && (
          <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
            <div className="empty-state__icon">🎭</div>
            <div className="empty-state__title">Tập này chưa có Cảnh quay nào</div>
            <div className="empty-state__desc">
              Bấm <strong>"✨ Lấy Prompt Viết Kịch Bản Tập Này"</strong> để ChatGPT chia tập thành các cảnh chi tiết và import ngay.
            </div>
            <button className="btn btn--primary" onClick={handleOpenPromptModal} style={{ marginTop: 'var(--space-3)' }}>
              ✨ Lấy Prompt Viết Kịch Bản Ngay
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6" style={{ padding: 'var(--space-4) 0', borderTop: '1px solid var(--border-subtle)' }}>
        {episode.previous_episode_id ? (
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/episodes/${episode.previous_episode_id}`)}>
            ← Episode Trước
          </button>
        ) : <div />}
        {episode.next_episode_id ? (
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/episodes/${episode.next_episode_id}`)}>
            Episode Tiếp Theo →
          </button>
        ) : <div />}
      </div>

      {/* MODAL 1: Get Prompt */}
      {showPromptModal && (
        <div className="modal-backdrop" onClick={() => setShowPromptModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '20px' }}>✨</span>
                <h2 className="modal__title">Prompt Viết Kịch Bản Chi Tiết Cho Tập {episode.episode_number}</h2>
              </div>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowPromptModal(false)}>✕</button>
            </div>
            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Prompt dưới đây đã tự động tích hợp toàn bộ bối cảnh dự án, nhân vật, mục tiêu tập và yêu cầu cấu trúc cảnh quay ngắn chuẩn phim dọc:
              </p>
              <textarea
                className="textarea"
                rows={12}
                readOnly
                value={generatedEpisodePrompt}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)' }}
              />
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowPromptModal(false)}>Đóng</button>
              <button className="btn btn--primary" onClick={handleCopyPrompt}>
                {copiedPrompt ? '✓ Đã Sao Chép Prompt!' : '📋 Sao Chép Prompt 1-Click'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Paste & Import Scenes */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal" style={{ maxWidth: 740 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '20px' }}>📥</span>
                <h2 className="modal__title">Dán & Import Cảnh Quay Cho Tập {episode.episode_number}</h2>
              </div>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowImportModal(false)}>✕</button>
            </div>

            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label className="label">Dán câu trả lời từ AI (chứa JSON các cảnh):</label>
                <textarea
                  className="textarea"
                  rows={8}
                  value={rawAiScenesText}
                  onChange={(e) => setRawAiScenesText(e.target.value)}
                  placeholder="Dán câu trả lời từ ChatGPT chứa khối ```json { scenes: [...] } ``` vào đây..."
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="replaceScenesCheck"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="replaceScenesCheck" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Thay thế các cảnh hiện có trong tập này (Khuyến nghị)
                  </label>
                  <label>
                    <input type="checkbox" id="wardrobeOnlyEpisodeCheck" checked={wardrobeOnly} onChange={(e) => { setWardrobeOnly(e.target.checked); if (e.target.checked) setReplaceExisting(false); }} />
                    Ch&#7881; c&#7853;p nh&#7853;t kho trang ph&#7909;c, gi&#7919; nguy&#234;n Scene c&#361;
                  </label>
                </div>

                <button className="btn btn--secondary btn--sm" onClick={handleParseScenes}>
                  🔍 Nhận Diện Cảnh Quay
                </button>
              </div>

              {/* Preview recognized scenes */}
              {parsedScenes.length > 0 && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                    ✓ Đã nhận diện thành công {parsedScenes.length} Cảnh quay:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                    {parsedScenes.map((sc, i) => (
                      <div key={i} style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                        <strong>Cảnh {sc.scene_number || (i + 1)}:</strong> {sc.title} — <em>{sc.purpose || sc.summary}</em>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importSuccessMsg && (
                <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                  ✓ {importSuccessMsg}
                </div>
              )}
            </div>

            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowImportModal(false)}>Hủy</button>
              <button
                className="btn btn--primary"
                onClick={handleImportScenesSubmit}
                disabled={parsedScenes.length === 0 || importing}
              >
                {importing ? 'Đang Import...' : `⚡ Xác Nhận Import ${parsedScenes.length} Cảnh Vào Tập`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
