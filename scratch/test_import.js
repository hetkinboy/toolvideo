const fs = require('fs');

const projectId = '4f09f320-af78-491d-8e53-1875e0767f54';

// Test simple sample
const testData = {
  bible: {
    logline: "Test logline",
    main_story_summary: "Test summary"
  },
  characters: [
    { name: "Lâm Phàm", role: "main" }
  ],
  locations: [
    { name: "Thanh Hà Thôn", type: "outdoor" }
  ],
  items: [
    { name: "Thần Ân Ấn", type: "artifact" }
  ],
  episodes: [
    { episode_number: 1, title: "Một Mạng Đổi Một Đời", scenes: [{ scene_number: 1, title: "Đêm Tăng Ca Cuối Cùng" }] }
  ]
};

fetch(`http://localhost:3001/api/projects/${projectId}/import-master-outline`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(r => r.json())
.then(res => {
  console.log('RESULT:', res);
})
.catch(err => {
  console.error('ERROR:', err);
});
