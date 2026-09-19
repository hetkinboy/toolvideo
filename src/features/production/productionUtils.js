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
    'CHARACTER IDENTITY LOCK — preserve face, hair, eye color, apparent age and body proportions. Clothing is controlled by the Scene:',
    ...selectedCharacters.map((character) => {
      const refs = referenceAssets.filter((asset) => asset.target_type === 'character' && asset.target_id === character.id && asset.asset_type === 'image' && asset.status !== 'archived');
      const refText = refs.length ? `Reference image: ${refs.map((asset) => asset.file_path || asset.thumbnail || asset.id).join(' | ')}` : '';
      const ageLock = character.apparent_age
        ? `chronological age=${character.age || 'unknown'}, apparent visual age=${character.apparent_age}; keep the apparent visual age even if the character is immortal or centuries old`
        : `visual age=${character.age || 'profile-defined age'}`;
      return [
        `${character.name}: ${ageLock}, face=${character.face || character.appearance || 'consistent face'}, hair=${character.hair || 'consistent hair'}, eyes=${character.eyes || 'consistent eyes'}, body=${character.body || 'consistent body'}`,
        refText,
      ].filter(Boolean).join(', ');
    }),
    'Use identity references for identity only. Preserve the named Scene Outfit inherited through scene.character_prompt and scene.image_prompt.',
  ].join('\n') : '';
  const imagePrompt = [
    scene.image_prompt || style,
    scene.image_prompt ? '' : identityLock,
    scene.character_prompt || '',
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
    scene.video_prompt || 'Cinematic video shot',
    scene.video_prompt ? '' : scene.character_prompt || identityLock,
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

    const startFramePrompt = [
    'GOOGLE FLOW START FRAME',
    'Use the uploaded Start Frame as the exact opening composition of this shot.',
    'Preserve the same character identity, wardrobe, screen direction, environment, lighting, lens and aspect ratio.',
    shot.description ? 'Opening visual: ' + shot.description : '',
    shot.camera_shot ? 'Framing: ' + shot.camera_shot : '',
    shot.camera_angle ? 'Angle: ' + shot.camera_angle : '',
    shot.composition ? 'Composition: ' + shot.composition : '',
    'This is one clean frame, not a storyboard, collage or contact sheet. No split screen, no extra panels, no text.',
  ].filter(Boolean).join('\n');

  const endFramePrompt = [
    'GOOGLE FLOW END FRAME',
    'Use the uploaded End Frame as the exact final composition of this shot.',
    'Preserve the same characters, wardrobe, environment, lighting, screen direction and visual style from the Start Frame.',
    shot.character_action ? 'Final pose/action: ' + shot.character_action : '',
    shot.facial_expression ? 'Final expression: ' + shot.facial_expression : '',
    'This is one clean frame, not a storyboard, collage or contact sheet. No split screen, no extra panels, no text.',
  ].filter(Boolean).join('\n');

  const flowTransitionPrompt = [
    'GOOGLE FLOW FRAME-TO-FRAME VIDEO PROMPT',
    'Create one continuous cinematic shot that transitions smoothly from the uploaded Start Frame to the uploaded End Frame.',
    shot.description || scene.action || scene.summary || scene.title || '',
    shot.camera_movement ? 'Camera movement: ' + shot.camera_movement : 'Subtle controlled camera movement',
    shot.character_action ? 'Character motion: ' + shot.character_action : '',
    shot.dialogue ? 'Dialogue: ' + shot.dialogue : '',
    shot.sfx ? 'Sound effects: ' + shot.sfx : '',
    'Keep the same identity, wardrobe, props, weather, lighting, composition logic and screen direction throughout.',
    'Do not invent extra characters, outfits, locations or camera cuts. Do not create a collage, storyboard, split screen or text.',
  ].filter(Boolean).join('\n');

  return {
    image_prompt: imagePrompt,
    video_prompt: videoPrompt,
    start_frame_prompt: startFramePrompt,
    end_frame_prompt: endFramePrompt,
    flow_transition_prompt: flowTransitionPrompt,
  };
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
