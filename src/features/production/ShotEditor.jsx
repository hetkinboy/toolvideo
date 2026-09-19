import React, { useEffect, useState } from 'react';
import { api } from '../../core/api';
import { SHOT_STATUSES, buildShotPrompts, parseJsonArray, statusLabel } from './productionUtils';

const EMPTY_SHOT = {
  shot_number: 1,
  duration: 5,
  character_ids: '[]',
  reference_asset_ids: '[]',
  start_frame_asset_ids: '[]',
  end_frame_asset_ids: '[]',
  description: '',
  camera_shot: 'medium shot',
  camera_angle: 'eye level',
  camera_movement: 'static',
  lens: '35mm',
  composition: '',
  lighting: '',
  background: '',
  character_action: '',
  facial_expression: '',
  dialogue: '',
  sfx: '',
  music: '',
  image_prompt: '',
  video_prompt: '',
  start_frame_prompt: '',
  end_frame_prompt: '',
  flow_transition_prompt: '',
  status: 'draft',
};

function Field({ label, name, value, onChange, type = 'text', rows = 3 }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      {type === 'textarea' ? (
        <textarea className="input textarea" rows={rows} value={value || ''} onChange={(e) => onChange(name, e.target.value)} />
      ) : (
        <input className="input" type={type} value={value ?? ''} onChange={(e) => onChange(name, e.target.value)} />
      )}
    </div>
  );
}

