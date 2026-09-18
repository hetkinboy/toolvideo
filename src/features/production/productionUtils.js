export const SHOT_STATUSES = [
  'draft',
  'script_done',
  'image_prompt_done',
  'image_done',
  'video_prompt_done',
  'video_done',
  'approved',
];

export const ASSET_TYPES = ['image', 'video', 'voice', 'music', 'sfx'];

export function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]'); } catch { return []; }
}

export function buildShotPrompts(shot = {}, scene = {}, project = {}, characters = [], referenceAssets = []) {
  const style = project.visual_style || 'cinematic anime, highly detailed, dramatic lighting';
  const aspectRatio = project.aspect_ratio || '9:16';
  const selectedCharacterIds = parseJsonArray(shot.character_ids || scene.character_ids);
  const selectedCharacters = characters.filter((character) => selectedCharacterIds.includes(character.id));
  const identityLock = selectedCharacters.length ? [
    'CHARACTER IDENTITY LOCK — preserve the same face, hair, eye color, body proportions and signature outfit in every frame:',
    ...selectedCharacters.map((character) => {
      const refs = referenceAssets.filter((asset) => asset.target_type === 'character' && asset.target_id === character.id && asset.asset_type === 'image' && asset.status !== 'archived');
      const refText = refs.length ? `Reference image: ${refs.map((asset) => asset.file_path || asset.thumbnail || asset.id).join(' | ')}` : '';
      return [
        `${character.name}: face=${character.face || character.appearance || 'consistent face'}, hair=${character.hair || 'consistent hair'}, eyes=${character.eyes || 'consistent eyes'}, body=${character.body || 'consistent body'}, outfit=${character.default_outfit || 'signature outfit'}`,
        refText,
      ].filter(Boolean).join(', ');
    }),
    'Do not change character identity, hairstyle, eye color or outfit unless the shot explicitly says so.',
  ].join('\n') : '';
  const imagePrompt = [
    style,
    identityLock,
    shot.description ? `Shot: ${shot.description}` : '',
    shot.background ? `Background: ${shot.background}` : '',
    shot.character_action ? `Character action: ${shot.character_action}` : '',
    shot.facial_expression ? `Facial expression: ${shot.facial_expression}` : '',
    shot.lighting ? `Lighting: ${shot.lighting}` : '',
    shot.composition ? `Composition: ${shot.composition}` : '',
    shot.camera_shot ? `Camera: ${shot.camera_shot}` : '',
    scene.time_of_day ? `Time of day: ${scene.time_of_day}` : '',
    `--ar ${aspectRatio}`,
  ].filter(Boolean).join(', ');

  const videoPrompt = [
    'Cinematic video shot',
    shot.description || scene.action || scene.summary || scene.title || '',
    shot.camera_movement ? `Camera movement: ${shot.camera_movement}` : '',
    shot.camera_angle ? `Camera angle: ${shot.camera_angle}` : '',
    shot.character_action ? `Character action: ${shot.character_action}` : '',
    shot.facial_expression ? `Facial expression: ${shot.facial_expression}` : '',
    shot.dialogue ? `Dialogue: ${shot.dialogue}` : '',
    shot.sfx ? `SFX: ${shot.sfx}` : '',
    shot.music ? `Music: ${shot.music}` : '',
    'consistent identity, natural motion, cinematic pacing, no text artifacts',
  ].filter(Boolean).join(', ');

  return { image_prompt: imagePrompt, video_prompt: videoPrompt };
}

export function statusLabel(value = '') {
  return value.replaceAll('_', ' ');
}

export function statusClass(value = '') {
  if (value === 'approved' || value === 'video_done') return 'badge--success';
  if (value === 'image_done' || value === 'video_prompt_done') return 'badge--info';
  if (value === 'image_prompt_done' || value === 'script_done') return 'badge--warning';
  return 'badge--muted';
}
