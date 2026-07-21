const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../db.json');
const db = require(dbPath);

const generateId = (prefix = '') => prefix + crypto.randomBytes(4).toString('hex');

const ORIGINAL_TEST_ID = '7E_JRFnAD7o';
const FREE_COURSE_ID = 'course-reading-free-8s28fpfl7';
const PREMIUM_COURSE_ID = 'course-reading-paid-ki1nljyt3';

const originalTest = db.tests.find(t => t.id === ORIGINAL_TEST_ID);
if (!originalTest) {
  console.error("Cannot find original test.");
  process.exit(1);
}

// Helper to deep clone and assign new IDs
const cloneTest = (original, newId, newTitle, courseId) => {
  const clone = JSON.parse(JSON.stringify(original));
  clone.id = newId;
  clone.title = newTitle;
  clone.courseId = courseId;
  
  // Re-generate IDs for passages and blocks
  if (clone.passages) {
    clone.passages.forEach((passage, pIdx) => {
      passage.id = generateId('passage-');
      
      if (passage.blocks) {
        passage.blocks.forEach(block => {
          block.id = generateId('block-');
          if (block.questions) {
            block.questions.forEach(q => {
              q.id = generateId('q-');
            });
          }
        });
      }
    });
  }
  
  return clone;
};

// Generate 7 tests
const newTests = [
  cloneTest(originalTest, generateId('test-'), 'Reading Practice Test 2', FREE_COURSE_ID),
  cloneTest(originalTest, generateId('test-'), 'Reading Practice Test 3', FREE_COURSE_ID),
  cloneTest(originalTest, generateId('test-'), 'Reading Practice Test 4', PREMIUM_COURSE_ID),
  cloneTest(originalTest, generateId('test-'), 'Reading Practice Test 5', PREMIUM_COURSE_ID),
  cloneTest(originalTest, generateId('test-'), 'Reading Practice Test 6', PREMIUM_COURSE_ID),
  cloneTest(originalTest, generateId('test-'), 'Reading Practice Test 7', PREMIUM_COURSE_ID),
  cloneTest(originalTest, generateId('test-'), 'Reading Practice Test 8', PREMIUM_COURSE_ID),
];

db.tests.push(...newTests);

// Generate 7 Flashcard Decks
const flashcardDecks = [];
const flashcards = [];

