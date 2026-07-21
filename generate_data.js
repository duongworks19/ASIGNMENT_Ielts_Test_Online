const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'database.json');
const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// 1. Generate 7 Mock Tests based on test-writing-free-2
const baseTest = dbData.tests.find(t => t.id === 'test-writing-free-2');
if (!baseTest) throw new Error("Base test not found!");

const testsToGenerate = [
  // Course 003
  { id: 'gen-test-writing-003-1', title: 'Writing Mock Test 1 - Task 2 Masterclass', courseId: 'course-003' },
  { id: 'gen-test-writing-003-2', title: 'Writing Mock Test 2 - Task 2 Masterclass', courseId: 'course-003' },
  // Course 009
  { id: 'gen-test-writing-009-1', title: 'Writing Mock Test 1 - Task 1 Academic Report', courseId: 'course-009' },
  { id: 'gen-test-writing-009-2', title: 'Writing Mock Test 2 - Task 1 Academic Report', courseId: 'course-009' },
  { id: 'gen-test-writing-009-3', title: 'Writing Mock Test 3 - Task 1 Academic Report', courseId: 'course-009' },
  { id: 'gen-test-writing-009-4', title: 'Writing Mock Test 4 - Task 1 Academic Report', courseId: 'course-009' },
  { id: 'gen-test-writing-009-5', title: 'Writing Mock Test 5 - Task 1 Academic Report', courseId: 'course-009' }
];