export default function ShotEditor({ shot, scene, project, characters = [], referenceAssets = [], onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY_SHOT, ...(shot || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({ ...EMPTY_SHOT, ...(shot || {}) });
  }, [shot]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const generatePrompts = () => {
    setForm((prev) => ({
      ...prev,
      character_ids: prev.character_ids || scene.character_ids || '[]',
      reference_asset_ids: prev.reference_asset_ids || '[]',
      ...buildShotPrompts(prev, scene, project, characters, referenceAssets),
    }));
  };

  const selectedCharacterIds = parseJsonArray(form.character_ids || scene.character_ids);
  const selectedCharacters = characters.filter((character) => selectedCharacterIds.includes(character.id));
  const imageAssets = referenceAssets.filter((asset) => asset.asset_type === 'image' && asset.status !== 'archived');
  const startFrameId = parseJsonArray(form.start_frame_asset_ids)[0] || '';
  const endFrameId = parseJsonArray(form.end_frame_asset_ids)[0] || '';
  const assetLabel = (asset) => (asset.target_type || 'asset') + (asset.target_id ? ' · ' + asset.target_id : '') + ' · v' + (asset.version || 1);
  const selectFrame = (field, value) => update(field, value ? JSON.stringify([value]) : '[]');
  const copyFlowPromptPack = async () => {
    const pack = [form.start_frame_prompt, form.end_frame_prompt, form.flow_transition_prompt].filter(Boolean).join(NL + NL + '---' + NL + NL);
    if (pack) await navigator.clipboard.writeText(pack);
  };
  const toggleCharacter = (characterId) => {
    const next = selectedCharacterIds.includes(characterId)
      ? selectedCharacterIds.filter((id) => id !== characterId)
      : [...selectedCharacterIds, characterId];
    update('character_ids', JSON.stringify(next));
  };

  const handleSave = async () => {
    if (!form.description.trim() && !scene?.title) {
      setError('Hãy nhập mô tả cho shot.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        project_id: project.id,
        scene_id: scene.id,
        shot_number: Number(form.shot_number) || 1,
        duration: Number(form.duration) || 0,
        character_ids: form.character_ids || scene.character_ids || '[]',
        reference_asset_ids: form.reference_asset_ids || '[]',
      };
      const saved = form.id ? await api.updateShot(form.id, payload) : await api.createShot(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 980 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <h3 className="modal__title">🎬 {form.id ? 'Chỉnh sửa Shot' : 'Tạo Shot mới'}</h3>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
              {scene ? `SC${String(scene.scene_number).padStart(2, '0')} · ${scene.title}` : 'Scene'}
            </div>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          {error && <div className="alert alert--error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

          <div className="form-grid-3">
            <Field label="Shot number" name="shot_number" value={form.shot_number} onChange={update} type="number" />
            <Field label="Duration (seconds)" name="duration" value={form.duration} onChange={update} type="number" />
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => update('status', e.target.value)}>
                {SHOT_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </div>
          </div>

          <Field label="Description / diễn biến trong shot" name="description" value={form.description} onChange={update} type="textarea" rows={3} />

          <div className="card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-4)', background: 'rgba(99, 102, 241, 0.08)' }}>
            <div className="flex items-center justify-between"><strong style={{ fontSize: 'var(--text-sm)' }}>🔒 Character Identity Lock</strong><span className="badge badge--primary">{selectedCharacters.length} nhân vật</span></div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>Prompt sẽ giữ ổn định khuôn mặt, tóc, mắt, vóc dáng và trang phục. Ảnh tham chiếu được lấy từ Character Reference Pack.</div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>{characters.map((character) => <button type="button" key={character.id} className={`btn btn--sm ${selectedCharacterIds.includes(character.id) ? 'btn--primary' : 'btn--ghost'}`} onClick={() => toggleCharacter(character.id)}>{selectedCharacterIds.includes(character.id) ? '✓ ' : '+ '}{character.name}{referenceAssets.some((asset) => asset.target_type === 'character' && asset.target_id === character.id && asset.asset_type === 'image') ? ' · ref' : ''}</button>)}</div>
          </div>

          <div className="section__header" style={{ marginTop: 'var(--space-4)' }}>
            <h4 className="section__title">📷 Camera & Visual Direction</h4>
          </div>
          <div className="form-grid-3">
            <Field label="Camera shot" name="camera_shot" value={form.camera_shot} onChange={update} />
            <Field label="Camera angle" name="camera_angle" value={form.camera_angle} onChange={update} />
            <Field label="Camera movement" name="camera_movement" value={form.camera_movement} onChange={update} />
            <Field label="Lens" name="lens" value={form.lens} onChange={update} />
            <Field label="Composition" name="composition" value={form.composition} onChange={update} />
            <Field label="Lighting" name="lighting" value={form.lighting} onChange={update} />
          </div>
          <div className="form-grid-2">
            <Field label="Background" name="background" value={form.background} onChange={update} type="textarea" />
            <Field label="Character action" name="character_action" value={form.character_action} onChange={update} type="textarea" />
            <Field label="Facial expression" name="facial_expression" value={form.facial_expression} onChange={update} />
            <Field label="Dialogue" name="dialogue" value={form.dialogue} onChange={update} type="textarea" />
            <Field label="SFX" name="sfx" value={form.sfx} onChange={update} />
            <Field label="Music" name="music" value={form.music} onChange={update} />
          </div>

          <div className="section__header" style={{ marginTop: 'var(--space-4)' }}>
            <h4 className="section__title">✨ AI Prompts</h4>
            <button className="btn btn--secondary btn--sm" onClick={generatePrompts}>⚡ Tạo Prompt từ Shot</button>
          </div>
          <Field label="Image prompt" name="image_prompt" value={form.image_prompt} onChange={update} type="textarea" rows={4} />
          <Field label="Video prompt" name="video_prompt" value={form.video_prompt} onChange={update} type="textarea" rows={4} />

          <div className="card" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-2)', border: '1px solid rgba(99, 102, 241, 0.35)', background: 'rgba(99, 102, 241, 0.07)' }}>
            <div className="flex justify-between items-center" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>🎞️ Google Flow: Start Frame → End Frame</strong>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
                  Mỗi shot chỉ chọn 1 ảnh đầu và 1 ảnh cuối. Không dùng bảng collage/storyboard làm frame.
                </div>
              </div>
              <button type="button" className="btn btn--secondary btn--sm" onClick={copyFlowPromptPack} disabled={!form.flow_transition_prompt && !form.start_frame_prompt && !form.end_frame_prompt}>📋 Copy Flow Prompt Pack</button>
            </div>

            <div className="form-grid-2" style={{ marginTop: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="label">🟢 Start Frame — ảnh mở đầu</label>
                <select className="input" value={startFrameId} onChange={(event) => selectFrame('start_frame_asset_ids', event.target.value)}>
                  <option value="">-- Chưa chọn ảnh Start Frame --</option>
                  {imageAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.file_path || asset.thumbnail || assetLabel(asset)}</option>)}
                </select>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 4 }}>Một ảnh duy nhất thể hiện đúng khoảnh khắc tại giây 0.</div>
              </div>
              <div className="form-group">
                <label className="label">🔵 End Frame — ảnh kết thúc</label>
                <select className="input" value={endFrameId} onChange={(event) => selectFrame('end_frame_asset_ids', event.target.value)}>
                  <option value="">-- Chưa chọn ảnh End Frame --</option>
                  {imageAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.file_path || asset.thumbnail || assetLabel(asset)}</option>)}
                </select>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 4 }}>Một ảnh duy nhất thể hiện đúng tư thế/khoảnh khắc cuối.</div>
              </div>
            </div>

            <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
              <label className="label" style={{ margin: 0 }}>Prompt chuyển động giữa hai frame</label>
              <button type="button" className="btn btn--primary btn--sm" onClick={generatePrompts}>⚡ Tạo lại Flow Pack</button>
            </div>
            <Field label="Start Frame Prompt" name="start_frame_prompt" value={form.start_frame_prompt} onChange={update} type="textarea" rows={4} />
            <Field label="End Frame Prompt" name="end_frame_prompt" value={form.end_frame_prompt} onChange={update} type="textarea" rows={4} />
            <Field label="Flow Transition Prompt" name="flow_transition_prompt" value={form.flow_transition_prompt} onChange={update} type="textarea" rows={5} />
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu Shot'}</button>
        </div>
      </div>
    </div>
  );
}