const VOCAB_DATA = [
  // Deck 1 (Free)
  {
    title: 'Reading Test 2 Vocabulary',
    courseId: FREE_COURSE_ID,
    words: [
      { word: 'Agriculture', meaning: 'Nông nghiệp', example: 'Agriculture is vital for the economy.' },
      { word: 'Innovative', meaning: 'Sáng tạo, đổi mới', example: 'We need innovative solutions.' },
      { word: 'Sustainability', meaning: 'Sự bền vững', example: 'Sustainability is a key goal.' },
      { word: 'Ecosystem', meaning: 'Hệ sinh thái', example: 'The ecosystem is fragile.' },
      { word: 'Urbanization', meaning: 'Đô thị hóa', example: 'Urbanization causes many problems.' },
      { word: 'Biodiversity', meaning: 'Đa dạng sinh học', example: 'Protecting biodiversity is important.' },
      { word: 'Pollution', meaning: 'Ô nhiễm', example: 'Air pollution is a major issue.' },
      { word: 'Habitat', meaning: 'Môi trường sống', example: "The tiger's natural habitat." },
      { word: 'Conservation', meaning: 'Sự bảo tồn', example: 'Wildlife conservation efforts.' },
      { word: 'Deforestation', meaning: 'Nạn phá rừng', example: 'Deforestation leads to global warming.' }
    ]
  },
  // Deck 2 (Free)
  {
    title: 'Reading Test 3 Vocabulary',
    courseId: FREE_COURSE_ID,
    words: [
      { word: 'Analyze', meaning: 'Phân tích', example: 'Analyze the data carefully.' },
      { word: 'Determine', meaning: 'Xác định', example: 'Determine the main cause.' },
      { word: 'Hypothesis', meaning: 'Giả thuyết', example: 'Formulate a hypothesis.' },
      { word: 'Phenomenon', meaning: 'Hiện tượng', example: 'A rare natural phenomenon.' },
      { word: 'Significant', meaning: 'Đáng kể, quan trọng', example: 'A significant improvement.' },
      { word: 'Theoretical', meaning: 'Thuộc về lý thuyết', example: 'A theoretical approach.' },
      { word: 'Evident', meaning: 'Rõ ràng', example: 'It is evident that...' },
      { word: 'Constitute', meaning: 'Cấu thành', example: 'Women constitute 50% of the population.' },
      { word: 'Derive', meaning: 'Bắt nguồn từ', example: 'Derive meaning from context.' },
      { word: 'Establish', meaning: 'Thành lập, thiết lập', example: 'Establish a connection.' }
    ]
  },
  // Deck 3 (Premium)
  {
    title: 'Reading Test 4 Vocabulary',
    courseId: PREMIUM_COURSE_ID,
    words: [
      { word: 'Comprehensive', meaning: 'Toàn diện', example: 'A comprehensive study.' },
      { word: 'Implication', meaning: 'Hệ quả, ẩn ý', example: 'The implications of the research.' },
      { word: 'Profound', meaning: 'Sâu sắc', example: 'A profound impact.' },
      { word: 'Paradigm', meaning: 'Mô hình', example: 'A paradigm shift.' },
      { word: 'Plausible', meaning: 'Có vẻ hợp lý', example: 'A plausible explanation.' },
      { word: 'Subsequent', meaning: 'Tiếp theo', example: 'Subsequent events.' },
      { word: 'Empirical', meaning: 'Dựa trên kinh nghiệm, thực tế', example: 'Empirical evidence.' },
      { word: 'Inherent', meaning: 'Vốn có', example: 'Inherent risks.' },
      { word: 'Manifest', meaning: 'Biểu hiện', example: 'Manifested in different ways.' },
      { word: 'Obscure', meaning: 'Mờ nhạt, khó hiểu', example: 'An obscure reference.' }
    ]
  },
  // Deck 4 (Premium)
  {
    title: 'Reading Test 5 Vocabulary',
    courseId: PREMIUM_COURSE_ID,
    words: [
      { word: 'Cognitive', meaning: 'Nhận thức', example: 'Cognitive development.' },
      { word: 'Intuitive', meaning: 'Trực giác', example: 'An intuitive interface.' },
      { word: 'Perception', meaning: 'Sự nhận thức', example: 'Visual perception.' },
      { word: 'Consciousness', meaning: 'Ý thức', example: 'Human consciousness.' },
      { word: 'Stimulus', meaning: 'Sự kích thích', example: 'Response to a stimulus.' },
      { word: 'Neurological', meaning: 'Thuộc thần kinh', example: 'Neurological disorders.' },
      { word: 'Behavioral', meaning: 'Hành vi', example: 'Behavioral patterns.' },
      { word: 'Psychological', meaning: 'Tâm lý', example: 'Psychological impact.' },
      { word: 'Acquisition', meaning: 'Sự tiếp thu', example: 'Language acquisition.' },
      { word: 'Retain', meaning: 'Giữ lại', example: 'Retain information.' }
    ]
  },
  // Deck 5 (Premium)
  {
    title: 'Reading Test 6 Vocabulary',
    courseId: PREMIUM_COURSE_ID,
    words: [
      { word: 'Infrastructure', meaning: 'Cơ sở hạ tầng', example: 'Improving infrastructure.' },
      { word: 'Metropolitan', meaning: 'Thuộc đô thị', example: 'A metropolitan area.' },
      { word: 'Commute', meaning: 'Đi lại', example: 'A long daily commute.' },
      { word: 'Congestion', meaning: 'Sự tắc nghẽn', example: 'Traffic congestion.' },
      { word: 'Density', meaning: 'Mật độ', example: 'High population density.' },
      { word: 'Amenity', meaning: 'Tiện nghi', example: 'Local amenities.' },
      { word: 'Suburban', meaning: 'Thuộc ngoại ô', example: 'A suburban neighborhood.' },
      { word: 'Renovation', meaning: 'Sự cải tạo', example: 'Building renovation.' },
      { word: 'Aesthetic', meaning: 'Thẩm mỹ', example: 'Aesthetic appeal.' },
      { word: 'Integration', meaning: 'Sự hội nhập', example: 'Cultural integration.' }
    ]
  },
  // Deck 6 (Premium)
  {
    title: 'Reading Test 7 Vocabulary',
    courseId: PREMIUM_COURSE_ID,
    words: [
      { word: 'Flourish', meaning: 'Phát triển mạnh mẽ', example: 'The civilization flourished.' },
      { word: 'Demise', meaning: 'Sự sụp đổ', example: 'The demise of the empire.' },
      { word: 'Artifact', meaning: 'Đồ tạo tác', example: 'Ancient artifacts.' },
      { word: 'Excavation', meaning: 'Sự khai quật', example: 'Archaeological excavation.' },
      { word: 'Chronological', meaning: 'Theo thứ tự thời gian', example: 'Chronological order.' },
      { word: 'Antiquity', meaning: 'Thời cổ đại', example: 'Relics of antiquity.' },
      { word: 'Heritage', meaning: 'Di sản', example: 'Cultural heritage.' },
      { word: 'Lineage', meaning: 'Dòng dõi', example: 'A noble lineage.' },
      { word: 'Ancestry', meaning: 'Tổ tiên', example: 'Of European ancestry.' },
      { word: 'Mythology', meaning: 'Thần thoại', example: 'Greek mythology.' }
    ]
  },
  // Deck 7 (Premium)
  {
    title: 'Reading Test 8 Vocabulary',
    courseId: PREMIUM_COURSE_ID,
    words: [
      { word: 'Algorithm', meaning: 'Thuật toán', example: 'A complex algorithm.' },
      { word: 'Automation', meaning: 'Tự động hóa', example: 'Industrial automation.' },
      { word: 'Innovation', meaning: 'Sự đổi mới', example: 'Technological innovation.' },
      { word: 'Artificial', meaning: 'Nhân tạo', example: 'Artificial intelligence.' },
      { word: 'Simulation', meaning: 'Sự mô phỏng', example: 'Computer simulation.' },
      { word: 'Virtual', meaning: 'Ảo', example: 'Virtual reality.' },
      { word: 'Interface', meaning: 'Giao diện', example: 'User interface.' },
      { word: 'Cybersecurity', meaning: 'An ninh mạng', example: 'Cybersecurity threats.' },
      { word: 'Encryption', meaning: 'Mã hóa', example: 'Data encryption.' },
      { word: 'Optimization', meaning: 'Sự tối ưu hóa', example: 'System optimization.' }
    ]
  }
];

VOCAB_DATA.forEach((deckData, index) => {
  const deckId = generateId('deck-');
  flashcardDecks.push({
    id: deckId,
    title: deckData.title,
    description: `Core vocabulary for ${deckData.title}`,
    teacherId: "u-teacher-001",
    deckMode: deckData.courseId === FREE_COURSE_ID ? 'free' : 'premium',
    courseId: deckData.courseId,
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  deckData.words.forEach(wordData => {
    flashcards.push({
      id: generateId('card-'),
      deckId: deckId,
      word: wordData.word,
      meaning: wordData.meaning,
      pronunciation: "",
      example: wordData.example,
      status: "active",
      imageUrl: "",
      audioUrl: "",
      courseId: deckData.courseId
    });
  });
});

if (!db.flashcardDecks) db.flashcardDecks = [];
if (!db.flashcards) db.flashcards = [];

db.flashcardDecks.push(...flashcardDecks);
db.flashcards.push(...flashcards);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('Successfully generated 7 clone tests and 7 flashcard decks.');
