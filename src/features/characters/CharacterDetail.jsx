import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../core/api';

export default function CharacterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [referenceAssets, setReferenceAssets] = useState([]);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [referenceSaving, setReferenceSaving] = useState(false);
  const [referenceError, setReferenceError] = useState('');
  const [copiedPromptKey, setCopiedPromptKey] = useState('');
  const [promptFiles, setPromptFiles] = useState({});
  const [uploadingPromptKey, setUploadingPromptKey] = useState('');
  const [previewAsset, setPreviewAsset] = useState(null);
  const [apparentAgeDraft, setApparentAgeDraft] = useState('');
  const [apparentAgeSaving, setApparentAgeSaving] = useState(false);
  const [apparentAgeMessage, setApparentAgeMessage] = useState('');
  const [outfits, setOutfits] = useState([]);
  const [outfitForm, setOutfitForm] = useState({ name: '', era: '', description: '', visual_prompt: '', tags: '', is_default: false });
  const [outfitFiles, setOutfitFiles] = useState([]);
  const [outfitSaving, setOutfitSaving] = useState(false);
  const [outfitMessage, setOutfitMessage] = useState('');

  useEffect(() => {
    loadCharacter();
  }, [id]);

  useEffect(() => {
    if (!previewAsset) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setPreviewAsset(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [previewAsset]);

  const loadCharacter = async () => {
    setLoading(true);
    try {
      const data = await api.getCharacterFull(id);
      setCharacter(data);
      setApparentAgeDraft(data.apparent_age || '');
      try { setReferenceAssets(await api.getCharacterReferenceAssets(id)); } catch { setReferenceAssets([]); }
      try { setOutfits(await api.getCharacterOutfits(id)); } catch { setOutfits([]); }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };


  const saveOutfit = async (event) => {
    event.preventDefault();
    if (!outfitForm.name.trim()) return;
    setOutfitSaving(true);
    setOutfitMessage('');
    try {
      if (outfitForm.is_default) {
        await Promise.all(outfits.filter((outfit) => outfit.is_default).map((outfit) => api.updateOutfit(outfit.id, { is_default: 0 })));
      }
      const created = await api.createOutfit({
        project_id: character.project_id,
        character_id: character.id,
        name: outfitForm.name.trim(),
        era: outfitForm.era.trim(),
        description: outfitForm.description.trim(),
        visual_prompt: outfitForm.visual_prompt.trim(),
        tags: outfitForm.tags.trim(),
        is_default: outfitForm.is_default ? 1 : 0,
        status: 'approved',
      });
      const assets = [];
      for (let index = 0; index < outfitFiles.length; index += 1) {
        const file = outfitFiles[index];
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        assets.push(await api.uploadAsset({
          project_id: character.project_id,
          asset_type: 'image',
          target_type: 'outfit',
          target_id: created.id,
          reference_kind: 'outfit',
          filename: file.name,
          mime_type: file.type,
          data,
          version: index + 1,
          status: 'approved_reference',
        }));
      }
      setOutfits((current) => [
        ...(outfitForm.is_default ? current.map((outfit) => ({ ...outfit, is_default: 0 })) : current),
        { ...created, assets },
      ]);
      setOutfitForm({ name: '', era: '', description: '', visual_prompt: '', tags: '', is_default: false });
      setOutfitFiles([]);
      setOutfitMessage('Đã thêm trang phục vào kho. Scene có thể chọn theo tên ngay.');
    } catch (err) {
      setOutfitMessage('Lỗi: ' + err.message);
    } finally {
      setOutfitSaving(false);
    }
  };

  const removeOutfit = async (outfit) => {
    if (!window.confirm('Xóa bộ trang phục “' + outfit.name + '” và toàn bộ ảnh của bộ này?')) return;
    try {
      await Promise.all((outfit.assets || []).map((asset) => api.deleteAsset(asset.id)));
      await api.deleteOutfit(outfit.id);
      setOutfits((current) => current.filter((item) => item.id !== outfit.id));
      setOutfitMessage('Đã xóa trang phục.');
    } catch (err) {
      setOutfitMessage('Lỗi: ' + err.message);
    }
  };

  const outfitPrompt = (outfit) => outfit.visual_prompt || [outfit.name, outfit.era, outfit.description].filter(Boolean).join(', ');

  const copyOutfitPrompt = async (outfit) => {
    await navigator.clipboard.writeText(outfitPrompt(outfit));
    setOutfitMessage('Đã copy prompt trang phục “' + outfit.name + '”.');
  };

  if (loading || !character) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">⏳</div>
        <div className="empty-state__title">Đang tải...</div>
      </div>
    );
  }

  const roleColors = {
    main: 'var(--role-main)',
    supporting: 'var(--role-supporting)',
    enemy: 'var(--role-enemy)',
    npc: 'var(--role-npc)',
  };

  const roleLabels = {
    main: 'Nhân vật chính',
    supporting: 'Nhân vật phụ',
    enemy: 'Phản diện',
    npc: 'Nhân vật quần chúng',
  };

  const statusLabels = {
    draft: 'Bản nháp',
    approved: 'Đã duyệt',
    locked: 'Đã khóa',
  };

  const genderLabels = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
  };

  const state = character.current_state;

  const addReferenceImage = async (event) => {
    event.preventDefault();
    if (referenceFiles.length === 0 && !referenceUrl.trim()) return;
    setReferenceSaving(true);
    setReferenceError('');
    try {
      const nextVersion = referenceAssets.reduce((max, asset) => Math.max(max, asset.version || 0), 0) + 1;
      let createdAssets = [];
      if (referenceFiles.length > 0) {
        for (let index = 0; index < referenceFiles.length; index += 1) {
          const file = referenceFiles[index];
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const created = await api.uploadAsset({
            project_id: character.project_id,
            asset_type: 'image',
            target_type: 'character',
            target_id: character.id,
            reference_kind: 'other',
            filename: file.name,
            mime_type: file.type,
            data,
            version: nextVersion + index,
            status: 'approved_reference',
          });
          createdAssets.push(created);
        }
      } else {
        const created = await api.createAsset({
          project_id: character.project_id,
          asset_type: 'image',
          target_type: 'character',
          target_id: character.id,
          reference_kind: 'other',
          file_path: referenceUrl.trim(),
          thumbnail: referenceUrl.trim(),
          version: nextVersion,
          status: 'approved_reference',
        });
        createdAssets = [created];
      }
      setReferenceAssets((prev) => [...createdAssets.reverse(), ...prev]);
      setReferenceUrl('');
      setReferenceFiles([]);
    } catch (err) {
      setReferenceError(err.message);
    } finally {
      setReferenceSaving(false);
    }
  };

  const removeReferenceImage = async (asset) => {
    if (!window.confirm('Xóa ảnh tham chiếu này?')) return;
    try {
      await api.deleteAsset(asset.id);
      setReferenceAssets((prev) => prev.filter((item) => item.id !== asset.id));
    } catch (err) {
      setReferenceError(err.message);
    }
  };

  const saveApparentAge = async () => {
    setApparentAgeSaving(true);
    setApparentAgeMessage('');
    try {
      const updated = await api.updateCharacter(character.id, { apparent_age: apparentAgeDraft.trim() });
      setCharacter((current) => ({ ...current, ...updated }));
      setApparentAgeMessage('Đã lưu độ tuổi ngoại hình. Các câu lệnh đã được cập nhật.');
    } catch (err) {
      setApparentAgeMessage('Lỗi: ' + err.message);
    } finally {
      setApparentAgeSaving(false);
    }
  };

  const profileFields = [
    { label: 'Mô tả', value: character.description },
    { label: 'Độ tuổi ngoại hình', value: character.apparent_age || character.age },
    { label: 'Ngoại hình', value: character.appearance },
    { label: 'Khuôn mặt', value: character.face },
    { label: 'Tóc', value: character.hair },
    { label: 'Mắt', value: character.eyes },
    { label: 'Thân hình', value: character.body },
    { label: 'Trang phục mặc định', value: character.default_outfit },
    { label: 'Tính cách', value: character.personality },
    { label: 'Phong cách nói', value: character.speaking_style },
    { label: 'Lý lịch', value: character.background },
    { label: 'Mục tiêu', value: character.goal },
    { label: 'Động lực', value: character.motivation },
    { label: 'Điểm mạnh', value: character.strength },
    { label: 'Điểm yếu', value: character.weakness },
    { label: 'Bí mật', value: character.secret, highlight: true },
  ];

  const stateFields = state ? [
    { label: 'Vị trí hiện tại', value: state.current_location, icon: '📍' },
    { label: 'Trang phục', value: state.current_outfit, icon: '👕' },
    { label: 'Sức khỏe', value: state.health, icon: '❤️' },
    { label: 'Chấn thương', value: state.injuries, icon: '🩹' },
    { label: 'Cảm xúc', value: state.emotion, icon: '😐' },
    { label: 'Sức mạnh', value: state.power_level, icon: '⚡' },
    { label: 'Còn sống', value: state.alive ? 'Có' : 'Đã chết', icon: state.alive ? '✅' : '💀' },
  ] : [];

  const relLabels = {
    friend: '🤝 Bạn bè',
    enemy: '⚔️ Kẻ thù',
    family: '👨‍👩‍👧 Gia đình',
    lover: '❤️ Người yêu',
    ally: '🤝 Đồng minh',
    rival: '🏆 Đối thủ',
    neutral: '➖ Trung lập',
  };

  const identityFacts = [
    `Character: ${character.name}`,
    character.alias && `Alias: ${character.alias}`,
    !character.apparent_age && character.age && `Age: ${character.age}`,
    character.apparent_age && `Chronological age: ${character.age || 'unknown'}`,
    character.apparent_age && `Apparent visual age: ${character.apparent_age}`,
    character.gender && `Gender: ${character.gender}`,
    character.height && `Height: ${character.height}`,
    character.face && `Face: ${character.face}`,
    character.hair && `Hair: ${character.hair}`,
    character.eyes && `Eyes: ${character.eyes}`,
    character.body && `Body: ${character.body}`,
    character.default_outfit && `Canonical outfit: ${character.default_outfit}`,
  ].filter(Boolean).join('; ');

  const identitySource = [character.appearance, character.face, character.description, character.body]
    .filter(Boolean)
    .join(' ');
  const hasApparentAgeOverride = Boolean(String(character.apparent_age || '').trim());
  const visualAgeValue = hasApparentAgeOverride ? character.apparent_age : character.age;
  const visualAgeLabel = String(visualAgeValue || '').trim();
  const ageMatch = visualAgeLabel.match(/\d+/);
  const numericAge = ageMatch ? Number.parseInt(ageMatch[0], 10) : null;
  const isNonHuman = /\b(cat|dog|wolf|fox|dragon|animal|creature|spirit beast)\b|mèo|chó|sói|cáo|rồng|linh thú/i.test(identitySource);
  const hasScar = /\bscar\b|sẹo/i.test(identitySource);
  const scarConsistencyInstruction = hasScar
    ? 'Preserve the exact scar described in the character profile, including its position, size, and shape. Do not add any other scars.'
    : 'Do not add scars or facial wounds. Preserve only facial marks explicitly described in the character profile.';

  let demographicLockInstruction;
  if (isNonHuman) {
    demographicLockInstruction = 'SPECIES PRIORITY LOCK: this is a non-human character. Preserve the exact species, life stage, scale, anatomy, fur/skin pattern, and creature proportions described in the written profile. Do not humanize the character. The written profile overrides conflicting visual cues in any attached reference image.';
  } else if (numericAge !== null && numericAge <= 12) {
    demographicLockInstruction = `AGE PRIORITY LOCK: depict a clearly prepubescent child with an apparent age of ${visualAgeLabel}, childlike facial proportions, a small jaw, rounder cheeks, narrow child shoulders, and age-appropriate anatomy. No teenage or adult appearance, no mature makeup, no adult feminine or masculine curves, and no sexualized pose or clothing. ${character.height ? `The stated height (${character.height}) is an unusual fantasy trait and must not be interpreted as physical maturity.` : ''} The written age and profile override any older-looking visual cues in an attached reference image.`;
  } else if (numericAge !== null && numericAge <= 17) {
    demographicLockInstruction = `AGE PRIORITY LOCK: depict a clearly adolescent character with an apparent age of ${visualAgeLabel} and age-appropriate teenage facial and body proportions. Do not age the character into a mature adult, exaggerate adult secondary sexual characteristics, or use sexualized styling. The written age and profile override conflicting visual cues in any attached reference image.`;
  } else if (numericAge !== null && numericAge >= 60) {
    demographicLockInstruction = `AGE PRIORITY LOCK: depict the character with an apparent age of ${visualAgeLabel} and believable senior facial structure, skin, posture, and body proportions. Do not make the character substantially younger. The written age and profile override conflicting visual cues in any attached reference image.`;
  } else if (numericAge !== null) {
    demographicLockInstruction = `AGE PRIORITY LOCK: depict the character as an adult with an apparent age of ${visualAgeLabel} and age-appropriate facial and body proportions. Do not make the character noticeably younger or older than this visible age. The written age and profile override conflicting visual cues in any attached reference image.`;
  } else {
    demographicLockInstruction = 'DEMOGRAPHIC LOCK: preserve the exact apparent age, gender presentation, species, scale, and body proportions stated in the written profile. The written profile overrides conflicting visual cues in any attached reference image.';
  }

  if (hasApparentAgeOverride) {
    demographicLockInstruction += ` CULTIVATION/IMMORTALITY AGE OVERRIDE: the chronological age is ${character.age || 'unknown'}, but the visible appearance is permanently locked to ${character.apparent_age}. Never add wrinkles, aging, or an older body based on chronological age. Visual age takes priority for image generation.`;
  }

  const subjectNoun = isNonHuman ? 'character' : 'person';
  const anatomyStandard = isNonHuman ? 'species-appropriate anatomy' : numericAge !== null && numericAge <= 12 ? 'age-appropriate child anatomy' : numericAge !== null && numericAge <= 17 ? 'age-appropriate adolescent anatomy' : 'realistic age-appropriate anatomy';
  const portraitFraming = isNonHuman ? 'close-up identity portrait showing the head and upper body' : 'head-and-shoulders portrait';
  const portraitIdentityFeatures = isNonHuman
    ? 'species, facial structure, eyes, ears, muzzle or beak, fur or skin pattern, scale, and signature accessories'
    : 'face, facial proportions, eyes, eyebrows, nose, lips, skin tone, hairstyle, hairline, age, and gender presentation';
  const appearanceGuardInstruction = isNonHuman
    ? 'Do not redesign or humanize the character, change its species, or alter its fur or skin pattern.'
    : 'Do not redesign the character or change the hairstyle.';
  const fullBodyPose = isNonHuman ? 'in a natural species-appropriate pose with the entire body, paws, and tail visible' : 'standing naturally from head to feet';
  const fullBodyFeatures = isNonHuman
    ? 'species, face, body proportions, scale, fur or skin pattern, paws, tail, signature accessories, and color palette'
    : 'face, hairstyle, age-appropriate body proportions, height impression, canonical outfit, belt, jewelry, footwear, and color palette';
  const backViewFeatures = isNonHuman
    ? 'species anatomy, head shape, ears, back, body proportions, fur or skin pattern, tail, signature accessories, and color palette'
    : 'hairstyle, hair length, tied hair shape, shoulder width, age-appropriate body proportions, canonical outfit, belt, fabric layers, accessories, and color palette';
  const masterDetailSubjects = hasScar
    ? `the explicitly described scar, ${isNonHuman ? 'eyes, fur or skin texture, paws, tail, and signature accessories' : 'hair, fabric, belt, jewelry, and footwear'}`
    : isNonHuman
      ? 'the eyes, fur or skin texture, species-specific features, paws, tail, and signature accessories'
      : 'the eyes, hair, fabric, belt, jewelry, and footwear';

  const referencePromptTemplates = [
    {
      key: 'master',
      label: '1. Bảng mẫu tổng',
      description: 'Tạo ảnh gốc nhiều góc để làm chuẩn nhận diện nhân vật.',
      prompt: `Create a professional character reference sheet for the following locked identity: ${identityFacts}. ${demographicLockInstruction} Show the exact same ${subjectNoun} in a large full-body front view, a clean ${portraitFraming}, left 3/4 view, right 3/4 view, side/back view, and small close-up detail insets for ${masterDetailSubjects}. Keep one consistent identity, facial structure, eye shape, body proportions, apparent age or life stage, and canonical appearance in every panel. ${scarConsistencyInstruction} Neutral warm-gray studio background, soft even lighting, clean cinematic concept art, ${anatomyStandard}, sharp identity details, consistent scale, no story scene. Minimal or no text, no watermark, no logo, no extra characters, no duplicate limbs, no distorted hands or paws, no identity drift.`,
    },
    {
      key: 'portrait',
      label: '2. Chân dung cận mặt',
      description: 'Dùng bảng mẫu tổng làm ảnh tham chiếu, chỉ tạo một chân dung sạch.',
      prompt: `Use the attached master character sheet as the primary identity reference. The written character profile has priority over any conflicting visual cue in the reference image. ${demographicLockInstruction} Create a clean single ${portraitFraming} of ${character.name}. Preserve the exact same ${portraitIdentityFeatures} from the valid identity details. ${scarConsistencyInstruction} Neutral expression, front-facing camera, soft neutral studio lighting, plain background, high-detail cinematic realism, ${anatomyStandard}. ${appearanceGuardInstruction} No extra accessories, no text, no watermark, no other characters. Identity, age, and species consistency are more important than artistic variation.`,
    },
    {
      key: 'three-quarter',
      label: '3. Góc 3/4 trái/phải',
      description: 'Tạo góc mới nhưng khóa nguyên khuôn mặt và kiểu tóc.',
      prompt: `Use the attached master character sheet as the identity reference, but let the written character profile override conflicting age, species, or body cues. ${demographicLockInstruction} Generate ${character.name} in a clean 3/4 view, first version facing slightly left; preserve the same ${portraitIdentityFeatures}, body proportions, scale, and canonical appearance. ${scarConsistencyInstruction} This is a controlled camera-angle variation, not a redesign. Neutral background, even cinematic lighting, head and upper body visible, ${anatomyStandard}, no text, no watermark, no extra characters, no identity drift or age drift.`,
    },
    {
      key: 'full-body',
      label: '4. Toàn thân chính diện',
      description: 'Làm ảnh tham chiếu cho dáng người, tỷ lệ cơ thể và trang phục.',
      prompt: `Use the attached master character sheet as the identity reference, but let the written character profile override conflicting age, species, or body cues. ${demographicLockInstruction} Create a clean full-body front view of ${character.name}, ${fullBodyPose}. Preserve the exact same ${fullBodyFeatures}. Show the entire silhouette clearly on a plain neutral background with soft studio lighting and ${anatomyStandard}. No dramatic action pose, no cropped feet, paws, or tail, no text, no watermark, no extra characters, no costume redesign, no anatomy errors, no age drift.`,
    },
    {
      key: 'back-side',
      label: '5. Góc nghiêng và phía sau',
      description: 'Giúp mô hình hiểu tóc, vai, lưng và cấu trúc trang phục.',
      prompt: `Use the attached master character sheet as the identity reference, but let the written character profile override conflicting age, species, or body cues. ${demographicLockInstruction} Create a clean rear 3/4 view of ${character.name}, with enough side profile to identify the same ${subjectNoun}. Preserve the exact same ${backViewFeatures}. Neutral background, soft even lighting, full upper body or full body visible, realistic cinematic concept art with ${anatomyStandard}. No new costume or accessories, no extra characters, no text, no watermark, no identity drift or age drift.`,
    },
    {
      key: 'expression',
      label: '6. Biểu cảm nhân vật',
      description: 'Tạo thêm ảnh biểu cảm nhưng vẫn giữ nguyên nhận diện.',
      prompt: `Use the attached master character sheet as the identity reference, but let the written character profile override conflicting age, species, or body cues. ${demographicLockInstruction} Create a clean portrait of ${character.name} with a subtle serious, emotionally restrained expression suitable for a cinematic drama. Preserve the exact same ${portraitIdentityFeatures}. ${scarConsistencyInstruction} Change expression only; do not change identity, species, canonical appearance, or apparent age. Soft cinematic key light, plain background, realistic detail with ${anatomyStandard}, no text, no watermark, no other characters, no exaggerated facial distortion, no age drift.`,
    },
  ];

  const copyReferencePrompt = async (template) => {
    try {
      await navigator.clipboard.writeText(template.prompt);
      setCopiedPromptKey(template.key);
      window.setTimeout(() => setCopiedPromptKey(''), 1800);
    } catch {
      setReferenceError('Không thể sao chép câu lệnh. Bạn có thể bôi đen và sao chép thủ công.');
    }
  };

  const referenceKindLabels = Object.fromEntries(
    referencePromptTemplates.map((template) => [template.key, template.label])
  );

  const uploadPromptImages = async (template) => {
    const files = promptFiles[template.key] || [];
    if (files.length === 0) {
      setReferenceError(`Hãy chọn ít nhất một ảnh cho mẫu “${template.label}”.`);
      return;
    }

    setUploadingPromptKey(template.key);
    setReferenceError('');
    try {
      const nextVersion = referenceAssets.reduce((max, asset) => Math.max(max, asset.version || 0), 0) + 1;
      const createdAssets = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const created = await api.uploadAsset({
          project_id: character.project_id,
          asset_type: 'image',
          target_type: 'character',
          target_id: character.id,
          reference_kind: template.key,
          filename: `${template.key}-${file.name}`,
          mime_type: file.type,
          data,
          version: nextVersion + index,
          status: 'approved_reference',
        });
        createdAssets.push(created);
      }

      setReferenceAssets((prev) => [...createdAssets.reverse(), ...prev]);
      setPromptFiles((prev) => ({ ...prev, [template.key]: [] }));
    } catch (err) {
      setReferenceError(err.message);
    } finally {
      setUploadingPromptKey('');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/characters')} style={{ marginBottom: 'var(--space-3)' }}>
          ← Quay lại
        </button>

        <div className="flex items-center gap-4">
          <div style={{
            width: 72, height: 72,
            borderRadius: 'var(--radius-xl)',
            background: `linear-gradient(135deg, ${roleColors[character.role]}22, ${roleColors[character.role]}44)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-2xl)', fontWeight: 700,
            color: roleColors[character.role],
          }}>
            {character.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="page-header__title">{character.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              {character.alias && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>"{character.alias}"</span>}
              <span style={{ color: roleColors[character.role], fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase' }}>{roleLabels[character.role] || character.role}</span>
              <span className={`canon-badge canon-badge--${character.status}`}>{statusLabels[character.status] || character.status}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Tuổi thật: {character.age}{character.apparent_age ? ` · Ngoại hình: ${character.apparent_age}` : ''} · {genderLabels[character.gender] || character.gender} · {character.height}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {[
          { key: 'profile', label: '📋 Hồ sơ' },
          { key: 'reference', label: '🖼️ Bộ ảnh tham chiếu' },
          { key: 'wardrobe', label: '👕 Kho trang phục' },
          { key: 'state', label: '🔄 Trạng thái hiện tại' },
          { key: 'relationships', label: '🤝 Quan hệ' },
        ].map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-3">
          {profileFields.filter(f => f.value).map((field) => (
            <div key={field.label} className="card" style={{
              padding: 'var(--space-3) var(--space-4)',
              borderColor: field.highlight ? 'rgba(239, 68, 68, 0.2)' : undefined,
              background: field.highlight ? 'rgba(239, 68, 68, 0.04)' : undefined,
            }}>
              <div className="label" style={{ marginBottom: 'var(--space-1)' }}>{field.label}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                {field.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Character Reference Pack */}
      {activeTab === 'reference' && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-5)', background: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(168,85,247,.06))' }}>
            <div className="flex items-center justify-between">
              <div><h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>🔒 Khóa nhận diện nhân vật</h2><p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>Các cảnh quay sẽ dùng gói này để giữ khuôn mặt, tóc, mắt, vóc dáng và trang phục ổn định.</p></div>
              <span className="badge badge--success">{referenceAssets.length} ảnh tham chiếu</span>
            </div>
            <div style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {character.name}: khuôn mặt={character.face || character.appearance || 'giữ khuôn mặt nhất quán'}, tóc={character.hair || 'giữ kiểu tóc nhất quán'}, mắt={character.eyes || 'giữ đôi mắt nhất quán'}, vóc dáng={character.body || 'giữ vóc dáng nhất quán'}, trang phục={character.default_outfit || 'trang phục đặc trưng'}
            </div>
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="label">Độ tuổi ngoại hình dùng để sinh ảnh</div>
              <div className="flex gap-2">
                <input
                  className="input"
                  value={apparentAgeDraft}
                  onChange={(event) => setApparentAgeDraft(event.target.value)}
                  placeholder={`Để trống sẽ dùng tuổi thật: ${character.age || 'chưa xác định'}`}
                />
                <button className="btn btn--primary btn--sm" type="button" disabled={apparentAgeSaving} onClick={saveApparentAge}>
                  {apparentAgeSaving ? 'Đang lưu...' : 'Lưu độ tuổi ngoại hình'}
                </button>
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>
                Ví dụ: tuổi thật 300 nhưng ngoại hình 22–25. Câu lệnh sẽ giữ diện mạo trẻ, không ép nhân vật thành người già.
              </div>
              {apparentAgeMessage && <div style={{ color: apparentAgeMessage.startsWith('Lỗi:') ? 'var(--color-error)' : 'var(--color-success)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>{apparentAgeMessage}</div>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Câu lệnh tạo bộ ảnh tham chiếu</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                  Sao chép câu lệnh số 1 để tạo bảng mẫu tổng. Sau đó đính kèm bảng mẫu tổng vào câu lệnh số 2–6 để tạo các góc bổ sung.
                </p>
              </div>
              <span className="badge badge--info">6 mẫu câu lệnh</span>
            </div>
            <div className="grid grid--2" style={{ marginTop: 'var(--space-4)' }}>
              {referencePromptTemplates.map((template) => (
                <div key={template.key} className="card" style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{template.label}</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', margin: 'var(--space-1) 0 var(--space-2)' }}>{template.description}</div>
                  <textarea className="input" rows={8} value={template.prompt} readOnly style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }} />
                  <div className="flex gap-2" style={{ marginTop: 'var(--space-2)' }}>
                    <button className="btn btn--secondary btn--sm" type="button" onClick={() => copyReferencePrompt(template)}>
                      {copiedPromptKey === template.key ? 'Đã sao chép' : 'Sao chép câu lệnh'}
                    </button>
                    <label className="btn btn--ghost btn--sm" style={{ cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                      Chọn ảnh
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={(event) => setPromptFiles((prev) => ({ ...prev, [template.key]: Array.from(event.target.files || []) }))}
                      />
                    </label>
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)', minHeight: 18 }}>
                    {(promptFiles[template.key] || []).length > 0
                      ? `Đã chọn ${(promptFiles[template.key] || []).length} ảnh`
                      : 'Chọn ảnh kết quả đúng với mẫu này'}
                  </div>
                  <button className="btn btn--primary btn--sm" type="button" disabled={uploadingPromptKey === template.key || !(promptFiles[template.key] || []).length} onClick={() => uploadPromptImages(template)} style={{ marginTop: 'var(--space-1)', width: '100%' }}>
                    {uploadingPromptKey === template.key ? 'Đang tải lên...' : `Tải ảnh vào “${template.label}”`}
                  </button>
                  {referenceAssets.some((asset) => asset.reference_kind === template.key) && (
                    <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                        Ảnh đã tải ({referenceAssets.filter((asset) => asset.reference_kind === template.key).length}) — nhấn để xem lớn
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {referenceAssets.filter((asset) => asset.reference_kind === template.key).map((asset) => (
                          <button
                            key={asset.id}
                            type="button"
                            title={`Xem lớn ${template.label}`}
                            onClick={() => setPreviewAsset(asset)}
                            style={{ width: 72, height: 72, padding: 0, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-tertiary)', cursor: 'zoom-in' }}
                          >
                            <img src={asset.thumbnail || asset.file_path} alt={`${template.label} - ${character.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form className="card" onSubmit={addReferenceImage} style={{ marginBottom: 'var(--space-5)' }}>
            <div className="label">Tải ảnh chưa phân loại (tùy chọn)</div>
            <div className="flex gap-2">
              <input className="input" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setReferenceFiles(Array.from(e.target.files || []))} />
              <button className="btn btn--primary" type="submit" disabled={referenceSaving}>{referenceSaving ? 'Đang tải lên...' : '⬆ Tải ảnh lên'}</button>
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>Dùng mục này cho ảnh bổ sung chưa thuộc mẫu nào. Ảnh theo từng mẫu nên được tải lên ngay trong thẻ câu lệnh tương ứng.</div>
            <input className="input" style={{ marginTop: 'var(--space-2)' }} value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} placeholder="Đường dẫn công khai (tùy chọn)" />
            {referenceError && <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>{referenceError}</div>}
          </form>

          {referenceAssets.length === 0 ? <div className="empty-state card"><div className="empty-state__icon">🖼️</div><div className="empty-state__title">Chưa có ảnh tham chiếu</div><div className="empty-state__desc">Thêm bảng mẫu tổng và các ảnh theo từng mẫu để cảnh quay giữ đúng nhận diện nhân vật.</div></div> : <div className="grid grid--3">{referenceAssets.map((asset) => <div key={asset.id} className="card" style={{ padding: 'var(--space-3)' }}><div style={{ height: 150, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{asset.thumbnail && /^https?:\/\//.test(asset.thumbnail) ? <img src={asset.thumbnail} alt={`Ảnh tham chiếu ${character.name}`} title="Nhấn để xem ảnh lớn" onClick={() => setPreviewAsset(asset)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} /> : <span style={{ fontSize: 36 }}>🖼️</span>}</div><div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-primary)' }}>{referenceKindLabels[asset.reference_kind] || 'Ảnh tham chiếu khác'}</div><div style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{asset.file_path}</div><div className="flex items-center justify-between" style={{ marginTop: 'var(--space-2)' }}><span className="badge badge--success">v{asset.version || 1}</span><button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => removeReferenceImage(asset)}>Xóa</button></div></div>)}</div>}
        </div>
      )}

      {/* Wardrobe Tab */}
      {activeTab === 'wardrobe' && (
        <div className="flex flex-col gap-4">
          <form className="card" onSubmit={saveOutfit} style={{ padding: 'var(--space-4)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add manually / exception</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 4 }}>Normally this library is created automatically from the AI outline. Use this form only for a one-off outfit or correction; Scenes will still select outfits by context.</p>
              </div>
              <span className="badge badge--primary">{outfits.length} bộ</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="label">Tên trang phục *</label>
                <input className="input" value={outfitForm.name} onChange={(event) => setOutfitForm({ ...outfitForm, name: event.target.value })} placeholder="Ví dụ: Đồ hiện đại trước xuyên không" />
              </div>
              <div className="form-group">
                <label className="label">Thời kỳ / hoàn cảnh</label>
                <input className="input" value={outfitForm.era} onChange={(event) => setOutfitForm({ ...outfitForm, era: event.target.value })} placeholder="Hiện đại, cổ trang, chiến đấu..." />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Mô tả đầy đủ</label>
              <textarea className="input textarea" rows={3} value={outfitForm.description} onChange={(event) => setOutfitForm({ ...outfitForm, description: event.target.value })} placeholder="Áo khoác tối màu, áo thun trơn, quần dài và giày hiện đại; bị ướt mưa..." />
            </div>
            <div className="form-group">
              <label className="label">Prompt trang phục</label>
              <textarea className="input textarea" rows={3} value={outfitForm.visual_prompt} onChange={(event) => setOutfitForm({ ...outfitForm, visual_prompt: event.target.value })} placeholder="Modern dark jacket, plain shirt, trousers, modern shoes, rain-soaked fabric..." />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="label">Từ khóa để Scene tự nhận diện</label>
                <input className="input" value={outfitForm.tags} onChange={(event) => setOutfitForm({ ...outfitForm, tags: event.target.value })} placeholder="hiện đại, thành phố, trước xuyên không" />
              </div>
              <div className="form-group">
                <label className="label">Ảnh của bộ trang phục</label>
                <input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={(event) => setOutfitFiles(Array.from(event.target.files || []))} />
              </div>
            </div>
            <label className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
              <input type="checkbox" checked={outfitForm.is_default} onChange={(event) => setOutfitForm({ ...outfitForm, is_default: event.target.checked })} />
              Dùng làm trang phục mặc định khi Scene không nói rõ
            </label>
            <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-3)' }}>
              <span style={{ color: outfitMessage.startsWith('Lỗi:') ? 'var(--color-error)' : 'var(--color-success)', fontSize: 'var(--text-xs)' }}>{outfitMessage}</span>
              <button className="btn btn--primary" type="submit" disabled={outfitSaving || !outfitForm.name.trim()}>{outfitSaving ? 'Đang lưu...' : '＋ Thêm vào kho trang phục'}</button>
            </div>
          </form>

          {outfits.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state__icon">👕</div>
              <div className="empty-state__title">Chưa có trang phục đặt tên</div>
              <div className="empty-state__desc">Tạo ít nhất một bộ để Scene không phải dùng default_outfit chung cho mọi thời kỳ.</div>
            </div>
          ) : (
            <div className="grid grid--2">
              {outfits.map((outfit) => (
                <div key={outfit.id} className="card" style={{ padding: 'var(--space-4)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{outfit.name}</h3>
                        {Boolean(outfit.is_default) && <span className="badge badge--success">Mặc định</span>}
                      </div>
                      <div style={{ color: 'var(--accent-primary)', fontSize: 'var(--text-xs)', marginTop: 4 }}>{outfit.era || 'Chưa đặt thời kỳ'}</div>
                    </div>
                    <button className="btn btn--ghost btn--sm" type="button" style={{ color: 'var(--color-error)' }} onClick={() => removeOutfit(outfit)}>Xóa</button>
                  </div>
                  {outfit.description && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)', lineHeight: 1.6 }}>{outfit.description}</p>}
                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap' }}>{outfitPrompt(outfit)}</div>
                  {(outfit.assets || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 'var(--space-3)' }}>
                      {outfit.assets.map((asset) => <img key={asset.id} src={asset.thumbnail || asset.file_path} alt={outfit.name} onClick={() => setPreviewAsset(asset)} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 'var(--radius-md)', cursor: 'zoom-in', border: '1px solid var(--border-subtle)' }} />)}
                    </div>
                  )}
                  <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-3)' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{(outfit.assets || []).length} ảnh · Tags: {outfit.tags || '—'}</span>
                    <button className="btn btn--secondary btn--sm" type="button" onClick={() => copyOutfitPrompt(outfit)}>📋 Copy prompt</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* State Tab */}
      {activeTab === 'state' && (
        <div>
          {state ? (
            <div className="grid grid--2">
              {stateFields.map((field) => (
                <div key={field.label} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div className="flex items-center gap-2">
                    <span>{field.icon}</span>
                    <span className="label" style={{ marginBottom: 0 }}>{field.label}</span>
                  </div>
                  <div style={{
                    fontSize: 'var(--text-md)', color: 'var(--text-primary)',
                    fontWeight: 500, marginTop: 'var(--space-2)',
                  }}>
                    {field.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🔄</div>
              <div className="empty-state__title">Chưa có trạng thái</div>
            </div>
          )}
        </div>
      )}

      {/* Relationships Tab */}
      {activeTab === 'relationships' && (
        <div className="flex flex-col gap-2">
          {character.relationships?.length > 0 ? character.relationships.map((rel) => (
            <div key={rel.id} className="card card--clickable" style={{ padding: 'var(--space-3) var(--space-4)' }}
              onClick={() => navigate(`/characters/${rel.target_character_id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 'var(--text-md)' }}>{relLabels[rel.relationship_type]?.split(' ')[0]}</span>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {rel.target_name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {rel.description}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: rel.relationship_value > 0 ? 'var(--color-success)' : rel.relationship_value < 0 ? 'var(--color-error)' : 'var(--text-muted)',
                }}>
                  {rel.relationship_value > 0 ? '+' : ''}{rel.relationship_value}
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-state">
              <div className="empty-state__icon">🤝</div>
              <div className="empty-state__title">Chưa có quan hệ</div>
            </div>
          )}
        </div>
      )}

      {previewAsset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh tham chiếu"
          onClick={() => setPreviewAsset(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(6px)', cursor: 'zoom-out' }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ position: 'relative', maxWidth: '94vw', maxHeight: '94vh', cursor: 'default' }}>
            <button
              type="button"
              className="btn btn--secondary"
              aria-label="Đóng ảnh"
              onClick={() => setPreviewAsset(null)}
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 38, height: 38, padding: 0, borderRadius: '50%', fontSize: 20 }}
            >
              ×
            </button>
            <img
              src={previewAsset.thumbnail || previewAsset.file_path}
              alt={`Ảnh lớn ${referenceKindLabels[previewAsset.reference_kind] || character.name}`}
              style={{ display: 'block', maxWidth: '94vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 80px rgba(0,0,0,.55)' }}
            />
            <div style={{ marginTop: 'var(--space-2)', color: '#fff', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              {referenceKindLabels[previewAsset.reference_kind] || 'Ảnh tham chiếu khác'} — nhấn bên ngoài hoặc phím Esc để đóng
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
