/**
 * AI Video Studio — Demo Data: Phế Vật Có Hệ Thống
 * Tạo sẵn Bible, Characters, Arc, Episodes, Scenes mẫu
 */

const { v4: uuidv4 } = require('uuid');

function seedDemoData(db) {
  const existing = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  if (existing.count > 0) {
    console.log('[SEED] Database đã có data, bỏ qua seed.');
    return;
  }

  console.log('[SEED] Tạo demo data: Phế Vật Có Hệ Thống...');

  // ============================================================
  // PROJECT
  // ============================================================
  const projectId = uuidv4();
  db.prepare(`
    INSERT INTO projects (id, name, slug, description, genre, language, target_platform, aspect_ratio,
      episode_min_duration, episode_max_duration, visual_style, story_tone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projectId,
    'Phế Vật Có Hệ Thống',
    'phe-vat-co-he-thong',
    'Lâm Hạo, thiếu gia bị coi là phế vật của gia tộc tu luyện, bất ngờ kích hoạt Hệ Thống Tu Luyện bí ẩn. Từ đây, hắn âm thầm mạnh lên, đối mặt với âm mưu gia tộc và thế lực hắc ám.',
    'Chinese Fantasy / Cultivation / System / Comedy',
    'vi',
    'TikTok',
    '9:16',
    120, 180,
    'Anime-style Chinese Fantasy, vibrant colors, dramatic lighting, cultivation aura effects',
    'Tense + Comedic + Underdog Rising',
    'preproduction'
  );

  // ============================================================
  // PROJECT BIBLE
  // ============================================================
  const bibleId = uuidv4();
  db.prepare(`
    INSERT INTO project_bibles (id, project_id, title, logline, main_story_summary, genre, story_tone,
      storytelling_style, world_description, world_rules, power_system, main_conflict,
      main_objective, ending_direction, forbidden_changes, canon_rules, section_locks, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    bibleId,
    projectId,
    'Phế Vật Có Hệ Thống — Story Bible',
    'Một thiếu gia bị coi là phế vật bất ngờ kích hoạt Hệ Thống Tu Luyện bí ẩn, âm thầm mạnh lên giữa âm mưu gia tộc.',
    'Lâm Hạo là con trai trưởng của Lâm Gia nhưng bị coi là phế vật vì không thể tu luyện. Sau khi suýt chết trong một vụ ám sát, hắn kích hoạt được Hệ Thống Tu Luyện cổ đại. Hệ thống giao nhiệm vụ, thưởng điểm kinh nghiệm và kỹ năng. Lâm Hạo phải giấu sức mạnh, vượt qua âm mưu trong gia tộc, đối đầu với các thế lực bên ngoài, và dần khám phá bí mật đằng sau Hệ Thống.',
    'Chinese Fantasy / Cultivation / System / Comedy',
    'Tense + Comedic + Underdog Rising',
    'Narrative voiceover + dramatic reveals + comedic inner monologue',
    'Thế giới tu tiên với 5 đại gia tộc cai quản Thanh Vân Thành. Tu luyện chia thành các cảnh giới. Linh khí tồn tại trong không khí, có thể hấp thu để tu luyện. Vật phẩm tu luyện quý hiếm.',
    '1. Không có công nghệ hiện đại (điện thoại, máy tính).\n2. Tu sĩ không thể bay dưới cảnh giới Nguyên Anh.\n3. Linh thú tồn tại nhưng hiếm gặp trong thành phố.\n4. Người thường có thể thấy tu sĩ.\n5. Hệ Thống chỉ có Lâm Hạo sở hữu, không ai khác biết.',
    'Cảnh giới tu luyện:\n1. Luyện Khí (9 tầng)\n2. Khai Mạch (3 tầng)\n3. Trúc Cơ\n4. Kim Đan\n5. Nguyên Anh\n6. Hóa Thần\n\nHệ Thống cung cấp:\n- Nhiệm vụ (Daily/Story/Hidden)\n- Điểm kinh nghiệm\n- Kỹ năng\n- Vật phẩm\n- Gacha (tỷ lệ SSR cực thấp)',
    'Lâm Hạo vs. Gia tộc (nội bộ) → Lâm Hạo vs. Thế lực hắc ám (bên ngoài) → Lâm Hạo vs. Bí mật của Hệ Thống',
    'Lâm Hạo chứng minh bản thân, bảo vệ gia tộc, và khám phá nguồn gốc Hệ Thống',
    'Lâm Hạo trở thành tu sĩ mạnh nhất thế hệ, nhưng phải đối mặt với cái giá của Hệ Thống.',
    '1. Không giết Lâm Hạo.\n2. Không cho nhân vật khác biết về Hệ Thống.\n3. Không thay đổi hệ thống cảnh giới.\n4. Không thêm công nghệ hiện đại.\n5. Tiểu Bạch (linh mèo) không được chết.',
    '1. Mọi nội dung phải qua DRAFT → APPROVED → LOCKED.\n2. AI không được tự sửa Canon.\n3. Thay đổi LOCKED content phải có cảnh báo.\n4. Scene sau phải tham khảo state của scene trước.',
    JSON.stringify({
      world_rules: 'locked',
      power_system: 'locked',
      forbidden_changes: 'locked',
      ending_direction: 'draft'
    }),
    1
  );

  // ============================================================
  // CHARACTERS
  // ============================================================
  const charLamHao = uuidv4();
  const charLamThanh = uuidv4();
  const charTieuBach = uuidv4();
  const charLamMiHan = uuidv4();
  const charVuongThienNhi = uuidv4();

  const characters = [
    {
      id: charLamHao, name: 'Lâm Hạo', alias: 'Phế Vật', role: 'main', age: '18', gender: 'Nam', height: '175cm',
      description: 'Con trai trưởng Lâm Gia, bị coi là phế vật vì không thể tu luyện. Sau khi kích hoạt Hệ Thống, bắt đầu con đường tu luyện bí mật.',
      appearance: 'Thanh niên gầy, dáng người yếu ớt ban đầu nhưng dần khỏe mạnh hơn theo tu luyện.',
      face: 'Khuôn mặt thanh tú nhưng luôn có vẻ mệt mỏi, mắt sáng ẩn chứa quyết tâm',
      hair: 'Tóc đen dài buộc đuôi ngựa', eyes: 'Đen, sáng, thỉnh thoảng lóe vàng khi dùng Hệ Thống',
      body: 'Gầy, dần rắn chắc theo thời gian', default_outfit: 'Bạch y đơn giản, đai lưng xám',
      personality: 'Thông minh, kiên nhẫn, giỏi giấu cảm xúc, bên trong hài hước và đôi khi tự mỉa mai',
      speaking_style: 'Lịch sự bề ngoài, nội tâm đầy tự trào và bình luận sarcastic về Hệ Thống',
      background: 'Từng là thiên tài nhưng mất khả năng tu luyện năm 12 tuổi. Bị cả gia tộc khinh thường.',
      goal: 'Chứng minh bản thân và tìm ra sự thật về Hệ Thống',
      motivation: 'Bảo vệ mẹ và em gái, không muốn bị ai coi thường nữa',
      strength: 'Hệ Thống + Trí thông minh + Kiên nhẫn',
      weakness: 'Sức mạnh ban đầu yếu, phải giấu Hệ Thống, có lúc quá tự tin vào Hệ Thống',
      secret: 'Sở hữu Hệ Thống Tu Luyện cổ đại duy nhất trên đời',
      status: 'approved'
    },
    {
      id: charLamThanh, name: 'Lâm Thanh', alias: 'Nhị đệ', role: 'enemy', age: '17', gender: 'Nam', height: '178cm',
      description: 'Con trai thứ hai Lâm Gia. Thiên tài tu luyện thật sự, luôn coi Lâm Hạo là rác rưởi. Tham vọng chiếm vị trí thừa kế.',
      appearance: 'Cao lớn, khỏe mạnh, luôn mặc đồ đẹp, vẻ ngoài hoàn hảo.',
      face: 'Khuôn mặt đẹp, luôn mang nụ cười khinh miệt', hair: 'Tóc đen ngắn, gọn gàng',
      eyes: 'Xám lạnh', body: 'Rắn chắc, dáng chiến binh', default_outfit: 'Thanh y thượng hạng, đai vàng',
      personality: 'Kiêu ngạo, tàn nhẫn nhưng thông minh. Biết cách che giấu bản chất trước trưởng bối.',
      speaking_style: 'Mỉa mai, lịch sự giả tạo trước mặt người lớn, trực tiếp coi thường khi riêng tư',
      background: 'Được gia tộc đầu tư toàn bộ tài nguyên tu luyện từ nhỏ',
      goal: 'Trở thành người thừa kế Lâm Gia', motivation: 'Quyền lực và chứng tỏ mình xứng đáng',
      strength: 'Thiên phú tu luyện cao, tài nguyên dồi dào, quan hệ rộng',
      weakness: 'Kiêu ngạo, đánh giá thấp Lâm Hạo, không biết về Hệ Thống',
      secret: 'Đang bí mật liên lạc với thế lực bên ngoài để hạ Lâm Hạo',
      status: 'approved'
    },
    {
      id: charTieuBach, name: 'Tiểu Bạch', alias: '', role: 'supporting', age: '???', gender: 'Không rõ', height: '20cm',
      description: 'Linh mèo bí ẩn xuất hiện cùng lúc Hệ Thống kích hoạt. Có vẻ biết nhiều hơn nó thể hiện.',
      appearance: 'Mèo trắng nhỏ, lông trắng muốt, mắt xanh biếc phát sáng nhẹ',
      face: 'Mặt mèo dễ thương, biểu cảm phong phú bất thường', hair: 'Lông trắng mượt mà',
      eyes: 'Xanh biếc, phát sáng trong bóng tối', body: 'Nhỏ gọn, mèo con', default_outfit: 'Vòng cổ bạc có rune cổ đại',
      personality: 'Lười biếng, thích ăn, nhưng thỉnh thoảng tỏ ra cực kỳ nghiêm túc',
      speaking_style: 'Không nói tiếng người, giao tiếp bằng cử chỉ và biểu cảm. Lâm Hạo "đoán" được ý.',
      background: 'Xuất hiện từ hư không khi Hệ Thống kích hoạt',
      goal: '???', motivation: 'Ăn ngon, ngủ nhiều, bảo vệ Lâm Hạo',
      strength: 'Sức mạnh ẩn giấu, cảm nhận nguy hiểm',
      weakness: 'Thích ăn, có thể bị dụ bằng đồ ăn ngon',
      secret: 'Có thể là hiện thân của AI Hệ Thống hoặc thần thú cổ đại',
      status: 'approved'
    },
    {
      id: charLamMiHan, name: 'Lâm Mị Hàn', alias: 'Muội muội', role: 'supporting', age: '15', gender: 'Nữ', height: '160cm',
      description: 'Em gái Lâm Hạo. Người duy nhất trong gia tộc thật sự quan tâm Lâm Hạo.',
      appearance: 'Thiếu nữ xinh đẹp, dịu dàng, luôn đeo vòng tay mà Lâm Hạo tặng',
      face: 'Khuôn mặt trong sáng, hiền lành', hair: 'Tóc đen dài, thẳng', eyes: 'Nâu ấm áp',
      body: 'Nhỏ nhắn, thanh mảnh', default_outfit: 'Hồng y giản dị, vòng tay ngọc xanh',
      personality: 'Dịu dàng, kiên cường bên trong, sẵn sàng bảo vệ anh trai',
      speaking_style: 'Nhẹ nhàng, ấm áp, thỉnh thoảng cứng rắn khi ai đó xúc phạm Lâm Hạo',
      background: 'Tu luyện ở mức trung bình, không được gia tộc chú ý vì giới tính',
      goal: 'Bảo vệ anh trai và trở nên mạnh hơn',
      motivation: 'Tình cảm gia đình', strength: 'Kiên cường, trung thành',
      weakness: 'Sức mạnh tu luyện trung bình', secret: 'Đang bí mật tu luyện kỹ năng cấm để bảo vệ Lâm Hạo',
      status: 'approved'
    },
    {
      id: charVuongThienNhi, name: 'Vương Thiên Nhi', alias: 'Nữ ma đầu', role: 'supporting', age: '18', gender: 'Nữ', height: '168cm',
      description: 'Tiểu thư Vương Gia, đối thủ/đồng minh tiềm năng của Lâm Hạo. Mạnh mẽ và bất cần.',
      appearance: 'Cao, khỏe khoắn, vẻ đẹp sắc sảo, luôn mang theo kiếm',
      face: 'Sắc sảo, lạnh lùng, đẹp nguy hiểm', hair: 'Tóc đỏ đậm, buộc cao',
      eyes: 'Đỏ hổ phách', body: 'Khỏe khoắn, dáng chiến binh', default_outfit: 'Hắc y chiến đấu, kiếm đeo hông',
      personality: 'Kiêu ngạo nhưng trọng người mạnh, ghét kẻ yếu nhưng tò mò về Lâm Hạo',
      speaking_style: 'Trực tiếp, thẳng thắn, không vòng vo',
      background: 'Thiên tài kiếm thuật Vương Gia, từng đánh bại Lâm Thanh',
      goal: 'Trở thành kiếm khách mạnh nhất',
      motivation: 'Đam mê kiếm đạo, muốn tìm đối thủ xứng tầm',
      strength: 'Kiếm thuật thiên phú, tốc độ, bản năng chiến đấu',
      weakness: 'Quá tự tin, dễ bị kích động', secret: 'Biết Lâm Hạo đang giấu sức mạnh',
      status: 'approved'
    }
  ];

  const insertChar = db.prepare(`
    INSERT INTO characters (id, project_id, name, alias, role, age, gender, height,
      description, appearance, face, hair, eyes, body, default_outfit,
      personality, speaking_style, background, goal, motivation, strength, weakness, secret, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  characters.forEach((c, i) => {
    insertChar.run(
      c.id, projectId, c.name, c.alias, c.role, c.age, c.gender, c.height,
      c.description, c.appearance, c.face, c.hair, c.eyes, c.body, c.default_outfit,
      c.personality, c.speaking_style, c.background, c.goal, c.motivation,
      c.strength, c.weakness, c.secret, c.status, i
    );
  });

  // ============================================================
  // CHARACTER STATES (initial)
  // ============================================================
  const insertState = db.prepare(`
    INSERT INTO character_states (id, character_id, project_id, current_location, current_outfit,
      health, injuries, emotion, power_level, inventory, alive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertState.run(uuidv4(), charLamHao, projectId, 'Lâm Gia Đại Viện — Phòng riêng', 'Bạch y đơn giản',
    'normal', '', 'determined', 'Luyện Khí tầng 0 (vừa kích hoạt Hệ Thống)', '["Hệ Thống Tu Luyện"]', 1);
  insertState.run(uuidv4(), charLamThanh, projectId, 'Lâm Gia Đại Viện — Tu Luyện Các', 'Thanh y thượng hạng',
    'normal', '', 'confident', 'Khai Mạch tầng 1', '["Lôi Hỏa Kiếm"]', 1);
  insertState.run(uuidv4(), charTieuBach, projectId, 'Lâm Gia Đại Viện — Phòng Lâm Hạo', 'Vòng cổ bạc rune',
    'normal', '', 'sleepy', '???', '[]', 1);
  insertState.run(uuidv4(), charLamMiHan, projectId, 'Lâm Gia Đại Viện — Khuê phòng', 'Hồng y giản dị',
    'normal', '', 'worried', 'Luyện Khí tầng 5', '["Vòng tay ngọc xanh"]', 1);
  insertState.run(uuidv4(), charVuongThienNhi, projectId, 'Vương Gia Phủ', 'Hắc y chiến đấu',
    'normal', '', 'bored', 'Khai Mạch tầng 2', '["Huyết Phong Kiếm"]', 1);

  // ============================================================
  // CHARACTER RELATIONSHIPS
  // ============================================================
  const insertRel = db.prepare(`
    INSERT INTO character_relationships (id, project_id, character_id, target_character_id,
      relationship_type, relationship_value, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertRel.run(uuidv4(), projectId, charLamHao, charLamThanh, 'rival', -50, 'Em trai, luôn khinh thường và muốn hạ Lâm Hạo');
  insertRel.run(uuidv4(), projectId, charLamHao, charTieuBach, 'ally', 80, 'Linh mèo đồng hành, đối tác bí ẩn');
  insertRel.run(uuidv4(), projectId, charLamHao, charLamMiHan, 'family', 90, 'Em gái, người duy nhất tin tưởng');
  insertRel.run(uuidv4(), projectId, charLamHao, charVuongThienNhi, 'rival', 10, 'Đối thủ tiềm năng, chưa hiểu nhau');
  insertRel.run(uuidv4(), projectId, charLamThanh, charLamHao, 'enemy', -70, 'Coi là phế vật, muốn loại bỏ');

  // ============================================================
  // LOCATIONS
  // ============================================================
  const insertLoc = db.prepare(`
    INSERT INTO locations (id, project_id, name, type, description, architecture, environment,
      colors, lighting, default_weather, important_objects, visual_prompt, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const locLamGia = uuidv4();
  const locTrainingGround = uuidv4();
  const locUnderground = uuidv4();

  insertLoc.run(locLamGia, projectId, 'Lâm Gia Đại Viện', 'estate',
    'Đại viện của gia tộc Lâm, một trong 5 đại gia tộc Thanh Vân Thành.',
    'Kiến trúc cổ Trung Hoa, mái ngói đỏ, cột gỗ chạm rồng, sân trước rộng lớn',
    'Vườn hoa, hồ cá koi, hành lang dài, cây cổ thụ', 'Đỏ, vàng, nâu gỗ',
    'Ánh nắng ấm ban ngày, đèn lồng vàng ban đêm', 'Nắng đẹp',
    'Cổng chính với biển hiệu "Lâm Gia", đại sảnh họp gia tộc, tháp tu luyện',
    'Ancient Chinese grand estate, red tiled roofs, dragon carved pillars, koi pond, lanterns, warm lighting, cultivation family manor',
    'approved');

  insertLoc.run(locTrainingGround, projectId, 'Luyện Võ Trường', 'training_ground',
    'Bãi luyện tập của gia tộc Lâm, nơi các đệ tử thi đấu và tu luyện.',
    'Sân đất rộng, vòng đấu bằng đá, khán đài gỗ xung quanh',
    'Bụi đất, ánh nắng gay gắt, linh khí loãng', 'Nâu đất, xám đá',
    'Ánh nắng mạnh, bóng cây thưa', 'Nắng',
    'Vòng đấu trung tâm, giá vũ khí, dummy tập luyện',
    'Open training ground in Chinese cultivation sect, stone arena, wooden spectator stands, dust floating in sunlight',
    'approved');

  insertLoc.run(locUnderground, projectId, 'Mật Thất Dưới Lòng Đất', 'secret_room',
    'Phòng bí mật dưới phòng Lâm Hạo, nơi hắn bí mật tu luyện.',
    'Hang đá nhỏ, tường có rune cổ phát sáng, trận pháp trên sàn',
    'Tối, ẩm, linh khí đặc hơn bình thường', 'Xanh tối, tím rune',
    'Rune phát sáng xanh nhạt, tối mờ', 'N/A - underground',
    'Trận pháp tu luyện, thạch trụ linh khí, bàn thờ cổ',
    'Secret underground cultivation chamber, glowing blue runes on stone walls, magic circle on floor, dim mysterious atmosphere',
    'approved');

  // ============================================================
  // ITEMS
  // ============================================================
  const insertItem = db.prepare(`
    INSERT INTO items (id, project_id, name, type, description, appearance, abilities,
      history, owner, current_location, condition, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertItem.run(uuidv4(), projectId, 'Hệ Thống Tu Luyện', 'system',
    'Hệ thống bí ẩn chỉ Lâm Hạo sở hữu. Giao nhiệm vụ, thưởng EXP và kỹ năng.',
    'Giao diện hologram xanh chỉ Lâm Hạo thấy', 'Giao nhiệm vụ, thưởng EXP, Gacha, Kỹ năng, Cửa hàng',
    'Kích hoạt khi Lâm Hạo suýt chết', charLamHao, 'Bound to Lâm Hạo', 'normal', 'locked');

  insertItem.run(uuidv4(), projectId, 'Huyết Phong Kiếm', 'weapon',
    'Kiếm của Vương Thiên Nhi, lưỡi đỏ như máu.',
    'Kiếm dài, lưỡi đỏ thẫm, chuôi đen, rune phong ẩn hiện',
    'Phong hệ kiếm kỹ, tốc độ chém cực nhanh, tạo lưỡi gió',
    'Gia bảo Vương Gia', charVuongThienNhi, 'Vương Gia Phủ', 'normal', 'approved');

  insertItem.run(uuidv4(), projectId, 'Lôi Hỏa Kiếm', 'weapon',
    'Kiếm của Lâm Thanh, sức mạnh sấm + lửa.',
    'Kiếm trung, lưỡi cam đỏ, điện chạy trên thân kiếm',
    'Lôi hỏa kết hợp, sát thương kép',
    'Lâm Gia ban thưởng cho thiên tài', charLamThanh, 'Lâm Gia — Tu Luyện Các', 'normal', 'approved');

  // ============================================================
  // FACTIONS
  // ============================================================
  const insertFaction = db.prepare(`
    INSERT INTO factions (id, project_id, name, type, description, leader, alignment, headquarters, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFaction.run(uuidv4(), projectId, 'Lâm Gia', 'family',
    'Một trong 5 đại gia tộc Thanh Vân Thành. Chuyên tu luyện kiếm thuật.',
    'Lâm Đức Chính (Gia Chủ)', 'neutral', 'Lâm Gia Đại Viện', 'approved');

  insertFaction.run(uuidv4(), projectId, 'Vương Gia', 'family',
    'Đại gia tộc mạnh nhất Thanh Vân Thành. Đối thủ truyền kiếp của Lâm Gia.',
    'Vương Bá Thiên', 'rival', 'Vương Gia Phủ', 'approved');

  // ============================================================
  // STORY ARC
  // ============================================================
  const arcId = uuidv4();
  db.prepare(`
    INSERT INTO story_arcs (id, project_id, name, summary, goal, start_episode, end_episode, status, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(arcId, projectId, 'PHẾ VẬT THỨC TỈNH',
    'Lâm Hạo kích hoạt Hệ Thống, bắt đầu tu luyện bí mật, và đối mặt thử thách đầu tiên trong gia tộc.',
    'Lâm Hạo vượt qua Gia Tộc Đại Hội và chứng tỏ mình không còn là phế vật.',
    1, 10, 'draft', 0);

  // ============================================================
  // EPISODES
  // ============================================================
  const ep1Id = uuidv4();
  const ep2Id = uuidv4();
  const ep3Id = uuidv4();

  const insertEp = db.prepare(`
    INSERT INTO episodes (id, project_id, arc_id, episode_number, title, summary, goal,
      opening_hook, main_conflict, climax, ending, cliffhanger, duration_target,
      status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEp.run(ep1Id, projectId, arcId, 1, 'Phế Vật',
    'Lâm Hạo bị coi là phế vật, bị Lâm Thanh sỉ nhục trước mặt gia tộc. Tối hôm đó, hắn suýt bị ám sát và kích hoạt Hệ Thống.',
    'Giới thiệu Lâm Hạo, hoàn cảnh bi đát, và sự kiện kích hoạt Hệ Thống.',
    'Lâm Hạo đang quỳ trước đại sảnh, xung quanh là tiếng cười nhạo.',
    'Lâm Hạo bị sỉ nhục → bị ám sát → kích hoạt Hệ Thống',
    'Khoảnh khắc Hệ Thống kích hoạt, giao diện hologram xuất hiện',
    'Lâm Hạo nhìn giao diện Hệ Thống lần đầu tiên',
    '"Chào mừng Tú Chủ. Nhiệm vụ đầu tiên đã được kích hoạt."',
    150, 'approved');

  insertEp.run(ep2Id, projectId, arcId, 2, 'Hệ Thống Kích Hoạt',
    'Lâm Hạo khám phá Hệ Thống, nhận nhiệm vụ đầu tiên, tìm được mật thất tu luyện dưới phòng mình.',
    'Lâm Hạo hiểu cách Hệ Thống hoạt động và bắt đầu nhiệm vụ đầu tiên.',
    'Lâm Hạo tỉnh dậy, tưởng đêm qua là mơ, rồi thấy giao diện Hệ Thống vẫn lơ lửng.',
    'Nhiệm vụ yêu cầu tìm "Mật Thất Cổ Đại" nhưng Lâm Hạo không biết ở đâu',
    'Tiểu Bạch dẫn Lâm Hạo xuống mật thất, trận pháp cổ sáng lên',
    'Lâm Hạo bắt đầu tu luyện trong mật thất',
    'Hệ Thống thông báo: "Phát hiện linh khí cổ đại. Tu luyện tốc độ x5."',
    120, 'draft');

  insertEp.run(ep3Id, projectId, arcId, 3, 'Ánh Sáng Đầu Tiên',
    'Lâm Hạo đột phá Luyện Khí tầng 1, lần đầu cảm nhận linh khí. Nhưng Lâm Thanh bắt đầu nghi ngờ.',
    'Lâm Hạo đạt thành quả đầu tiên, đồng thời phải đối mặt nguy hiểm từ Lâm Thanh.',
    'Lâm Hạo đang tu luyện trong mật thất, đột nhiên linh khí xoáy vào cơ thể.',
    'Giấu sức mạnh vs. Lâm Thanh bắt đầu theo dõi',
    'Lâm Thanh phái người theo dõi Lâm Hạo ban đêm',
    'Lâm Hạo dùng kỹ năng "Giấu Tức" vừa học được để qua mặt người theo dõi',
    'Người theo dõi báo cáo: "Không có gì bất thường." Lâm Thanh nhíu mày: "Không thể nào..."',
    150, 'draft');

  // Update episode links after all episodes exist
  const updateEpLinks = db.prepare('UPDATE episodes SET previous_episode_id = ?, next_episode_id = ? WHERE id = ?');
  updateEpLinks.run(null, ep2Id, ep1Id);
  updateEpLinks.run(ep1Id, ep3Id, ep2Id);
  updateEpLinks.run(ep2Id, null, ep3Id);

  // ============================================================
  // SCENES (Episode 1)
  // ============================================================
  const insertScene = db.prepare(`
    INSERT INTO scenes (id, project_id, episode_id, scene_number, title, purpose, summary,
      location_id, time_of_day, weather, duration,
      starting_state, action, dialogue, emotion_change, ending_state, transition,
      character_ids, item_ids, story_thread_ids, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const scene1Id = uuidv4();
  const scene2Id = uuidv4();
  const scene3Id = uuidv4();

  insertScene.run(scene1Id, projectId, ep1Id, 1, 'Quỳ Trước Đại Sảnh',
    'Giới thiệu Lâm Hạo, hoàn cảnh phế vật, và sự khinh miệt của gia tộc',
    'Lâm Hạo bị bắt quỳ trước đại sảnh vì "không xứng đáng" tham dự buổi họp gia tộc. Lâm Thanh sỉ nhục trước mặt mọi người.',
    locLamGia, 'Sáng sớm', 'Nắng', 40,
    JSON.stringify({ lam_hao: { location: 'Đại Sảnh Lâm Gia', emotion: 'humiliated', health: 'weak' } }),
    'Lâm Hạo quỳ → Lâm Thanh bước ra sỉ nhục → Gia tộc cười nhạo → Lâm Mị Hàn muốn can thiệp bị ngăn',
    'Lâm Thanh: "Một phế vật cũng dám xuất hiện ở đây? Anh không thấy xấu hổ sao?"\nLâm Hạo (nội tâm): "Nhẫn nhịn. Chỉ cần nhẫn nhịn thêm một chút..."',
    'Lâm Hạo: humiliated → cold determination',
    JSON.stringify({ lam_hao: { location: 'Đại Sảnh Lâm Gia', emotion: 'cold_determination', health: 'weak' } }),
    'Lâm Hạo đứng dậy, lặng lẽ rời đi. Camera theo chân hắn đi vào bóng tối hành lang.',
    JSON.stringify([charLamHao, charLamThanh, charLamMiHan]),
    '[]', '[]', 'approved');

  insertScene.run(scene2Id, projectId, ep1Id, 2, 'Đêm Tối — Vụ Ám Sát',
    'Tạo sự kiện kích hoạt Hệ Thống, tăng kịch tính',
    'Đêm khuya, Lâm Hạo bị tấn công bởi sát thủ bí ẩn trong phòng riêng. Hắn bị đâm trọng thương, suýt chết.',
    locLamGia, 'Nửa đêm', 'Trăng che mây', 50,
    JSON.stringify({ lam_hao: { location: 'Phòng riêng Lâm Hạo', emotion: 'cold_determination', health: 'weak' } }),
    'Lâm Hạo nằm trên giường → Sát thủ xâm nhập → Đâm một nhát → Lâm Hạo đổ máu → Sát thủ rời đi → Lâm Hạo nằm hấp hối',
    'Sát thủ (thì thầm): "Phế vật thì nên chết sớm cho rồi."',
    'Lâm Hạo: cold_determination → fear → acceptance → ???',
    JSON.stringify({ lam_hao: { location: 'Phòng riêng Lâm Hạo', emotion: 'near_death', health: 'critical', injuries: 'Vết đâm ngực' } }),
    'Máu chảy trên sàn. Ánh trăng rọi vào. Đột nhiên — ánh sáng xanh bùng lên.',
    JSON.stringify([charLamHao]),
    '[]', '[]', 'approved');

  insertScene.run(scene3Id, projectId, ep1Id, 3, 'Hệ Thống Kích Hoạt',
    'Climax của Episode 1 — Hệ Thống xuất hiện',
    'Trong khoảnh khắc cận kề cái chết, ánh sáng xanh bùng lên, Hệ Thống Tu Luyện kích hoạt. Tiểu Bạch xuất hiện từ hư không.',
    locLamGia, 'Nửa đêm', 'Trăng sáng', 60,
    JSON.stringify({ lam_hao: { location: 'Phòng riêng Lâm Hạo', emotion: 'near_death', health: 'critical', injuries: 'Vết đâm ngực' } }),
    'Ánh sáng xanh bùng → Giao diện Hệ Thống xuất hiện → Tiểu Bạch hiện ra → Vết thương tự lành → Lâm Hạo choáng váng',
    'Hệ Thống: "Đã phát hiện Tú Chủ trong nguy hiểm. Kích hoạt khẩn cấp."\nHệ Thống: "Chữa thương khẩn cấp... Hoàn tất."\nHệ Thống: "Chào mừng Tú Chủ. Nhiệm vụ đầu tiên đã được kích hoạt."\nLâm Hạo: "Cái... cái gì đây?"',
    'Lâm Hạo: near_death → shock → wonder → hope',
    JSON.stringify({ lam_hao: { location: 'Phòng riêng Lâm Hạo', emotion: 'wonder', health: 'healed', injuries: '', power_level: 'Đã kích hoạt Hệ Thống' } }),
    'Lâm Hạo nhìn giao diện lơ lửng, Tiểu Bạch ngáp dài trên giường. Fade to black.',
    JSON.stringify([charLamHao, charTieuBach]),
    '[]', '[]', 'approved');

  // ============================================================
  // STORY THREADS
  // ============================================================
  const insertThread = db.prepare(`
    INSERT INTO story_threads (id, project_id, title, description, introduced_episode, introduced_scene, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertThread.run(uuidv4(), projectId, 'Ai đã phái sát thủ?',
    'Sát thủ tấn công Lâm Hạo đêm EP1. Ai đứng đằng sau?', 'EP01', 'SC02', 'high', 'open');
  insertThread.run(uuidv4(), projectId, 'Nguồn gốc Hệ Thống',
    'Hệ Thống từ đâu đến? Vì sao chọn Lâm Hạo?', 'EP01', 'SC03', 'high', 'open');
  insertThread.run(uuidv4(), projectId, 'Tiểu Bạch là gì?',
    'Linh mèo xuất hiện cùng Hệ Thống. Thật ra là gì?', 'EP01', 'SC03', 'normal', 'open');
  insertThread.run(uuidv4(), projectId, 'Gia Tộc Đại Hội',
    'Cuộc thi đấu giữa các đệ tử Lâm Gia sắp diễn ra.', 'EP03', '', 'high', 'developing');

  // ============================================================
  // FORESHADOWS (Manh mối / Tiên báo)
  // ============================================================
  const insertForeshadow = db.prepare(`
    INSERT INTO foreshadows (id, project_id, setup, setup_episode, setup_scene, planned_reveal, planned_reveal_episode, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertForeshadow.run(uuidv4(), projectId,
    'Ám khí khắc ấn gia huy Vương Gia rơi tại hiện trường vụ ám sát Lâm Hạo đêm EP1',
    'EP01', 'SC02', 'Lâm Thanh cấu kết với chi nhánh ngầm của Vương Gia để ám hại anh trai', 'EP06', 'setup_done');

  insertForeshadow.run(uuidv4(), projectId,
    'Vết bớt hình Chân Long trên vai Lâm Hạo phát sáng xanh lơ khi tiếp xúc linh khí cổ',
    'EP02', 'SC01', 'Lâm Hạo là hậu duệ của Chân Long Thần Tộc bị lưu lạc 18 năm trước', 'EP10', 'planned');

  insertForeshadow.run(uuidv4(), projectId,
    'Tiểu Bạch nhìn tháp Cấm Địa Lâm Gia với ánh mắt thù hận và phát ra tiếng gầm trầm như rồng',
    'EP03', 'SC02', 'Cấm Địa giam giữ mẫu thân của Tiểu Bạch và linh mạch cổ của Thanh Vân Thành', 'EP08', 'planned');

  // ============================================================
  // KNOWLEDGE ENTRIES (Ma trận kiến thức)
  // ============================================================
  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_entries (id, project_id, character_id, fact, knowledge_state, learned_episode, learned_scene)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const facts = [
    {
      fact: 'Lâm Hạo kích hoạt và sở hữu Hệ Thống Tu Luyện Cổ Đại',
      map: [
        { char: charLamHao, state: 'knows', ep: 'EP01', sc: 'SC03' },
        { char: charTieuBach, state: 'knows', ep: 'EP01', sc: 'SC03' },
        { char: charLamThanh, state: 'unknown', ep: '', sc: '' },
        { char: charLamMiHan, state: 'unknown', ep: '', sc: '' },
        { char: charVuongThienNhi, state: 'unknown', ep: '', sc: '' }
      ]
    },
    {
      fact: 'Thực lực thật của Lâm Hạo không còn là phế vật (đang tu luyện bí mật)',
      map: [
        { char: charLamHao, state: 'knows', ep: 'EP01', sc: 'SC03' },
        { char: charTieuBach, state: 'knows', ep: 'EP01', sc: 'SC03' },
        { char: charLamThanh, state: 'false_belief', ep: 'EP01', sc: 'SC01' },
        { char: charLamMiHan, state: 'suspects', ep: 'EP02', sc: 'SC02' },
        { char: charVuongThienNhi, state: 'unknown', ep: '', sc: '' }
      ]
    },
    {
      fact: 'Kẻ phái sát thủ hạ độc thủ đêm EP1 có liên quan đến nội bộ Lâm Gia',
      map: [
        { char: charLamHao, state: 'suspects', ep: 'EP01', sc: 'SC02' },
        { char: charTieuBach, state: 'knows', ep: 'EP01', sc: 'SC03' },
        { char: charLamThanh, state: 'knows', ep: 'EP01', sc: 'SC02' },
        { char: charLamMiHan, state: 'unknown', ep: '', sc: '' },
        { char: charVuongThienNhi, state: 'unknown', ep: '', sc: '' }
      ]
    },
    {
      fact: 'Dưới sàn phòng Lâm Hạo có Mật Thất Cổ Đại chứa Linh Mạch',
      map: [
        { char: charLamHao, state: 'knows', ep: 'EP02', sc: 'SC01' },
        { char: charTieuBach, state: 'knows', ep: 'EP01', sc: 'SC03' },
        { char: charLamThanh, state: 'unknown', ep: '', sc: '' },
        { char: charLamMiHan, state: 'unknown', ep: '', sc: '' },
        { char: charVuongThienNhi, state: 'unknown', ep: '', sc: '' }
      ]
    }
  ];

  for (const item of facts) {
    for (const k of item.map) {
      insertKnowledge.run(uuidv4(), projectId, k.char, item.fact, k.state, k.ep, k.sc);
    }
  }

  // ============================================================
  // STORY STATE SNAPSHOTS (Sau mỗi Scene)
  // ============================================================
  const insertSnapshot = db.prepare(`
    INSERT INTO story_state_snapshots (id, project_id, episode_id, scene_id, snapshot_data, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  insertSnapshot.run(uuidv4(), projectId, ep1Id, scene1Id, JSON.stringify({
    scene_number: 1,
    scene_title: 'Quỳ Trước Đại Sảnh',
    location: 'Lâm Gia Đại Viện — Đại Sảnh',
    characters: {
      'Lâm Hạo': { location: 'Đại Sảnh', outfit: 'Bạch y rách nhẹ', health: 'Yếu ớt (Khí huyết suy nhược)', injuries: 'Không', emotion: 'Ủ khuất kiên nhẫn', power: '0 (Phế vật)', inventory: [] },
      'Lâm Thanh': { location: 'Đại Sảnh', outfit: 'Cẩm y hoa lệ tím', health: 'Đỉnh cao', injuries: 'Không', emotion: 'Ngạo mạn khinh miệt', power: 'Khai Mạch Tầng 2', inventory: ['Lôi Hỏa Kiếm'] },
      'Lâm Mị Hàn': { location: 'Đại Sảnh', outfit: 'Bích y thanh nhã', health: 'Bình thường', injuries: 'Không', emotion: 'Lo lắng xót xa', power: 'Luyện Khí Tầng 6', inventory: [] }
    },
    items: {
      'Lôi Hỏa Kiếm': { owner: 'Lâm Thanh', location: 'Bên hông Lâm Thanh', condition: 'normal' }
    },
    active_threads: ['Gia Tộc Đại Hội'],
    unresolved_injuries: []
  }));

  insertSnapshot.run(uuidv4(), projectId, ep1Id, scene2Id, JSON.stringify({
    scene_number: 2,
    scene_title: 'Đêm Tối — Vụ Ám Sát',
    location: 'Lâm Gia Đại Viện — Phòng riêng Lâm Hạo',
    characters: {
      'Lâm Hạo': { location: 'Phòng riêng Lâm Hạo', outfit: 'Áo ngủ rách đẫm máu', health: 'Nguy kịch (Cận kề cái chết)', injuries: 'Vết đâm xuyên ngực trái, xuất huyết nặng', emotion: 'Hấp hối kiên cường', power: '0', inventory: ['Mảnh ám khí Vương Gia'] }
    },
    items: {
      'Ám khí sát thủ': { owner: 'Kẻ bí ẩn', location: 'Sàn phòng Lâm Hạo', condition: 'normal' }
    },
    active_threads: ['Gia Tộc Đại Hội', 'Ai đã phái sát thủ?'],
    unresolved_injuries: ['Vết đâm xuyên ngực trái của Lâm Hạo']
  }));

  insertSnapshot.run(uuidv4(), projectId, ep1Id, scene3Id, JSON.stringify({
    scene_number: 3,
    scene_title: 'Hệ Thống Kích Hoạt',
    location: 'Lâm Gia Đại Viện — Phòng riêng Lâm Hạo',
    characters: {
      'Lâm Hạo': { location: 'Phòng riêng Lâm Hạo', outfit: 'Bạch y (máu đã khô biến mất)', health: 'Hồi phục hoàn toàn (Hệ Thống trị liệu)', injuries: 'Không (đã lành sẹo mờ)', emotion: 'Kinh ngạc bàng hoàng, hy vọng bùng cháy', power: 'Kích hoạt Hệ Thống Tu Luyện Cổ Đại', inventory: ['Hệ Thống Tu Luyện', 'Mảnh ám khí'] },
      'Tiểu Bạch': { location: 'Phòng riêng Lâm Hạo (trên giường)', outfit: 'Lông trắng như tuyết', health: 'Thần thú thể suy yếu', injuries: 'Không', emotion: 'Lười biếng bí hiểm', power: 'Không rõ', inventory: [] }
    },
    items: {
      'Hệ Thống Tu Luyện': { owner: 'Lâm Hạo (Liên kết linh hồn)', location: 'Bên trong thần thức Lâm Hạo', condition: 'normal' }
    },
    active_threads: ['Gia Tộc Đại Hội', 'Ai đã phái sát thủ?', 'Nguồn gốc Hệ Thống', 'Tiểu Bạch là gì?'],
    unresolved_injuries: []
  }));

  // ============================================================
  // PROMPTS (default templates)
  // ============================================================
  const insertPrompt = db.prepare(`
    INSERT INTO prompts (id, project_id, name, type, description, template, variables)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertPrompt.run(uuidv4(), projectId, 'Tạo Scene', 'PROMPT_CREATE_SCENE',
    'Tạo nội dung scene mới từ dàn ý',
    `Bạn là biên kịch chuyên nghiệp cho phim ngắn dọc (TikTok/YouTube Shorts).

## THÔNG TIN DỰ ÁN
{{PROJECT_BIBLE}}

## CỐT TRUYỆN HIỆN TẠI
Arc: {{CURRENT_ARC}}
Episode: {{EPISODE}}

## SCENE TRƯỚC
{{PREVIOUS_SCENE}}

## NHÂN VẬT LIÊN QUAN
{{CHARACTERS}}

## TRẠNG THÁI HIỆN TẠI
{{CURRENT_STATE}}

## ĐỊA ĐIỂM
{{LOCATIONS}}

## TUYẾN TRUYỆN ĐANG MỞ
{{STORY_THREADS}}

## YÊU CẦU
{{USER_INPUT}}

## ĐỊNH DẠNG OUTPUT
Trả về JSON với cấu trúc:
{
  "title": "",
  "purpose": "",
  "summary": "",
  "time_of_day": "",
  "weather": "",
  "duration": 0,
  "starting_state": {},
  "action": "",
  "dialogue": "",
  "emotion_change": "",
  "ending_state": {},
  "transition": ""
}`,
    JSON.stringify(['PROJECT_BIBLE', 'CURRENT_ARC', 'EPISODE', 'PREVIOUS_SCENE', 'CHARACTERS', 'CURRENT_STATE', 'LOCATIONS', 'STORY_THREADS', 'USER_INPUT']));

  insertPrompt.run(uuidv4(), projectId, 'Kiểm Tra Liên Tục', 'PROMPT_CONTINUITY_CHECK',
    'Kiểm tra tính nhất quán của scene mới so với context',
    `Bạn là hệ thống kiểm tra tính liên tục (continuity) cho phim dài tập.

## CANON HIỆN TẠI
{{CURRENT_STATE}}

## SCENE CẦN KIỂM TRA
{{USER_INPUT}}

## YÊU CẦU KIỂM TRA
Kiểm tra các yếu tố sau:
1. Vị trí nhân vật có khớp với scene trước?
2. Trang phục có thay đổi vô lý?
3. Chấn thương có được duy trì?
4. Nhân vật có biết thông tin mà họ chưa được biết?
5. Cấp độ sức mạnh có nhất quán?
6. Vật phẩm có đúng chủ sở hữu?
7. Quy tắc thế giới có bị vi phạm?

## ĐỊNH DẠNG OUTPUT
{
  "valid": true/false,
  "errors": [],
  "warnings": [],
  "suggestions": []
}`,
    JSON.stringify(['CURRENT_STATE', 'USER_INPUT']));

  console.log('[SEED] Demo data đã được tạo thành công!');
  console.log(`[SEED] Project: Phế Vật Có Hệ Thống (${projectId})`);
  console.log(`[SEED] Characters: ${characters.length}`);
  console.log(`[SEED] Episodes: 3, Scenes: 3 (EP01)`);
}

/**
 * Seed bổ sung cho Phase 2 nếu database đã tồn tại nhưng chưa có data Phase 2
 */
function seedContinuityIfMissing(db) {
  try {
    const project = db.prepare('SELECT id FROM projects LIMIT 1').get();
    if (!project) return;
    const projectId = project.id;

    // Check foreshadows
    const fCount = db.prepare('SELECT COUNT(*) as count FROM foreshadows WHERE project_id = ?').get(projectId).count;
    if (fCount === 0) {
      console.log('[SEED] Bổ sung data Foreshadows cho Phase 2...');
      const insertF = db.prepare('INSERT INTO foreshadows (id, project_id, setup, setup_episode, setup_scene, planned_reveal, planned_reveal_episode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      insertF.run(uuidv4(), projectId, 'Ám khí khắc ấn gia huy Vương Gia rơi tại hiện trường vụ ám sát Lâm Hạo đêm EP1', 'EP01', 'SC02', 'Lâm Thanh cấu kết với chi nhánh ngầm của Vương Gia để ám hại anh trai', 'EP06', 'setup_done');
      insertF.run(uuidv4(), projectId, 'Vết bớt hình Chân Long trên vai Lâm Hạo phát sáng xanh lơ khi tiếp xúc linh khí cổ', 'EP02', 'SC01', 'Lâm Hạo là hậu duệ của Chân Long Thần Tộc bị lưu lạc 18 năm trước', 'EP10', 'planned');
      insertF.run(uuidv4(), projectId, 'Tiểu Bạch nhìn tháp Cấm Địa Lâm Gia với ánh mắt thù hận và phát ra tiếng gầm trầm như rồng', 'EP03', 'SC02', 'Cấm Địa giam giữ mẫu thân của Tiểu Bạch và linh mạch cổ của Thanh Vân Thành', 'EP08', 'planned');
    }

    // Check knowledge
    const kCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_entries WHERE project_id = ?').get(projectId).count;
    if (kCount === 0) {
      console.log('[SEED] Bổ sung data Knowledge Matrix cho Phase 2...');
      const chars = db.prepare('SELECT id, name FROM characters WHERE project_id = ?').all(projectId);
      const charMap = {};
      chars.forEach(c => charMap[c.name] = c.id);

      const insertK = db.prepare('INSERT INTO knowledge_entries (id, project_id, character_id, fact, knowledge_state, learned_episode, learned_scene) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const facts = [
        {
          fact: 'Lâm Hạo kích hoạt và sở hữu Hệ Thống Tu Luyện Cổ Đại',
          map: [
            { name: 'Lâm Hạo', state: 'knows', ep: 'EP01', sc: 'SC03' },
            { name: 'Tiểu Bạch', state: 'knows', ep: 'EP01', sc: 'SC03' },
            { name: 'Lâm Thanh', state: 'unknown', ep: '', sc: '' },
            { name: 'Lâm Mị Hàn', state: 'unknown', ep: '', sc: '' },
            { name: 'Vương Thiên Nhi', state: 'unknown', ep: '', sc: '' }
          ]
        },
        {
          fact: 'Thực lực thật của Lâm Hạo không còn là phế vật (đang tu luyện bí mật)',
          map: [
            { name: 'Lâm Hạo', state: 'knows', ep: 'EP01', sc: 'SC03' },
            { name: 'Tiểu Bạch', state: 'knows', ep: 'EP01', sc: 'SC03' },
            { name: 'Lâm Thanh', state: 'false_belief', ep: 'EP01', sc: 'SC01' },
            { name: 'Lâm Mị Hàn', state: 'suspects', ep: 'EP02', sc: 'SC02' },
            { name: 'Vương Thiên Nhi', state: 'unknown', ep: '', sc: '' }
          ]
        },
        {
          fact: 'Kẻ phái sát thủ hạ độc thủ đêm EP1 có liên quan đến nội bộ Lâm Gia',
          map: [
            { name: 'Lâm Hạo', state: 'suspects', ep: 'EP01', sc: 'SC02' },
            { name: 'Tiểu Bạch', state: 'knows', ep: 'EP01', sc: 'SC03' },
            { name: 'Lâm Thanh', state: 'knows', ep: 'EP01', sc: 'SC02' },
            { name: 'Lâm Mị Hàn', state: 'unknown', ep: '', sc: '' },
            { name: 'Vương Thiên Nhi', state: 'unknown', ep: '', sc: '' }
          ]
        },
        {
          fact: 'Dưới sàn phòng Lâm Hạo có Mật Thất Cổ Đại chứa Linh Mạch',
          map: [
            { name: 'Lâm Hạo', state: 'knows', ep: 'EP02', sc: 'SC01' },
            { name: 'Tiểu Bạch', state: 'knows', ep: 'EP01', sc: 'SC03' },
            { name: 'Lâm Thanh', state: 'unknown', ep: '', sc: '' },
            { name: 'Lâm Mị Hàn', state: 'unknown', ep: '', sc: '' },
            { name: 'Vương Thiên Nhi', state: 'unknown', ep: '', sc: '' }
          ]
        }
      ];

      for (const item of facts) {
        for (const k of item.map) {
          const cId = charMap[k.name];
          if (cId) {
            insertK.run(uuidv4(), projectId, cId, item.fact, k.state, k.ep, k.sc);
          }
        }
      }
    }

    // Check snapshots
    const sCount = db.prepare('SELECT COUNT(*) as count FROM story_state_snapshots WHERE project_id = ?').get(projectId).count;
    if (sCount === 0) {
      console.log('[SEED] Bổ sung Story State Snapshots cho Phase 2...');
      const scenes = db.prepare('SELECT id, episode_id, scene_number FROM scenes WHERE project_id = ? ORDER BY scene_number ASC').all(projectId);
      const insertSnap = db.prepare('INSERT INTO story_state_snapshots (id, project_id, episode_id, scene_id, snapshot_data, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))');

      if (scenes.length >= 1) {
        insertSnap.run(uuidv4(), projectId, scenes[0].episode_id, scenes[0].id, JSON.stringify({
          scene_number: 1,
          scene_title: 'Quỳ Trước Đại Sảnh',
          location: 'Lâm Gia Đại Viện — Đại Sảnh',
          characters: {
            'Lâm Hạo': { location: 'Đại Sảnh', outfit: 'Bạch y rách nhẹ', health: 'Yếu ớt (Khí huyết suy nhược)', injuries: 'Không', emotion: 'Ủ khuất kiên nhẫn', power: '0 (Phế vật)', inventory: [] },
            'Lâm Thanh': { location: 'Đại Sảnh', outfit: 'Cẩm y hoa lệ tím', health: 'Đỉnh cao', injuries: 'Không', emotion: 'Ngạo mạn khinh miệt', power: 'Khai Mạch Tầng 2', inventory: ['Lôi Hỏa Kiếm'] },
            'Lâm Mị Hàn': { location: 'Đại Sảnh', outfit: 'Bích y thanh nhã', health: 'Bình thường', injuries: 'Không', emotion: 'Lo lắng xót xa', power: 'Luyện Khí Tầng 6', inventory: [] }
          },
          items: {
            'Lôi Hỏa Kiếm': { owner: 'Lâm Thanh', location: 'Bên hông Lâm Thanh', condition: 'normal' }
          },
          active_threads: ['Gia Tộc Đại Hội'],
          unresolved_injuries: []
        }));
      }

      if (scenes.length >= 2) {
        insertSnap.run(uuidv4(), projectId, scenes[1].episode_id, scenes[1].id, JSON.stringify({
          scene_number: 2,
          scene_title: 'Đêm Tối — Vụ Ám Sát',
          location: 'Lâm Gia Đại Viện — Phòng riêng Lâm Hạo',
          characters: {
            'Lâm Hạo': { location: 'Phòng riêng Lâm Hạo', outfit: 'Áo ngủ rách đẫm máu', health: 'Nguy kịch (Cận kề cái chết)', injuries: 'Vết đâm xuyên ngực trái, xuất huyết nặng', emotion: 'Hấp hối kiên cường', power: '0', inventory: ['Mảnh ám khí Vương Gia'] }
          },
          items: {
            'Ám khí sát thủ': { owner: 'Kẻ bí ẩn', location: 'Sàn phòng Lâm Hạo', condition: 'normal' }
          },
          active_threads: ['Gia Tộc Đại Hội', 'Ai đã phái sát thủ?'],
          unresolved_injuries: ['Vết đâm xuyên ngực trái của Lâm Hạo']
        }));
      }

      if (scenes.length >= 3) {
        insertSnap.run(uuidv4(), projectId, scenes[2].episode_id, scenes[2].id, JSON.stringify({
          scene_number: 3,
          scene_title: 'Hệ Thống Kích Hoạt',
          location: 'Lâm Gia Đại Viện — Phòng riêng Lâm Hạo',
          characters: {
            'Lâm Hạo': { location: 'Phòng riêng Lâm Hạo', outfit: 'Bạch y (máu đã khô biến mất)', health: 'Hồi phục hoàn toàn (Hệ Thống trị liệu)', injuries: 'Không (đã lành sẹo mờ)', emotion: 'Kinh ngạc bàng hoàng, hy vọng bùng cháy', power: 'Kích hoạt Hệ Thống Tu Luyện Cổ Đại', inventory: ['Hệ Thống Tu Luyện', 'Mảnh ám khí'] },
            'Tiểu Bạch': { location: 'Phòng riêng Lâm Hạo (trên giường)', outfit: 'Lông trắng như tuyết', health: 'Thần thú thể suy yếu', injuries: 'Không', emotion: 'Lười biếng bí hiểm', power: 'Không rõ', inventory: [] }
          },
          items: {
            'Hệ Thống Tu Luyện': { owner: 'Lâm Hạo (Liên kết linh hồn)', location: 'Bên trong thần thức Lâm Hạo', condition: 'normal' }
          },
          active_threads: ['Gia Tộc Đại Hội', 'Ai đã phái sát thủ?', 'Nguồn gốc Hệ Thống', 'Tiểu Bạch là gì?'],
          unresolved_injuries: []
        }));
      }
    }
  } catch (err) {
    console.error('[SEED] Lỗi khi seed continuity bổ sung:', err.message);
  }
}

module.exports = { seedDemoData, seedContinuityIfMissing };