const newTests = testsToGenerate.map(t => ({
  ...baseTest,
  id: t.id,
  title: t.title,
  courseId: t.courseId,
  testMode: 'course', // because it belongs to a course now
  isFreePreview: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

dbData.tests = [...dbData.tests, ...newTests];

// 2. Generate 7 Flashcard Decks
const decksToGenerate = [
  { id: 'gen-deck-003-1', title: 'Task 2 Vocabulary: Essay Structure & Linking Words', courseId: 'course-003' },
  { id: 'gen-deck-003-2', title: 'Task 2 Vocabulary: Advanced Arguments & Opinions', courseId: 'course-003' },
  { id: 'gen-deck-009-1', title: 'Task 1 Vocabulary: Describing Trends & Changes', courseId: 'course-009' },
  { id: 'gen-deck-009-2', title: 'Task 1 Vocabulary: Comparing & Contrasting', courseId: 'course-009' },
  { id: 'gen-deck-009-3', title: 'Task 1 Vocabulary: Map & Process Descriptions', courseId: 'course-009' },
  { id: 'gen-deck-009-4', title: 'Task 1 Vocabulary: Data & Statistics', courseId: 'course-009' },
  { id: 'gen-deck-009-5', title: 'Task 1 Vocabulary: Advanced Synonyms for Charts', courseId: 'course-009' }
];

const newDecks = decksToGenerate.map(d => ({
  id: d.id,
  title: d.title,
  description: '10 essential vocabulary words carefully curated for this course.',
  teacherId: 'u-teacher-001',
  deckMode: 'course',
  courseId: d.courseId,
  status: 'published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

if (!dbData.flashcardDecks) dbData.flashcardDecks = [];
dbData.flashcardDecks = [...dbData.flashcardDecks, ...newDecks];

// 3. Generate 10 Flashcards per Deck (total 70)
const flashcardsData = {
  'gen-deck-003-1': [
    { word: 'Furthermore', meaning: 'Hơn nữa, ngoài ra', pronunciation: '/ˌfɜːr.ðɚˈmɔːr/', example: 'Furthermore, the government should invest in public transport.' },
    { word: 'Consequently', meaning: 'Hậu quả là, do đó', pronunciation: '/ˈkɑːn.sə.kwənt.li/', example: 'Consequently, the pollution levels have decreased.' },
    { word: 'Moreover', meaning: 'Thêm vào đó', pronunciation: '/mɔːrˈoʊ.vɚ/', example: 'Moreover, this approach saves money.' },
    { word: 'Nevertheless', meaning: 'Tuy nhiên', pronunciation: '/ˌnev.ɚ.ðəˈles/', example: 'Nevertheless, the problem remains.' },
    { word: 'In addition', meaning: 'Thêm vào', pronunciation: '/ɪn əˈdɪʃ.ən/', example: 'In addition to this, we must consider the cost.' },
    { word: 'To illustrate', meaning: 'Để minh họa', pronunciation: '/tə ˈɪl.ə.streɪt/', example: 'To illustrate, consider the case of modern cities.' },
    { word: 'In conclusion', meaning: 'Kết luận lại', pronunciation: '/ɪn kənˈkluː.ʒən/', example: 'In conclusion, both sides have valid points.' },
    { word: 'Whereas', meaning: 'Trong khi đó', pronunciation: '/werˈæz/', example: 'Whereas the former is cheap, the latter is expensive.' },
    { word: 'Therefore', meaning: 'Vì vậy', pronunciation: '/ˈðer.fɔːr/', example: 'Therefore, action must be taken immediately.' },
    { word: 'Conversely', meaning: 'Ngược lại', pronunciation: '/ˈkɑːn.vɝːs.li/', example: 'Conversely, poor countries suffer more.' }
  ],
  'gen-deck-003-2': [
    { word: 'Detrimental', meaning: 'Có hại', pronunciation: '/ˌdet.rəˈmen.t̬əl/', example: 'Smoking is detrimental to health.' },
    { word: 'Mitigate', meaning: 'Làm giảm nhẹ', pronunciation: '/ˈmɪt̬.ə.ɡeɪt/', example: 'We must mitigate the effects of climate change.' },
    { word: 'Exacerbate', meaning: 'Làm trầm trọng thêm', pronunciation: '/ɪɡˈzæs.ɚ.beɪt/', example: 'The new law will exacerbate the problem.' },
    { word: 'Indispensable', meaning: 'Không thể thiếu', pronunciation: '/ˌɪn.dɪˈspen.sə.bəl/', example: 'Technology is indispensable in modern life.' },
    { word: 'Prevalent', meaning: 'Phổ biến', pronunciation: '/ˈprev.əl.ənt/', example: 'This issue is prevalent in developing nations.' },
    { word: 'Advocate', meaning: 'Ủng hộ, biện hộ', pronunciation: '/ˈæd.və.keɪt/', example: 'Many people advocate for stricter laws.' },
    { word: 'Feasible', meaning: 'Khả thi', pronunciation: '/ˈfiː.zə.bəl/', example: 'It is not a feasible solution.' },
    { word: 'Inevitable', meaning: 'Không thể tránh khỏi', pronunciation: '/ˌɪnˈev.ə.t̬ə.bəl/', example: 'Change is inevitable.' },
    { word: 'Substantial', meaning: 'Đáng kể', pronunciation: '/səbˈstæn.ʃəl/', example: 'A substantial amount of money was spent.' },
    { word: 'Imperative', meaning: 'Cấp bách, bắt buộc', pronunciation: '/ɪmˈper.ə.t̬ɪv/', example: 'It is imperative that we act now.' }
  ],
  'gen-deck-009-1': [
    { word: 'Skyrocket', meaning: 'Tăng vọt', pronunciation: '/ˈskaɪˌrɑː.kɪt/', example: 'Prices skyrocketed in the second quarter.' },
    { word: 'Plummet', meaning: 'Giảm mạnh', pronunciation: '/ˈplʌm.ɪt/', example: 'Sales plummeted to an all-time low.' },
    { word: 'Fluctuate', meaning: 'Dao động', pronunciation: '/ˈflʌk.tʃu.eɪt/', example: 'The numbers fluctuated wildly over the year.' },
    { word: 'Plateau', meaning: 'Đạt mức ổn định', pronunciation: '/plæˈtoʊ/', example: 'The population plateaued after 2010.' },
    { word: 'Soar', meaning: 'Tăng mạnh', pronunciation: '/sɔːr/', example: 'Profits soared by 50%.' },
    { word: 'Plunge', meaning: 'Lao dốc', pronunciation: '/plʌndʒ/', example: 'The temperature plunged overnight.' },
    { word: 'Level off', meaning: 'Chững lại, đi ngang', pronunciation: '/ˈlev.əl ɑːf/', example: 'The growth leveled off eventually.' },
    { word: 'Dip', meaning: 'Giảm nhẹ', pronunciation: '/dɪp/', example: 'There was a slight dip in attendance.' },
    { word: 'Peak', meaning: 'Đạt đỉnh', pronunciation: '/piːk/', example: 'Production peaked in 2015.' },
    { word: 'Surge', meaning: 'Tăng đột ngột', pronunciation: '/sɝːdʒ/', example: 'A sudden surge in demand was recorded.' }
  ],
  'gen-deck-009-2': [
    { word: 'Respectively', meaning: 'Theo thứ tự tương ứng', pronunciation: '/rɪˈspek.tɪv.li/', example: 'The shares for A and B were 10% and 20% respectively.' },
    { word: 'In contrast', meaning: 'Ngược lại', pronunciation: '/ɪn ˈkɑːn.træst/', example: 'In contrast, the second group showed a decline.' },
    { word: 'Similarly', meaning: 'Tương tự', pronunciation: '/ˈsɪm.ə.lɚ.li/', example: 'Similarly, the figures for women increased.' },
    { word: 'A striking feature', meaning: 'Một đặc điểm nổi bật', pronunciation: '/ə ˈstraɪ.kɪŋ ˈfiː.tʃɚ/', example: 'A striking feature is the sudden drop in 2005.' },
    { word: 'Outnumber', meaning: 'Vượt trội về số lượng', pronunciation: '/ˌaʊtˈnʌm.bɚ/', example: 'Men outnumbered women in this sector.' },
    { word: 'Account for', meaning: 'Chiếm (tỷ lệ)', pronunciation: '/əˈkaʊnt fɔːr/', example: 'Coal accounted for 50% of the total energy.' },
    { word: 'Conversely', meaning: 'Ngược lại', pronunciation: '/ˈkɑːn.vɝːs.li/', example: 'Conversely, gas consumption fell.' },
    { word: 'The majority', meaning: 'Đa số', pronunciation: '/ðə məˈdʒɑː.rə.t̬i/', example: 'The majority of users preferred mobile phones.' },
    { word: 'Comparable', meaning: 'Tương đương', pronunciation: '/ˈkɑːm.pɚ.ə.bəl/', example: 'The numbers were comparable in both years.' },
    { word: 'Differ', meaning: 'Khác biệt', pronunciation: '/ˈdɪf.ɚ/', example: 'The two countries differ significantly in size.' }
  ],
  'gen-deck-009-3': [
    { word: 'Demolish', meaning: 'Phá hủy', pronunciation: '/dɪˈmɑː.lɪʃ/', example: 'The old buildings were demolished.' },
    { word: 'Construct', meaning: 'Xây dựng', pronunciation: '/kənˈstrʌkt/', example: 'A new bridge was constructed.' },
    { word: 'Replace', meaning: 'Thay thế', pronunciation: '/rɪˈpleɪs/', example: 'The park was replaced by a car park.' },
    { word: 'Adjacent to', meaning: 'Kế bên, sát cạnh', pronunciation: '/əˈdʒeɪ.sənt tuː/', example: 'The shop is adjacent to the station.' },
    { word: 'Expand', expand: 'Mở rộng', pronunciation: '/ɪkˈspænd/', example: 'The residential area expanded.' },
    { word: 'Relocate', meaning: 'Di dời', pronunciation: '/ˌriːˈloʊ.keɪt/', example: 'The factory was relocated to the north.' },
    { word: 'Undergo', meaning: 'Trải qua', pronunciation: '/ˌʌn.dɚˈɡoʊ/', example: 'The town underwent significant changes.' },
    { word: 'Convert into', meaning: 'Chuyển đổi thành', pronunciation: '/kənˈvɝːt ˈɪn.tuː/', example: 'The warehouse was converted into a gym.' },
    { word: 'Erect', meaning: 'Dựng lên', pronunciation: '/ɪˈrekt/', example: 'A new monument was erected.' },
    { word: 'Initially', meaning: 'Ban đầu', pronunciation: '/ɪˈnɪʃ.əl.i/', example: 'Initially, the process begins with...' }
  ],
  'gen-deck-009-4': [
    { word: 'Proportion', meaning: 'Tỷ lệ', pronunciation: '/prəˈpɔːr.ʃən/', example: 'The proportion of students rose.' },
    { word: 'Percentage', meaning: 'Phần trăm', pronunciation: '/pɚˈsen.t̬ɪdʒ/', example: 'A large percentage of the budget.' },
    { word: 'A quarter', meaning: 'Một phần tư (25%)', pronunciation: '/ə ˈkwɔːr.t̬ɚ/', example: 'Exactly a quarter of the group.' },
    { word: 'A third', meaning: 'Một phần ba (33%)', pronunciation: '/ə θɝːd/', example: 'Almost a third of participants.' },
    { word: 'Two-fifths', meaning: 'Hai phần năm (40%)', pronunciation: '/tuː fɪfθs/', example: 'Two-fifths of the energy.' },
    { word: 'Double', meaning: 'Tăng gấp đôi', pronunciation: '/ˈdʌb.əl/', example: 'The figure doubled in ten years.' },
    { word: 'Triple', meaning: 'Tăng gấp ba', pronunciation: '/ˈtrɪp.əl/', example: 'Sales tripled over the period.' },
    { word: 'Halve', meaning: 'Giảm một nửa', pronunciation: '/hæv/', example: 'The number of incidents halved.' },
    { word: 'A fraction', meaning: 'Một phần nhỏ', pronunciation: '/ə ˈfræk.ʃən/', example: 'Only a fraction of the cost.' },
    { word: 'Ratio', meaning: 'Tỷ số', pronunciation: '/ˈreɪ.ʃi.oʊ/', example: 'The ratio of men to women was 2:1.' }
  ],
  'gen-deck-009-5': [
    { word: 'Illustrate', meaning: 'Minh họa', pronunciation: '/ˈɪl.ə.streɪt/', example: 'The graph illustrates the changes.' },
    { word: 'Depict', meaning: 'Mô tả', pronunciation: '/dɪˈpɪkt/', example: 'The chart depicts energy use.' },
    { word: 'Demonstrate', meaning: 'Chứng minh, thể hiện', pronunciation: '/ˈdem.ən.streɪt/', example: 'The data demonstrates a clear trend.' },
    { word: 'Breakdown', meaning: 'Sự phân tích chi tiết', pronunciation: '/ˈbreɪk.daʊn/', example: 'A breakdown of the budget is shown.' },
    { word: 'Comprise', meaning: 'Bao gồm', pronunciation: '/kəmˈpraɪz/', example: 'The pie chart comprises four sections.' },
    { word: 'Constituent', meaning: 'Thành phần', pronunciation: '/kənˈstɪtʃ.u.ənt/', example: 'The main constituent was coal.' },
    { word: 'Expenditure', meaning: 'Sự chi tiêu', pronunciation: '/ɪkˈspen.də.tʃɚ/', example: 'Expenditure on health increased.' },
    { word: 'Revenue', meaning: 'Doanh thu', pronunciation: '/ˈrev.ə.nuː/', example: 'The company generated high revenue.' },
    { word: 'Category', meaning: 'Hạng mục, loại', pronunciation: '/ˈkæt̬.ə.ɡri/', example: 'The largest category was food.' },
    { word: 'Underlying', meaning: 'Cơ bản, nằm dưới', pronunciation: '/ˌʌn.dɚˈlaɪ.ɪŋ/', example: 'The underlying trend was upward.' }
  ]
};

const newFlashcards = [];
Object.entries(flashcardsData).forEach(([deckId, words]) => {
  words.forEach((w, index) => {
    newFlashcards.push({
      deckId: deckId,
      word: w.word,
      meaning: w.meaning || w.expand, // fixed typo in one card
      pronunciation: w.pronunciation,
      example: w.example,
      id: `gen-card-${deckId}-${index}`,
      status: 'active',
      imageUrl: '',
      audioUrl: ''
    });
  });
});

if (!dbData.flashcards) dbData.flashcards = [];
dbData.flashcards = [...dbData.flashcards, ...newFlashcards];

// 4. Save to database.json
fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2));
console.log('Successfully generated 7 Mock Tests and 70 Flashcards!');
