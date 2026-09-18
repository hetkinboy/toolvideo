import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function PromptStudio() {
  const currentProject = useStore((s) => s.currentProject);
  const prompts = useStore((s) => s.prompts);
  const loadPrompts = useStore((s) => s.loadPrompts);
  const episodes = useStore((s) => s.episodes);
  const loadEpisodes = useStore((s) => s.loadEpisodes);
  const scenes = useStore((s) => s.scenes);
  const loadScenes = useStore((s) => s.loadScenes);
  const characters = useStore((s) => s.characters);
  const loadCharacters = useStore((s) => s.loadCharacters);
  const locations = useStore((s) => s.locations);
  const loadLocations = useStore((s) => s.loadLocations);
  const items = useStore((s) => s.items);
  const loadItems = useStore((s) => s.loadItems);
  const storyThreads = useStore((s) => s.storyThreads);
  const loadStoryThreads = useStore((s) => s.loadStoryThreads);

  const [selectedPromptType, setSelectedPromptType] = useState('PROMPT_CREATE_SCENE');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('');
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [userInput, setUserInput] = useState('Viết tiếp cảnh kịch tính cao trào, Lâm Hạo đối đầu áp lực từ đối thủ.');
  const [bible, setBible] = useState(null);

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // AI Response Parser State
  const [aiRawResponse, setAiRawResponse] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadPrompts();
      loadEpisodes();
      loadScenes();
      loadCharacters();
      loadLocations();
      loadItems();
      loadStoryThreads();

      api.getBible(currentProject.id).then(setBible).catch(() => {});
    }
  }, [currentProject]);

  useEffect(() => {
    if (episodes.length > 0 && !selectedEpisodeId) {
      setSelectedEpisodeId(episodes[0].id);
    }
  }, [episodes]);

  useEffect(() => {
    const epScenes = scenes.filter(s => s.episode_id === selectedEpisodeId);
    if (epScenes.length > 0) {
      setSelectedSceneId(epScenes[0].id);
    } else {
      setSelectedSceneId('');
    }
  }, [selectedEpisodeId, scenes]);

  // Build the resolved prompt dynamically
  const handleBuildPrompt = () => {
    const templateObj = prompts.find(p => p.type === selectedPromptType) || prompts[0];
    let templateText = templateObj ? templateObj.template : '';

    const currEp = episodes.find(e => e.id === selectedEpisodeId);
    const currScene = scenes.find(s => s.id === selectedSceneId);
    const prevScene = currScene ? scenes.find(s => s.episode_id === currScene.episode_id && s.scene_number === currScene.scene_number - 1) : null;

    // Build context blocks
    const bibleBlock = bible
      ? `Tên: ${bible.title}\nThể loại: ${bible.genre}\nTông giọng: ${bible.story_tone}\nLuật thế giới: ${bible.world_rules}\nHệ thống sức mạnh: ${bible.power_system}\nQuy tắc cấm kỵ: ${bible.forbidden_changes}`
      : currentProject?.description || '';

    const arcBlock = `Arc hiện tại: ${currEp?.title || 'Chưa rõ'} (Mục tiêu: ${currEp?.goal || ''})`;

    const epBlock = currEp
      ? `Tập ${currEp.episode_number}: ${currEp.title}\nMục tiêu: ${currEp.goal}\nHook mở đầu: ${currEp.opening_hook}\nXung đột: ${currEp.main_conflict}\nCao trào: ${currEp.climax}`
      : '';

    const prevSceneBlock = prevScene
      ? `Cảnh ${prevScene.scene_number}: ${prevScene.title}\nDiễn biến: ${prevScene.action}\nEnding State: ${prevScene.ending_state}`
      : 'Không có (đây là cảnh đầu tiên)';

    const charBlock = characters.map(c => `- ${c.name} (${c.role}, ${c.gender}, tuổi thật: ${c.age || 'không rõ'}, độ tuổi ngoại hình: ${c.apparent_age || c.age || 'theo hồ sơ'}): ${c.personality}. Bí mật: ${c.secret || 'none'}`).join('\n');

    const locBlock = locations.map(l => `- ${l.name} (${l.type}): ${l.description || l.architecture || ''}`).join('\n');

    const itemBlock = items.map(i => `- ${i.name} (Tình trạng: ${i.condition}, Sở hữu: ${i.owner || 'Chưa rõ'}): ${i.abilities || ''}`).join('\n');

    const threadBlock = storyThreads.filter(t => t.status === 'open' || t.status === 'developing').map(t => `- ${t.title}: ${t.description}`).join('\n');

    let resolved = templateText
      .replace(/{{PROJECT_BIBLE}}/g, bibleBlock)
      .replace(/{{CURRENT_ARC}}/g, arcBlock)
      .replace(/{{EPISODE}}/g, epBlock)
      .replace(/{{PREVIOUS_SCENE}}/g, prevSceneBlock)
      .replace(/{{CHARACTERS}}/g, charBlock)
      .replace(/{{CURRENT_STATE}}/g, prevSceneBlock)
      .replace(/{{LOCATIONS}}/g, locBlock)
      .replace(/{{ITEMS}}/g, itemBlock)
      .replace(/{{STORY_THREADS}}/g, threadBlock)
      .replace(/{{USER_INPUT}}/g, userInput || 'Kịch bản chi tiết');

    setGeneratedPrompt(resolved);
  };

  useEffect(() => {
    if (prompts.length > 0) {
      handleBuildPrompt();
    }
  }, [selectedPromptType, selectedEpisodeId, selectedSceneId, userInput, bible, characters]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse AI Response
  const handleParseAiResponse = () => {
    if (!aiRawResponse.trim()) return;

    try {
      // Try JSON parse first
      const jsonMatch = aiRawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setParsedResult(parsed);
        return;
      }

      // Regex fallback
      const parsed = {
        title: (aiRawResponse.match(/title["':\s]+([^\n\r",]+)/i) || [])[1] || 'Cảnh mới',
        summary: (aiRawResponse.match(/summary["':\s]+([^\n\r"]+)/i) || [])[1] || '',
        action: (aiRawResponse.match(/action["':\s]+([\s\S]*?)(?=dialogue|emotion|$)/i) || [])[1] || '',
        dialogue: (aiRawResponse.match(/dialogue["':\s]+([\s\S]*?)(?=emotion|ending|$)/i) || [])[1] || '',
        emotion_change: (aiRawResponse.match(/emotion_change["':\s]+([^\n\r"]+)/i) || [])[1] || '',
      };
      setParsedResult(parsed);
    } catch (e) {
      alert('Không thể tự động trích xuất JSON. Hãy kiểm tra định dạng AI trả về!');
    }
  };

  // Apply to selected scene
  const handleApplyToScene = async () => {
    if (!selectedSceneId || !parsedResult) return;
    setApplying(true);
    try {
      const current = scenes.find(s => s.id === selectedSceneId);
      const updated = {
        ...current,
        title: parsedResult.title || current.title,
        purpose: parsedResult.purpose || current.purpose,
        summary: parsedResult.summary || current.summary,
        action: parsedResult.action || current.action,
        dialogue: parsedResult.dialogue || current.dialogue,
        emotion_change: parsedResult.emotion_change || current.emotion_change,
        transition: parsedResult.transition || current.transition,
      };

      if (parsedResult.ending_state) {
        updated.ending_state = typeof parsedResult.ending_state === 'object'
          ? JSON.stringify(parsedResult.ending_state)
          : parsedResult.ending_state;
      }

      await api.updateScene(selectedSceneId, updated);
      await loadScenes();
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    } catch (err) {
      alert('Lỗi áp dụng vào cảnh: ' + err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="prompt-studio-page">
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">✨ Prompt Studio (Xưởng Ghép Prompt AI)</h1>
          <p className="page-header__subtitle">
            Tự động hút toàn bộ bối cảnh dự án, nhân vật và bí mật để ghép thành Prompt hoàn chỉnh cho ChatGPT/Claude
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 1fr', gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* Column 1: Config */}
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
            ⚙️ 1. Cấu Hình Prompt
          </h2>

          <div>
            <label className="label">Loại Prompt (Template):</label>
            <select
              className="select"
              value={selectedPromptType}
              onChange={(e) => setSelectedPromptType(e.target.value)}
            >
              {prompts.map(p => (
                <option key={p.id} value={p.type}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tập Phim Mục Tiêu:</label>
            <select
              className="select"
              value={selectedEpisodeId}
              onChange={(e) => setSelectedEpisodeId(e.target.value)}
            >
              {episodes.map(ep => (
                <option key={ep.id} value={ep.id}>EP{String(ep.episode_number).padStart(2, '0')}: {ep.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Cảnh Quay Cần Tạo:</label>
            <select
              className="select"
              value={selectedSceneId}
              onChange={(e) => setSelectedSceneId(e.target.value)}
            >
              {scenes.filter(s => s.episode_id === selectedEpisodeId).map(sc => (
                <option key={sc.id} value={sc.id}>Cảnh {sc.scene_number}: {sc.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Yêu Cầu Cụ Thể (User Input):</label>
            <textarea
              className="textarea"
              rows={4}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Nhập yêu cầu tình huống, cao trào..."
            />
          </div>

          <button className="btn btn--primary w-full" onClick={handleBuildPrompt}>
            🔄 Tạo Lại Prompt
          </button>
        </div>

        {/* Column 2: Prompt Preview & Copy */}
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="flex justify-between items-center">
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase' }}>
              📋 2. Prompt Đã Ghép Context
            </h2>
            <button
              className={`btn ${copied ? 'btn--primary' : 'btn--secondary'} btn--sm`}
              onClick={handleCopy}
            >
              {copied ? '✓ Đã Chép Vào Clipboard' : '📋 Copy Prompt'}
            </button>
          </div>

          <textarea
            className="textarea"
            rows={18}
            readOnly
            value={generatedPrompt}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 'var(--leading-relaxed)' }}
          />

          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            💡 Bấm <strong>Copy Prompt</strong> ➔ Dán vào ChatGPT / Claude ➔ Copy kết quả trả về và dán sang cột bên phải.
          </div>
        </div>

        {/* Column 3: Paste AI Response & Apply */}
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="flex justify-between items-center">
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-warning)', textTransform: 'uppercase' }}>
              📥 3. Dán Phản Hồi AI (Response)
            </h2>
            <button
              className="btn btn--secondary btn--sm"
              onClick={handleParseAiResponse}
              disabled={!aiRawResponse.trim()}
            >
              🔍 Parse Phản Hồi
            </button>
          </div>

          <textarea
            className="textarea"
            rows={8}
            value={aiRawResponse}
            onChange={(e) => setAiRawResponse(e.target.value)}
            placeholder="Dán phản hồi từ ChatGPT vào đây..."
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          />

          {parsedResult && (
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: 180,
              overflowY: 'auto'
            }}>
              <div><strong style={{ color: 'var(--accent)' }}>Tiêu đề:</strong> {parsedResult.title}</div>
              <div><strong style={{ color: 'var(--accent)' }}>Tóm tắt:</strong> {parsedResult.summary}</div>
              <div><strong style={{ color: 'var(--accent)' }}>Hành động:</strong> {parsedResult.action}</div>
              <div><strong style={{ color: 'var(--accent)' }}>Lời thoại:</strong> {parsedResult.dialogue}</div>
            </div>
          )}

          {parsedResult && (
            <button
              className="btn btn--primary w-full"
              disabled={applying}
              onClick={handleApplyToScene}
            >
              {applying ? 'Đang cập nhật...' : '✓ Áp Dụng Ngay Vào Cảnh Này'}
            </button>
          )}

          {appliedSuccess && (
            <div style={{ color: 'var(--color-success)', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>
              ✓ Đã cập nhật thành công vào Database!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
