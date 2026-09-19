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
  const [projectAssets, setProjectAssets] = useState([]);
  const [outfitLibrary, setOutfitLibrary] = useState([]);
  const [continuityResult, setContinuityResult] = useState(null);
  const [autoLinking, setAutoLinking] = useState(false);
  const [autoLinkReport, setAutoLinkReport] = useState(null);
  const [referenceGallery, setReferenceGallery] = useState(null);
  const [copyingReferenceGroup, setCopyingReferenceGroup] = useState('');
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
      let s = await api.getScene(id);
      const hasLinkedEntities = ['character_ids', 'item_ids', 'story_thread_ids'].some((field) => {
        try { return JSON.parse(s[field] || '[]').length > 0; } catch { return false; }
      });
      if (!hasLinkedEntities && s.status !== 'locked') {
        try {
          const linked = await api.autoLinkScene(id, { replace: false });
          s = linked.scene;
          setAutoLinkReport(linked.detected);
        } catch { }
      }
      setScene(s);
      setEditData(s);
      try { setShots(await api.getSceneShots(id)); } catch { setShots([]); }
      try { setIdentityPack(await api.getSceneIdentityPack(id)); } catch { setIdentityPack({ characters: [], references: [], identity_lock: '' }); }
      try { setProjectAssets(currentProject?.id ? await api.getAssets(currentProject.id) : []); } catch { setProjectAssets([]); }
      try { setOutfitLibrary(currentProject?.id ? await api.getOutfits(currentProject.id) : []); } catch { setOutfitLibrary([]); }
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
      setEditData(updated);
      try { setIdentityPack(await api.getSceneIdentityPack(id)); } catch { }
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleApprove = async () => {
    if (!continuityResult) {
      setPanelTab('continuity');
      setShowContinuityModal(true);
      setPanelMessage('Hãy chạy Continuity Check trước khi Approve Scene.');
      return;
    }
    if (!continuityResult.valid) {
      setPanelTab('continuity');
      setShowContinuityModal(true);
      setPanelMessage('Scene còn Blocker Continuity, chưa thể Approve.');
      return;
    }
    if (!continuityResult.ready && !window.confirm('Scene còn Warning. Bạn vẫn muốn Approve sau khi đã xem lại không?')) return;
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

  const handleUnlock = async () => {
    if (!window.confirm('🔓 Mở khóa Scene này? Scene sẽ trở về trạng thái Approved và có thể chỉnh sửa lại.')) return;
    setSaveStatus('saving');
    try {
      const updated = await api.updateScene(id, { ...editData, status: 'approved' });
      setScene(updated);
      setEditData(updated);
      setContinuityResult(null);
      setPanelMessage('Scene đã được mở khóa và trở về trạng thái Approved.');
      setSaveStatus('saved');
    } catch (err) {
      setPanelMessage('Không thể mở khóa Scene: ' + err.message);
      setSaveStatus('error');
    }
  };

  const handleAutoLink = async () => {
    setAutoLinking(true);
    try {
      const result = await api.autoLinkScene(id, { replace: true });
      setScene(result.scene);
      setEditData(result.scene);
      setAutoLinkReport(result.detected);
      try { setIdentityPack(await api.getSceneIdentityPack(id)); } catch { }
      const count = result.detected.characters.length + result.detected.items.length + result.detected.story_threads.length;
      setPanelMessage(`Đã đọc lại kịch bản và tự liên kết ${count} đối tượng${result.detected.locations.length ? ', cùng địa điểm' : ''}.`);
      setContinuityResult(null);
    } catch (err) {
      setPanelMessage('Không thể tự nhận diện Scene: ' + err.message);
    }
    setAutoLinking(false);
  };

  const updateField = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    setContinuityResult(null);
  };

  const parseArray = (raw) => {
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  };

  const parseObject = (raw) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
    try { return JSON.parse(raw || '{}') || {}; } catch { return {}; }
  };

  const updateCharacterAppearance = (characterId, patch) => {
    const appearances = parseObject(editData.character_appearances);
    updateField('character_appearances', JSON.stringify({
      ...appearances,
      [characterId]: { ...(appearances[characterId] || {}), ...patch },
    }));
  };

  const getCharacterAppearance = (characterId) => {
    const saved = parseObject(editData.character_appearances)[characterId] || {};
    const defaultOutfit = outfitLibrary.find((outfit) => outfit.character_id === characterId && outfit.is_default);
    return { reference_mode: 'identity_outfit', ...saved, outfit_id: saved.outfit_id || defaultOutfit?.id || '' };
  };

  const getSelectedOutfit = (characterId) => {
    const appearance = getCharacterAppearance(characterId);
    return outfitLibrary.find((outfit) => outfit.id === appearance.outfit_id && outfit.character_id === characterId) || null;
  };

  const toggleArrayItem = (field, itemId) => {
    const current = parseArray(editData[field]);
    const updated = current.includes(itemId) ? current.filter(x => x !== itemId) : [...current, itemId];
    updateField(field, JSON.stringify(updated));
  };

  const selectedCharactersForPrompt = () => characters.filter((character) => parseArray(editData.character_ids).includes(character.id));
  const selectedItemsForPrompt = () => items.filter((item) => parseArray(editData.item_ids).includes(item.id));
  const selectedLocationForPrompt = () => locations.find((candidate) => candidate.id === editData.location_id) || (location?.id === editData.location_id ? location : null);

  const buildCharacterPrompt = () => {
    const selectedChars = selectedCharactersForPrompt();
    const characterLines = selectedChars.map((character) => {
      const appearance = getCharacterAppearance(character.id);
      const outfit = getSelectedOutfit(character.id);
      const identity = [
        character.name,
        character.apparent_age ? 'visual age=' + character.apparent_age : character.age ? 'age=' + character.age : '',
        character.appearance ? 'appearance=' + character.appearance : '',
        character.face ? 'face=' + character.face : '',
        character.hair ? 'hair=' + character.hair : '',
        character.eyes ? 'eyes=' + character.eyes : '',
        character.body ? 'body=' + character.body : '',
      ].filter(Boolean).join(', ');
      const wardrobe = outfit
        ? 'SCENE OUTFIT=' + outfit.name + ': ' + (outfit.visual_prompt || outfit.description || outfit.era)
        : 'SCENE OUTFIT=UNRESOLVED — choose a named outfit from the character wardrobe before generation';
      const notes = appearance.notes ? 'Scene appearance notes=' + appearance.notes : '';
      return [identity, wardrobe, notes, 'Reference mode=' + appearance.reference_mode].filter(Boolean).join('\n');
    });
    return [
      'Character identity and wardrobe prompt for this scene:',
      characterLines.join('\n\n'),
      identityPack.identity_lock || '',
      'CRITICAL WARDROBE RULE: identity reference images lock face, hair, apparent age and body only. Never copy clothing from identity references.',
      'The named SCENE OUTFIT overrides default_outfit and all clothing visible in identity reference images.',
    ].filter(Boolean).join('\n');
  };

  const buildImagePrompt = () => {
    const selectedChars = selectedCharactersForPrompt();
    const selectedItems = selectedItemsForPrompt();
    const selectedLoc = selectedLocationForPrompt();
    const ar = currentProject?.aspect_ratio || '9:16';
    const visualStyle = currentProject?.visual_style || 'cinematic anime, highly detailed, dramatic lighting';
    const charTokens = selectedChars.map((character) => {
      const appearance = getCharacterAppearance(character.id);
      const outfit = getSelectedOutfit(character.id);
      return [
        character.name + ': ' + (character.appearance || 'preserve exact facial identity and body proportions'),
        outfit ? 'wearing named outfit “' + outfit.name + '”: ' + (outfit.visual_prompt || outfit.description || outfit.era) : 'outfit unresolved — do not infer clothing from identity reference',
        appearance.notes || '',
      ].filter(Boolean).join(', ');
    }).join('; ');
    const itemTokens = selectedItems.map((item) => item.name + (item.description ? ': ' + item.description : '')).join('; ');
    const locToken = selectedLoc ? (selectedLoc.visual_prompt || selectedLoc.name + ', ' + (selectedLoc.architecture || '') + ', ' + (selectedLoc.lighting || 'cinematic lighting')) : '';
    return [
      visualStyle,
      locToken ? 'Environment: ' + locToken : 'Environment: specify the scene location before generation',
      charTokens ? 'Characters and Scene Wardrobe: ' + charTokens : '',
      itemTokens ? 'Props: ' + itemTokens : '',
      editData.summary ? 'Scene intent: ' + editData.summary : '',
      editData.action ? 'Action: ' + editData.action : '',
      editData.emotion_change ? 'Emotion: ' + editData.emotion_change : '',
      editData.time_of_day ? 'Time of day: ' + editData.time_of_day : '',
      editData.weather ? 'Weather: ' + editData.weather : '',
      identityPack.identity_lock || '',
      'WARDROBE PRIORITY: use identity images for face, hair, age and body only. Ignore clothing in identity images. The named Scene Outfit and its outfit references have absolute clothing priority.',
      'Complete composition, readable silhouettes, consistent scale and screen direction, no accidental extra characters or props.',
      '--ar ' + ar,
    ].filter(Boolean).join(', ');
  };

  const buildVideoPrompt = () => [
    'Image-to-video shot, preserve the approved keyframe and character identity',
    'Keep every character in the named Scene Outfit from the approved keyframe; do not morph, replace or redesign clothing during motion.',
    editData.action || editData.summary || scene.title || '',
    editData.dialogue ? 'Dialogue / lip sync: ' + editData.dialogue : '',
    editData.emotion_change ? 'Emotional arc: ' + editData.emotion_change : '',
    editData.time_of_day ? 'Lighting continuity: ' + editData.time_of_day : '',
    editData.weather ? 'Weather continuity: ' + editData.weather : '',
    'Natural acting, coherent motion, cinematic camera movement, stable face and outfit, clear start and end pose.',
  ].filter(Boolean).join(', ');

  const buildPromptForType = (type) => {
    if (type === 'character') return buildCharacterPrompt();
    if (type === 'video') return buildVideoPrompt();
    return buildImagePrompt();
  };

  const buildSceneVisualPrompt = () => buildImagePrompt();

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
      `LOCATION: ${activeLocation?.name || 'Chưa gán'}`,
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
    const nextPrompt = buildPromptForType(promptType);
    const promptField = promptType === 'character' ? 'character_prompt' : promptType === 'video' ? 'video_prompt' : 'image_prompt';
    updateField(promptField, nextPrompt);
    setPromptText(nextPrompt);
    const promptLabel = promptType === 'character' ? 'Character' : promptType === 'video' ? 'Video' : 'Image';
    setPanelMessage(promptLabel + ' prompt đã được build. Bấm Save để lưu.');
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
    const allowed = ['title', 'purpose', 'summary', 'action', 'dialogue', 'emotion_change', 'transition', 'time_of_day', 'weather', 'starting_state', 'ending_state', 'character_prompt', 'image_prompt', 'video_prompt'];
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

  const copyReferenceGroup = async (group) => {
    const urls = group.assets.map(assetUrl).filter(Boolean);
    if (!urls.length) return;
    setCopyingReferenceGroup(group.key);
    const plainText = [group.label, ...urls].join('\n');
    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
        const htmlBlob = (async () => {
          const sources = await Promise.all(urls.map(async (url) => {
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error('Không tải được ảnh');
              const blob = await response.blob();
              return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch {
              return url;
            }
          }));
          const images = sources.map((source, index) => '<img src="' + escapeHtml(source) + '" alt="' + escapeHtml(group.label) + ' ' + (index + 1) + '" style="max-width:320px;height:auto;margin:4px;" />').join('');
          return new Blob(['<div><h3>' + escapeHtml(group.label) + '</h3>' + images + '</div>'], { type: 'text/html' });
        })();
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        })]);
        setPanelMessage('Đã copy bộ ' + urls.length + ' ảnh của ' + group.label + '. Có thể paste vào nơi hỗ trợ nội dung ảnh; link ảnh cũng được đính kèm.');
      } else {
        await navigator.clipboard.writeText(plainText);
        setPanelMessage('Trình duyệt chỉ cho copy link: đã copy ' + urls.length + ' link ảnh của ' + group.label + '.');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(plainText);
        setPanelMessage('Không thể copy nhiều ảnh trực tiếp; đã copy ' + urls.length + ' link ảnh của ' + group.label + '.');
      } catch {
        setPanelMessage('Trình duyệt đang chặn clipboard. Hãy dùng Mở xem ảnh để mở từng ảnh gốc.');
      }
    }
    setCopyingReferenceGroup('');
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

  const selectedCharacterIds = parseArray(editData.character_ids);
  const selectedItemIds = parseArray(editData.item_ids);
  const activeLocation = selectedLocationForPrompt();
  const selectedAppearanceOutfitIds = selectedCharacterIds
    .map((characterId) => {
      const appearance = getCharacterAppearance(characterId);
      return appearance.reference_mode === 'identity_outfit' ? appearance.outfit_id : '';
    })
    .filter(Boolean);
  const selectedReferences = [
    ...(identityPack.references || []),
    ...projectAssets.filter((asset) => asset.asset_type === 'image' && (
      (asset.target_type === 'character' && selectedCharacterIds.includes(asset.target_id)) ||
      (asset.target_type === 'outfit' && selectedAppearanceOutfitIds.includes(asset.target_id)) ||
      (asset.target_type === 'location' && asset.target_id === editData.location_id) ||
      (asset.target_type === 'item' && selectedItemIds.includes(asset.target_id))
    )),
  ].filter((asset, index, assets) => assets.findIndex((candidate) => candidate.id === asset.id) === index);
  const assetUrl = (asset) => {
    const source = asset?.thumbnail || asset?.file_path || '';
    return source && source.startsWith('/') ? 'http://localhost:3001' + source : source;
  };
  const liveSceneImagePrompt = buildSceneVisualPrompt();
  const sceneImagePrompt = editData.image_prompt || liveSceneImagePrompt;
  const referenceLabel = (asset) => asset.target_type === 'character' ? characters.find((character) => character.id === asset.target_id)?.name || 'Character' : asset.target_type === 'outfit' ? outfitLibrary.find((outfit) => outfit.id === asset.target_id)?.name || 'Outfit' : asset.target_type === 'location' ? activeLocation?.name || 'Location' : items.find((item) => item.id === asset.target_id)?.name || 'Item';
  const characterReferenceGroups = selectedCharacterIds.map((characterId) => {
    const character = characters.find((candidate) => candidate.id === characterId);
    return {
      key: 'character:' + characterId,
      type: 'character',
      label: character?.name || 'Nhân vật',
      assets: selectedReferences.filter((asset) =>
        (asset.target_type === 'character' && asset.target_id === characterId) ||
        (asset.target_type === 'outfit' && getCharacterAppearance(characterId).reference_mode === 'identity_outfit' && asset.target_id === getCharacterAppearance(characterId).outfit_id)
      ),
    };
  });
  const locationReferenceGroups = editData.location_id ? [{
    key: 'location:' + editData.location_id,
    type: 'location',
    label: activeLocation?.name || 'Bối cảnh',
    assets: selectedReferences.filter((asset) => asset.target_type === 'location' && asset.target_id === editData.location_id),
  }] : [];
  const itemReferenceGroups = selectedItemIds.map((itemId) => ({
    key: 'item:' + itemId,
    type: 'item',
    label: items.find((item) => item.id === itemId)?.name || 'Vật phẩm',
    assets: selectedReferences.filter((asset) => asset.target_type === 'item' && asset.target_id === itemId),
  }));
  const referenceGroups = [...characterReferenceGroups, ...locationReferenceGroups, ...itemReferenceGroups];
  const promptFieldByType = { character: 'character_prompt', image: 'image_prompt', video: 'video_prompt' };
  const savedPromptForType = editData[promptFieldByType[promptType]] || (promptType === 'image' ? sceneImagePrompt : '');

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
            <button className="btn btn--secondary btn--sm" onClick={() => copyToClipboard(liveSceneImagePrompt, 'Đã chép Scene Image Prompt với trang phục hiện tại.')}>📋 Copy Image Prompt</button>
            {scene.status === 'draft' && <button className="btn btn--primary btn--sm" onClick={handleApprove}>✓ Approve</button>}
            {scene.status === 'approved' && <button className="btn btn--danger btn--sm" onClick={handleLock}>🔒 Lock</button>}
            {scene.status === 'locked' && <button className="btn btn--secondary btn--sm" onClick={handleUnlock}>🔓 Unlock</button>}
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
          <div className="flex justify-between items-center">
            <div>
              <div className="label" style={{ marginBottom: 3 }}>🧠 Scene tự đọc kịch bản</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                Nhân vật, vật phẩm, địa điểm và tuyến truyện được đối chiếu tự động với thư viện đã cập nhật. Chỉ chỉnh tay khi cần sửa ngoại lệ.
              </div>
            </div>
            <button className="btn btn--secondary btn--sm" type="button" onClick={handleAutoLink} disabled={isLocked || autoLinking}>
              {autoLinking ? 'Đang phân tích...' : '↻ Phân tích lại'}
            </button>
          </div>
          {autoLinkReport && (
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'rgba(34, 197, 94, 0.08)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
              Tự nhận diện: {autoLinkReport.characters.length} nhân vật · {autoLinkReport.items.length} vật phẩm · {autoLinkReport.story_threads.length} tuyến truyện · {autoLinkReport.locations.length} địa điểm
            </div>
          )}
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

          {/* Scene wardrobe per character */}
          {selectedCharacterIds.length > 0 && (
            <div>
              <label className="label">👕 Trang Phục Theo Scene:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedCharacterIds.map((characterId) => {
                  const character = characters.find((candidate) => candidate.id === characterId);
                  const availableOutfits = outfitLibrary.filter((outfit) => outfit.character_id === characterId);
                  const appearance = getCharacterAppearance(characterId);
                  const selectedOutfit = availableOutfits.find((outfit) => outfit.id === appearance.outfit_id);
                  return (
                    <div key={characterId} style={{ padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                      <div className="flex justify-between items-center" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text-primary)', minWidth: 120 }}>{character?.name || 'Nhân vật'}</strong>
                        <select className="select" style={{ flex: 1, minWidth: 220 }} value={appearance.outfit_id} disabled={isLocked} onChange={(event) => updateCharacterAppearance(characterId, { outfit_id: event.target.value })}>
                          <option value="">-- Chưa chọn trang phục --</option>
                          {availableOutfits.map((outfit) => <option key={outfit.id} value={outfit.id}>{outfit.name}{outfit.era ? ' · ' + outfit.era : ''}{outfit.is_default ? ' (mặc định)' : ''}</option>)}
                        </select>
                        <select className="select" style={{ width: 190 }} value={appearance.reference_mode} disabled={isLocked} onChange={(event) => updateCharacterAppearance(characterId, { reference_mode: event.target.value })}>
                          <option value="identity_only">Chỉ khóa nhận diện</option>
                          <option value="identity_outfit">Nhận diện + ảnh trang phục</option>
                        </select>
                        <button className="btn btn--ghost btn--sm" type="button" onClick={() => navigate('/characters/' + characterId)}>Mở kho đồ ↗</button>
                      </div>
                      {selectedOutfit ? (
                        <div style={{ marginTop: 7, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                          <strong>{selectedOutfit.name}:</strong> {selectedOutfit.visual_prompt || selectedOutfit.description || 'Chưa có mô tả prompt'} · {projectAssets.filter((asset) => asset.target_type === 'outfit' && asset.target_id === selectedOutfit.id && asset.asset_type === 'image').length} ảnh
                        </div>
                      ) : (
                        <div style={{ marginTop: 7, color: 'var(--color-warning)', fontSize: 'var(--text-xs)' }}>Chưa có trang phục cho Scene. Prompt sẽ không dùng default_outfit để tránh mặc sai thời kỳ.</div>
                      )}
                      <input className="input" style={{ marginTop: 8 }} value={appearance.notes || ''} disabled={isLocked} onChange={(event) => updateCharacterAppearance(characterId, { notes: event.target.value })} placeholder="Biến thể trong cảnh: ướt mưa, dính bùn, rách tay áo..." />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

        {/* Linked visual references */}
        <div className="card mb-4" style={{ padding: 'var(--space-4)' }}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="label" style={{ marginBottom: 3 }}>🖼️ Visual References theo đối tượng</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Ảnh được load tự động và chia riêng theo từng nhân vật, bối cảnh và vật phẩm.</div>
            </div>
            <span className={'badge ' + (selectedReferences.length ? 'badge--success' : 'badge--warning')}>{selectedReferences.length} ảnh</span>
          </div>
          {referenceGroups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {referenceGroups.map((group) => (
                <div key={group.key} style={{ padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                  <div className="flex justify-between items-center" style={{ gap: 'var(--space-3)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 18 }}>{group.type === 'character' ? '👤' : group.type === 'location' ? '📍' : '⚔️'}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{group.label}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{group.assets.length} ảnh tham chiếu</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn--ghost btn--sm" disabled={!group.assets.length} onClick={() => setReferenceGallery(group)}>🔍 Mở xem ảnh</button>
                      <button type="button" className="btn btn--secondary btn--sm" disabled={!group.assets.length || copyingReferenceGroup === group.key} onClick={() => copyReferenceGroup(group)}>
                        {copyingReferenceGroup === group.key ? 'Đang copy...' : '📋 Copy ' + group.assets.length + ' ảnh'}
                      </button>
                    </div>
                  </div>
                  {group.assets.length > 0 ? (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', overflowX: 'auto', paddingBottom: 2 }}>
                      {group.assets.map((asset) => (
                        <button key={asset.id} type="button" title="Nhấn để mở gallery" onClick={() => setReferenceGallery(group)} style={{ flex: '0 0 74px', width: 74, height: 74, padding: 0, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', cursor: 'zoom-in' }}>
                          {assetUrl(asset) ? <img src={assetUrl(asset)} alt={referenceLabel(asset)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>No preview</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: 'var(--space-2)', color: 'var(--color-warning)', fontSize: 'var(--text-xs)' }}>Chưa có ảnh trong thư viện cho {group.label}.</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(234, 179, 8, 0.08)', color: 'var(--color-warning)', fontSize: 'var(--text-xs)' }}>
              Scene chưa nhận diện nhân vật, địa điểm hoặc vật phẩm để load ảnh tham chiếu.
            </div>
          )}
        </div>

        {/* Scene Visual Prompt */}
        <div className="card mb-4" style={{ padding: 'var(--space-4)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>🎨</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>Scene Visual Prompt — Identity + Trang phục theo cảnh</span>
              <span className="badge badge--primary" style={{ fontSize: 10 }}>{currentProject?.aspect_ratio || '9:16'}</span>
            </div>
            <button className="btn btn--primary btn--sm" onClick={() => {
              navigator.clipboard.writeText(liveSceneImagePrompt);
              setCopiedVisualPrompt(true);
              setTimeout(() => setCopiedVisualPrompt(false), 2000);
            }}>{copiedVisualPrompt ? '✓ Đã chép!' : '📋 Copy Scene Visual Prompt'}</button>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', background: 'rgba(0, 0, 0, 0.3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {liveSceneImagePrompt}
          </div>
          <div className="flex justify-between items-center mt-2" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            <span>🔒 Ảnh Character chỉ khóa nhận diện · 👕 Trang phục lấy từ bộ đồ đã chọn trong Scene</span>
            <span style={{ color: 'var(--accent)' }}>Identity refs + Outfit refs</span>
          </div>
        </div>

        {/* Prompt Pack */}
        <div className="card mb-4" style={{ padding: 'var(--space-4)', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'rgba(99, 102, 241, 0.05)' }}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="label" style={{ marginBottom: 3 }}>✨ Prompt Pack của Scene</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Character Prompt + Image Prompt + Video Prompt. Bấm Save để lưu nội dung đã build.</div>
            </div>
            <span className="badge badge--primary">3 prompt</span>
          </div>
          {[
            { key: 'character_prompt', type: 'character', label: 'Character Prompt', help: 'Danh tính, ngoại hình, trang phục và Identity Lock.' },
            { key: 'image_prompt', type: 'image', label: 'Image Prompt / Keyframe', help: 'Bố cục hình ảnh đầy đủ cho Scene hoặc Shot.' },
            { key: 'video_prompt', type: 'video', label: 'Video Prompt / Motion', help: 'Chuyển động, camera và trạng thái đầu/cuối.' },
          ].map((field) => (
            <div key={field.key} className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <div className="flex justify-between items-center" style={{ gap: 'var(--space-2)' }}>
                <label className="label" style={{ marginBottom: 3 }}>{field.label}</label>
                <button type="button" className="btn btn--secondary btn--sm" disabled={isLocked} onClick={() => updateField(field.key, buildPromptForType(field.type))}>⚡ Build</button>
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginBottom: 5 }}>{field.help}</div>
              <textarea className="input textarea" rows={field.type === 'character' ? 5 : 4} value={editData[field.key] || (field.type === 'image' ? sceneImagePrompt : '')} onChange={(event) => updateField(field.key, event.target.value)} disabled={isLocked} />
            </div>
          ))}
          <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            💡 Prompt là text để gửi sang công cụ AI. Ảnh/video tạo ra sẽ được upload hoặc gắn vào từng Shot trong Shot Editor.
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
                    {activeLocation?.name || 'Chưa gán location'}
                  </div>
                  {activeLocation?.description && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                      {activeLocation.description}
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
                <select className="input" value={promptType} onChange={(event) => { setPromptType(event.target.value); setPromptText(editData[promptFieldByType[event.target.value]] || ''); }}>
                  <option value="character">Character Prompt</option>
                  <option value="image">Image Prompt / Keyframe</option>
                  <option value="video">Video Prompt / Motion</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <button className="btn btn--primary btn--sm w-full" onClick={buildPanelPrompt} disabled={isLocked}>✨ Build Prompt</button>
                <button className="btn btn--secondary btn--sm w-full" onClick={() => copyToClipboard(promptText || savedPromptForType, 'Đã chép prompt.')} disabled={!(promptText || savedPromptForType)}>📋 Copy Prompt</button>
                <button className="btn btn--secondary btn--sm w-full" onClick={() => setShowPromptModal(true)}>📝 Dán phản hồi chữ / JSON</button>
              </div>

              {(promptText || savedPromptForType) && <textarea className="input textarea" rows={10} value={promptText || savedPromptForType} onChange={(event) => { setPromptText(event.target.value); updateField(promptFieldByType[promptType], event.target.value); }} disabled={isLocked} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />}

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                💡 Dùng Copy Prompt để gửi text sang ChatGPT/Midjourney/Flux/Runway. Kết quả ảnh/video không dán vào đây; hãy upload hoặc gắn asset ở Shot Editor.
              </div>
            </div>
          )}

          {panelTab === 'continuity' && (
            <div className="flex flex-col gap-4">
              <button className="btn btn--primary btn--sm w-full" onClick={() => setShowContinuityModal(true)}>🔍 Run Continuity Check</button>
              {continuityResult && <div className="card" style={{ padding: 'var(--space-3)', border: '1px solid ' + (continuityResult.ready ? 'var(--color-success)' : continuityResult.valid ? 'var(--color-warning)' : 'var(--color-error)') }}>
                <div className="flex justify-between items-center"><strong style={{ fontSize: 'var(--text-sm)' }}>{continuityResult.ready ? '✅ Sẵn sàng' : continuityResult.valid ? '⚠️ Cần xem lại' : '⛔ Có blocker'}</strong><span className="badge">{continuityResult.score ?? 0}/100</span></div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 5 }}>Blocker: {continuityResult.errors?.length || 0} · Warning: {continuityResult.warnings?.length || 0}</div>
              </div>}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', lineHeight: 'var(--leading-relaxed)' }}>
                Kiểm tra tự động trước khi tạo keyframe/video:
                <ul style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)' }}>
                  <li>Canon Bible và luật thế giới</li>
                  <li>Ending State, vị trí, trang phục, chấn thương</li>
                  <li>Knowledge Matrix và tình trạng vật phẩm</li>
                  <li>Location, ảnh tham chiếu và đủ 3 loại prompt</li>
                </ul>
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)' }}>PASS = không phát hiện vấn đề. WARNING = cần xác nhận. BLOCKER = phải sửa trước khi Approve.</div>
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
          initialContent={`${editData.title || ''}\nLOCATION: ${activeLocation?.name || ''}\n${editData.action || ''}\n${editData.dialogue || ''}\nCHARACTER PROMPT: ${editData.character_prompt || ''}\nIMAGE PROMPT: ${editData.image_prompt || ''}\nVIDEO PROMPT: ${editData.video_prompt || ''}`}
          onResult={setContinuityResult}
          onClose={() => setShowContinuityModal(false)}
        />
      )}

      {/* Reference Gallery Modal */}
      {referenceGallery && (
        <div className="modal-overlay" onClick={() => setReferenceGallery(null)}>
          <div className="modal" style={{ maxWidth: 980 }} onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <div>
                <h3 className="modal__title">🖼️ {referenceGallery.label}</h3>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 3 }}>{referenceGallery.assets.length} ảnh tham chiếu trong Character Library</div>
              </div>
              <button className="btn btn--ghost btn--icon" onClick={() => setReferenceGallery(null)}>✕</button>
            </div>
            <div className="modal__body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                {referenceGallery.assets.map((asset, index) => (
                  <div key={asset.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                    <button type="button" onClick={() => window.open(assetUrl(asset), '_blank', 'noopener,noreferrer')} style={{ display: 'block', width: '100%', height: 260, border: 0, padding: 0, background: 'var(--bg-secondary)', cursor: 'zoom-in' }}>
                      <img src={assetUrl(asset)} alt={referenceGallery.label + ' ' + (index + 1)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </button>
                    <div className="flex justify-between items-center" style={{ padding: '8px 10px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{(asset.reference_kind || 'Ảnh ' + (index + 1)) + ' · v' + (asset.version || 1)}</span>
                      <button className="btn btn--ghost btn--sm" type="button" onClick={() => window.open(assetUrl(asset), '_blank', 'noopener,noreferrer')}>Mở ảnh gốc ↗</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setReferenceGallery(null)}>Đóng</button>
              <button className="btn btn--primary" disabled={copyingReferenceGroup === referenceGallery.key} onClick={() => copyReferenceGroup(referenceGallery)}>
                {copyingReferenceGroup === referenceGallery.key ? 'Đang copy...' : '📋 Copy ' + referenceGallery.assets.length + ' ảnh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste AI Response Modal */}
      {showPromptModal && (
        <div className="modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">📝 Dán phản hồi dạng chữ / JSON</h3>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowPromptModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="label">Dán phản hồi dạng text hoặc JSON tại đây</label>
                <textarea
                  className="input textarea"
                  rows={12}
                  placeholder="Chỉ dán text/JSON để cập nhật Scene; không dán file ảnh hoặc video vào ô này."
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
