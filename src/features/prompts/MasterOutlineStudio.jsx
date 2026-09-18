import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../core/store';
import { api } from '../../core/api';

export default function MasterOutlineStudio() {
  const navigate = useNavigate();
  const currentProject = useStore((s) => s.currentProject);
  const loadCharacters = useStore((s) => s.loadCharacters);
  const loadEpisodes = useStore((s) => s.loadEpisodes);
  const loadScenes = useStore((s) => s.loadScenes);
  const loadLocations = useStore((s) => s.loadLocations);
  const loadItems = useStore((s) => s.loadItems);
  const loadStoryThreads = useStore((s) => s.loadStoryThreads);
  const loadStoryArcs = useStore((s) => s.loadStoryArcs);
  const loadFactions = useStore((s) => s.loadFactions);

  // Outline Generation Config
  const [numEpisodes, setNumEpisodes] = useState(10);
  const [expandSeason, setExpandSeason] = useState(true);
  const [storyPremise, setStoryPremise] = useState('');
  const [pacing, setPacing] = useState('fast'); // fast for TikTok, moderate for YouTube
  const [masterPrompt, setMasterPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Import State
  const [rawAiResponse, setRawAiResponse] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);
  const [parseError, setParseError] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);

  // Auto initialize prompt on project change
  useEffect(() => {
    if (currentProject) {
      if (!storyPremise && currentProject.description) {
        setStoryPremise(currentProject.description);
      }
      buildMasterPrompt();
    }
  }, [currentProject, numEpisodes, expandSeason, storyPremise, pacing]);

  // Build the Super Master Outline Prompt
  const buildMasterPrompt = () => {
    if (!currentProject) return;

    const platform = currentProject.target_platform || 'TikTok';
    const aspectRatio = currentProject.aspect_ratio || '9:16';
    const genre = currentProject.genre || 'Chinese Fantasy / Action / Cultivation';
    const tone = currentProject.story_tone || 'Tense + Dramatic + Underdog Rising';

    const expandSection = expandSeason
      ? `## YÊU CẦU MỞ RỘNG PHẦN TIẾP THEO (EXPANDABLE SEASON ARCHITECTURE):
- Đây là Season 1 (Gồm ${numEpisodes} tập). Hãy xây dựng cấu trúc có thể MỞ RỘNG SANG SEASON 2 VÀ SEASON 3.
- Tập cuối (${numEpisodes}) phải có Season Finale Climax bùng nổ, NHƯNG kết thúc bằng một "Cliffhanger Móc Treo" lớn (ví dụ: thế lực thượng giới xuất hiện, kẻ thù lớn hơn lộ diện, một bí mật động trời được giải phóng).
- Để lại ít nhất 2 bí mật tầng cao chưa giải mã (Unresolved Mysteries) để làm tiền đề cho phần tiếp theo.`
      : `## CẤU TRÚC TRỌN GÓI (STANDALONE ARC):
- Toàn bộ mạch truyện chính được giải quyết trọn vẹn và thỏa mãn trong ${numEpisodes} tập này.`;

    const promptText = `Bạn là một Showrunner & Biên kịch trưởng (Lead Screenwriter) hàng đầu trong ngành sản xuất phim ngắn dọc (${platform}, Tỷ lệ khung hình ${aspectRatio}).

Nhiệm vụ của bạn là LẬP DÀN Ý TOÀN BỘ CỐT TRUYỆN (MASTER OUTLINE) cho dự án sau:
- Tên Dự Án: "${currentProject.name}"
- Thể Loại: ${genre}
- Tông Giọng: ${tone}
- Định Dạng: Phim ngắn ${platform} (${aspectRatio}), thời lượng mỗi tập 90-120 giây, nhịp phim dồn dập, giật gân, cao trào liên tục.
- Tiền Đề / Ý Tưởng Mở Đầu: ${storyPremise || 'Một thiếu niên bị coi là phế vật vô tình đạt được cơ duyên nghịch thiên, bắt đầu hành trình nghịch tập báo thù và bảo vệ người thân.'}
- Quy Mô: Toàn bộ ${numEpisodes} tập phim liên hoàn.

${expandSection}

---

## HƯỚNG DẪN ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC):
Để hệ thống AI Video Studio có thể tự động bóc tách và nhập dữ liệu vào cơ sở dữ liệu, bạn BẮT BUỘC phải trả về cấu trúc JSON hợp lệ bọc trong cặp dấu \`\`\`json và \`\`\` theo chuẩn sau:

\`\`\`json
{
  "bible": {
    "logline": "Một câu tóm tắt hấp dẫn toàn bộ cốt truyện",
    "main_story_summary": "Tóm tắt hành trình từ tập 1 đến tập ${numEpisodes}",
    "world_description": "Mô tả thế giới, bối cảnh thời đại",
    "world_rules": "3-5 quy luật bất biến của thế giới (sức mạnh, đẳng cấp, cấm kỵ)",
    "power_system": "Hệ thống cảnh giới hoặc cấp bậc sức mạnh",
    "main_conflict": "Mâu thuẫn sống còn cốt lõi",
    "ending_direction": "Hướng kết thúc của mùa phim này"
  },
  "characters": [
    {
      "name": "Tên nhân vật chính",
      "alias": "Biệt hiệu",
      "role": "main",
      "gender": "Nam/Nữ",
      "age": "18",
      "apparent_age": "18 (độ tuổi ngoại hình; có thể khác tuổi thật nếu tu tiên, trường sinh)",
      "description": "Mô tả thần thái, xuất thân",
      "appearance": "Đặc điểm nhận diện khuôn mặt, tóc, mắt (chuẩn tiếng Anh để sinh ảnh)",
      "default_outfit": "Trang phục cố định đặc trưng xuyên suốt phim",
      "personality": "Tính cách đặc trưng",
      "goal": "Mục tiêu tối thượng",
      "secret": "Bí mật sống còn chưa ai biết"
    },
    {
      "name": "Tên đối thủ / phản diện chính",
      "alias": "Biệt hiệu",
      "role": "enemy",
      "gender": "Nam/Nữ",
      "age": "25",
      "apparent_age": "25 (độ tuổi ngoại hình; có thể khác tuổi thật nếu tu tiên, trường sinh)",
      "description": "Tàn nhẫn, kiêu ngạo",
      "appearance": "Gương mặt sắc lạnh và đặc điểm nhận diện đúng cốt truyện; không tự thêm sẹo nếu nhân vật không có",
      "default_outfit": "Trang phục sang trọng hoặc hắc y",
      "personality": "Tự phụ, độc ác",
      "goal": "Chiếm đoạt bảo vật, tiêu diệt nhân vật chính",
      "secret": "Giao dịch bí mật với thế lực hắc ám"
    }
  ],
  "locations": [
    {
      "name": "Tên địa điểm chính 1 (VD: Từ Đường Gia Tộc Phế Tích)",
      "type": "indoor/outdoor",
      "description": "Mô tả không gian",
      "architecture": "Kiến trúc cổ xưa, hoang tàn",
      "lighting": "Ánh trăng rọi qua mái ngói thủng, kịch tính",
      "visual_prompt": "ancient dilapidated Chinese temple shrine, broken roof, moonlight beam, photorealistic, 8k, cinematic lighting"
    },
    {
      "name": "Tên địa điểm chính 2 (VD: Võ Đài Sinh Tử)",
      "type": "outdoor",
      "description": "Nơi diễn ra trận chiến cao trào",
      "architecture": "Võ đài đá khổng lồ, bao quanh bởi khán đài",
      "lighting": "Nắng gắt gay gắt hoặc mây đen vần vũ",
      "visual_prompt": "massive ancient stone battle arena, cheering crowds in background, dramatic stormy sky, cinematic epic lighting"
    }
  ],
  "items": [
    {
      "name": "Tên bảo vật then chốt (VD: Nhẫn Long Huyết)",
      "type": "artifact/weapon",
      "description": "Bảo vật gia truyền hoặc hệ thống",
      "abilities": "Tăng tốc tu luyện, thức tỉnh thần lực",
      "owner": "Tên nhân vật sở hữu"
    }
  ],
  "factions": [
    {
      "name": "Tên thế lực / phe phái (VD: Huyết Ảnh Điện)",
      "type": "cult/family/sect/crime",
      "description": "Thế lực tà phái thèm khát bảo vật",
      "leader": "Tên thủ lĩnh",
      "alignment": "enemy/ally/rival/neutral",
      "headquarters": "Đại bản doanh"
    },
    {
      "name": "Tên gia tộc / đồng minh (VD: Bắc Cảnh Vương Phủ)",
      "type": "family",
      "description": "Gia tộc danh giá bị vu oan, đồng minh với nhân vật chính",
      "leader": "Tên người đại diện",
      "alignment": "ally",
      "headquarters": "Phủ đệ cũ"
    }
  ],
  "arcs": [
    {
      "name": "Arc 1: Khởi Đầu & Thức Tỉnh",
      "start_episode": 1,
      "end_episode": 6,
      "summary": "Tóm tắt diễn biến lớn giai đoạn khởi đầu",
      "goal": "Mục tiêu cần hoàn thành trong Arc"
    },
    {
      "name": "Arc 2: Sóng Gió & Trỗi Dậy",
      "start_episode": 7,
      "end_episode": 14,
      "summary": "Tóm tắt giai đoạn đối đầu trung tâm",
      "goal": "Khám phá bí mật và mở rộng đồng minh"
    },
    {
      "name": "Arc 3: Đại Chiến Đỉnh Điểm",
      "start_episode": 15,
      "end_episode": ${numEpisodes},
      "summary": "Tóm tắt cao trào chung kết mùa phim",
      "goal": "Đánh bại trùm cuối và mở ra tương lai"
    }
  ],
  "storyThreads": [
    {
      "title": "Tuyến truyện 1 (VD: Khôi phục thực lực và rửa sạch nỗi oan)",
      "description": "Mục tiêu chính xuyên suốt mùa phim",
      "priority": "Critical"
    },
    {
      "title": "Tuyến truyện 2 (VD: Vạch trần nội gián cấu kết kẻ thù)",
      "description": "Tuyến phụ tạo bất ngờ",
      "priority": "High"
    }
  ],
  "episodes": [
    {
      "episode_number": 1,
      "title": "Tên tập 1 ấn tượng (VD: Phế Vật Thức Tỉnh)",
      "goal": "Mục tiêu sống sót và thức tỉnh năng lực",
      "opening_hook": "3 giây đầu giật gân (Nhân vật chính sắp bị hành quyết hoặc đánh đập)",
      "main_conflict": "Sự áp bức của kẻ thù đối diện với thời khắc sinh tử",
      "climax": "Kích hoạt cơ duyên bí ẩn ngay khoảnh khắc hiểm nghèo",
      "ending_hook": "Cliffhanger kết tập khiến người xem phải bấm xem tiếp ngay",
      "scenes": [
        {
          "scene_number": 1,
          "title": "Bị sỉ nhục tại đại sảnh",
          "purpose": "Thiết lập tình cảnh bi đát và sự bất công",
          "action": "Nhân vật chính bị ép quỳ gối, đối thủ giẫm đạp ngọc bội gia truyền",
          "dialogue": "Ngươi chỉ là một tên phế vật, còn dám mơ tưởng cưới tiểu thư?",
          "emotion_change": "Uất hận ➔ Lãnh đạm quyết tuyệt"
        },
        {
          "scene_number": 2,
          "title": "Cơ duyên thức tỉnh",
          "purpose": "Bước ngoặt số phận",
          "action": "Máu của nhân vật chính nhỏ lên cổ vật, luồng sáng vàng kim bùng phát",
          "dialogue": "[Hệ thống phát hiện túc chủ huyết mạch phù hợp, tiến hành kích hoạt!]",
          "emotion_change": "Bàng hoàng ➔ Tràn đầy tự tin"
        }
      ]
    }
    // ... TIẾP TỤC ĐẦY ĐỦ CHO TẤT CẢ ${numEpisodes} TẬP
  ]
}
\`\`\`

Hãy viết thật chi tiết, đầy đủ toàn bộ ${numEpisodes} tập với nhịp phim cực kỳ lôi cuốn!`;

    setMasterPrompt(promptText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(masterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Smart Parser
  const handleParseAiResponse = () => {
    setParseError('');
    setParsedPreview(null);
    if (!rawAiResponse.trim()) {
      setParseError('Vui lòng dán câu trả lời của AI vào ô bên dưới.');
      return;
    }

    try {
      // 1. Try to extract JSON between ```json ... ``` or directly {...}
      let jsonString = '';
      const codeBlockMatch = rawAiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else {
        const firstBrace = rawAiResponse.indexOf('{');
        const lastBrace = rawAiResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = rawAiResponse.substring(firstBrace, lastBrace + 1);
        }
      }

      if (!jsonString) {
        throw new Error('Không tìm thấy khối dữ liệu JSON trong văn bản dán vào. Hãy chắc chắn ChatGPT đã xuất ra cấu trúc ```json ... ```');
      }

      const parsed = JSON.parse(jsonString);

      // Validate basic structure
      if (!parsed.episodes && !parsed.characters && !parsed.bible) {
        throw new Error('Cấu trúc dữ liệu thiếu các mục quan trọng (episodes, characters hoặc bible).');
      }

      const summary = {
        hasBible: !!parsed.bible,
        charactersCount: Array.isArray(parsed.characters) ? parsed.characters.length : 0,
        locationsCount: Array.isArray(parsed.locations) ? parsed.locations.length : 0,
        itemsCount: Array.isArray(parsed.items) ? parsed.items.length : 0,
        factionsCount: Array.isArray(parsed.factions) ? parsed.factions.length : 0,
        arcsCount: Array.isArray(parsed.arcs) ? parsed.arcs.length : 0,
        threadsCount: Array.isArray(parsed.storyThreads) ? parsed.storyThreads.length : 0,
        episodesCount: Array.isArray(parsed.episodes) ? parsed.episodes.length : 0,
        scenesCount: Array.isArray(parsed.episodes)
          ? parsed.episodes.reduce((acc, ep) => acc + (Array.isArray(ep.scenes) ? ep.scenes.length : 0), 0)
          : 0,
        data: parsed
      };

      setParsedPreview(summary);
    } catch (err) {
      setParseError('Lỗi đọc dữ liệu: ' + err.message);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!parsedPreview || !currentProject) return;

    setImporting(true);
    setImportSuccess(null);
    try {
      const res = await api.importMasterOutline(currentProject.id, {
        ...parsedPreview.data,
        replaceExisting
      });

      // Cascading reload store
      await Promise.all([
        loadCharacters(),
        loadEpisodes(),
        loadScenes(),
        loadLocations(),
        loadItems(),
        loadStoryThreads(),
        loadStoryArcs ? loadStoryArcs() : Promise.resolve(),
        loadFactions ? loadFactions() : Promise.resolve(),
      ]);

      setImportSuccess(res);
      setParsedPreview(null);
      setRawAiResponse('');
    } catch (err) {
      alert('Lỗi import vào Studio: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="master-outline-studio" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="page-header__left">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '26px' }}>🚀</span>
            <h1 className="page-header__title">Lập Dàn Ý Toàn Truyện (Master Story Outline Studio)</h1>
          </div>
          <p className="page-header__subtitle">
            Khởi tạo Super Prompt chuẩn cho ChatGPT/Claude để viết trọn vẹn toàn bộ Vũ trụ, Nhân vật, Tập & Cảnh — Tự động bóc tách và import 1-click vào Studio
          </p>
        </div>
      </div>

      {/* 2-Column Workflow Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(450px, 1fr) minmax(450px, 1fr)',
        gap: 'var(--space-6)',
        alignItems: 'start'
      }}>
        {/* COLUMN 1: Generate & Copy Master Prompt */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="badge badge--primary">BƯỚC 1</span>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cấu Hình & Lấy Super Prompt
              </h2>
            </div>
            <button
              className="btn btn--primary btn--sm"
              onClick={handleCopy}
              style={{ padding: '6px 14px' }}
            >
              {copied ? '✓ Đã Chép Prompt!' : '📋 Chép Master Prompt'}
            </button>
          </div>

          {/* Config Controls */}
          <div className="form-grid-2">
            <div>
              <label className="label">Số Lượng Tập Phim</label>
              <select
                className="select"
                value={numEpisodes}
                onChange={(e) => setNumEpisodes(parseInt(e.target.value))}
              >
                <option value={5}>5 Tập (Mini Series / Thử nghiệm)</option>
                <option value={10}>10 Tập (Chuẩn Season 1)</option>
                <option value={15}>15 Tập (Mở rộng kịch tính)</option>
                <option value={20}>20 Tập (Series Dài Tập)</option>
              </select>
            </div>

            <div>
              <label className="label">Nhịp Phim (Pacing)</label>
              <select
                className="select"
                value={pacing}
                onChange={(e) => setPacing(e.target.value)}
              >
                <option value="fast">Dồn dập, giật gân (TikTok/Shorts)</option>
                <option value="moderate">Vừa phải, có chiều sâu (YouTube)</option>
                <option value="cinematic">Điện ảnh, nhiều phân đoạn tâm lý</option>
              </select>
            </div>
          </div>

          {/* Expand Season Checkbox */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <input
              type="checkbox"
              id="expandSeasonToggle"
              checked={expandSeason}
              onChange={(e) => setExpandSeason(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer', transform: 'scale(1.15)' }}
            />
            <label htmlFor="expandSeasonToggle" style={{ cursor: 'pointer', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Cấu trúc Mở Rộng Season / Phần Tiếp Theo (Expandable Architecture)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>
                Khi bật, AI sẽ cài cắm Season Finale Cliffhanger ở tập cuối cùng các bí mật chưa giải quyết để sẵn sàng nối tiếp Season 2, Season 3 mà không bị gãy mạch truyện.
              </div>
            </label>
          </div>

          {/* Premise input */}
          <div>
            <label className="label">Ý Tưởng Mở Đầu Hoặc Tiền Đề Cốt Truyện</label>
            <textarea
              className="textarea"
              rows={3}
              value={storyPremise}
              onChange={(e) => setStoryPremise(e.target.value)}
              placeholder="Nhập tiền đề câu chuyện (ví dụ: Thiếu gia gia tộc bị trục xuất bất ngờ nhặt được hệ thống tu tiên ẩn danh, vừa giấu thân phận vừa báo thù...)"
            />
          </div>

          {/* Prompt Preview */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="label" style={{ marginBottom: 0 }}>Prompt Hoàn Chỉnh Sẵn Sàng Gửi ChatGPT</label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{masterPrompt.length} ký tự</span>
            </div>
            <textarea
              className="textarea"
              rows={9}
              readOnly
              value={masterPrompt}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            💡 <strong>Hướng dẫn:</strong> Bấm nút <strong>"📋 Chép Master Prompt"</strong> ➔ Dán vào ChatGPT (khuyến khích GPT-4o hoặc Claude 3.5 Sonnet) ➔ Sau khi có kết quả, copy toàn bộ và dán sang ô bên phải.
          </div>
        </div>

        {/* COLUMN 2: Smart 1-Click Importer */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="badge badge--success">BƯỚC 2</span>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Dán Kết Quả AI & Import 1-Click
              </h2>
            </div>
          </div>

          <div>
            <label className="label">Dán Toàn Bộ Phản Hồi Từ ChatGPT Vào Đây:</label>
            <textarea
              className="textarea"
              rows={11}
              value={rawAiResponse}
              onChange={(e) => setRawAiResponse(e.target.value)}
              placeholder="Dán toàn bộ câu trả lời chứa khối ```json ... ``` từ ChatGPT vào đây..."
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.5
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              className="btn btn--secondary flex-1"
              onClick={handleParseAiResponse}
            >
              🔍 Phân Tích Cấu Trúc (Preview)
            </button>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setRawAiResponse('');
                setParsedPreview(null);
                setParseError('');
              }}
            >
              Xóa dữ liệu
            </button>
          </div>

          {/* Error display */}
          {parseError && (
            <div style={{
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              fontSize: '12px',
              lineHeight: 1.5
            }}>
              ⚠️ {parseError}
            </div>
          )}

          {/* Success Notification */}
          {importSuccess && (
            <div style={{
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>
                🎉 Đã Import Toàn Bộ Dàn Ý Thành Công!
              </div>
              <div>
                Hệ thống đã tự động tạo và lưu:
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>{importSuccess.charactersCount} Nhân vật & Hồ sơ trạng thái</li>
                  <li>{importSuccess.locationsCount} Địa điểm & Bối cảnh</li>
                  <li>{importSuccess.episodesCount} Tập phim</li>
                  <li>{importSuccess.scenesCount} Cảnh quay chi tiết</li>
                </ul>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => navigate('/episodes')}
                >
                  ➔ Xem Danh Sách Các Tập
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate('/bible')}
                >
                  Xem Story Bible
                </button>
              </div>
            </div>
          )}

          {/* Parsed Preview Card */}
          {parsedPreview && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                ✨ Kết Quả Nhận Diện Được:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Nhân Vật</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    👥 {parsedPreview.charactersCount}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Địa Điểm</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🏛️ {parsedPreview.locationsCount}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Bảo Vật</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ⚔️ {parsedPreview.itemsCount}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Thế Lực</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
                    🏴 {parsedPreview.factionsCount > 0 ? parsedPreview.factionsCount : 'Tự tạo'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Cung Truyện</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
                    🎯 {parsedPreview.arcsCount > 0 ? parsedPreview.arcsCount : 'Tự phân bổ'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Tập Phim</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🎬 {parsedPreview.episodesCount}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Cảnh Quay</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🎞️ {parsedPreview.scenesCount}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Tuyến Truyện</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🧵 {parsedPreview.threadsCount}
                  </div>
                </div>
              </div>

              {/* Deduplication option */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  type="checkbox"
                  id="replaceOutlineCheck"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="replaceOutlineCheck" style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <strong>Làm sạch & Ghi đè dàn ý cũ</strong> (Khuyến nghị: chống trùng lặp tên nhân vật, tập phim)
                </label>
              </div>

              <div className="pt-2">
                <button
                  className="btn btn--primary btn--lg w-full"
                  onClick={handleConfirmImport}
                  disabled={importing}
                >
                  {importing ? 'Đang Import Vào Database...' : '⚡ Xác Nhận Import Toàn Bộ Vào Studio (1-Click)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
