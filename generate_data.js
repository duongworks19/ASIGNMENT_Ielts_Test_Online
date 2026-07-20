const fs = require('fs');
const d = JSON.parse(fs.readFileSync('db.json', 'utf8'));

const newCards = [
  // Deck 1: IELTS Reading (10 more cards)
  { deckId: 'deck-1', word: 'Ambiguous', meaning: 'Mơ hồ, không rõ ràng', pronunciation: '/æmˈbɪɡjuəs/', example: 'His role has always been ambiguous.' },
  { deckId: 'deck-1', word: 'Comprehend', meaning: 'Hiểu, lĩnh hội', pronunciation: '/ˌkɒmprɪˈhend/', example: 'He stood staring at the dead body, unable to comprehend.' },
  { deckId: 'deck-1', word: 'Contradict', meaning: 'Mâu thuẫn, trái ngược', pronunciation: '/ˌkɒntrəˈdɪkt/', example: 'All evening her husband contradicted everything she said.' },
  { deckId: 'deck-1', word: 'Evaluate', meaning: 'Đánh giá', pronunciation: '/ɪˈvæljueɪt/', example: 'Our research attempts to evaluate the effectiveness of the different drugs.' },
  { deckId: 'deck-1', word: 'Incorporate', meaning: 'Sát nhập, kết hợp', pronunciation: '/ɪnˈkɔːpəreɪt/', example: 'The new car design incorporates all the latest safety features.' },
  { deckId: 'deck-1', word: 'Legislate', meaning: 'Lập pháp, ban hành luật', pronunciation: '/ˈledʒɪsleɪt/', example: 'They promised to legislate against cigarette advertising.' },
  { deckId: 'deck-1', word: 'Paradigm', meaning: 'Mô hình, kiểu mẫu', pronunciation: '/ˈpærədaɪm/', example: 'The war was a paradigm of the destructive side of human nature.' },
  { deckId: 'deck-1', word: 'Qualitative', meaning: 'Định tính, chất lượng', pronunciation: '/ˈkwɒlɪtətɪv/', example: 'There are qualitative differences between the two products.' },
  { deckId: 'deck-1', word: 'Supplement', meaning: 'Phần bổ sung', pronunciation: '/ˈsʌplɪmənt/', example: 'He supplements his income by working in a bar at night.' },
  { deckId: 'deck-1', word: 'Valid', meaning: 'Hợp lệ, có giá trị', pronunciation: '/ˈvælɪd/', example: 'Do you have a valid passport?' },

  // Deck 2: Environment (10 more cards)
  { deckId: 'TCOYggEc8dw', word: 'Ecosystem', meaning: 'Hệ sinh thái', pronunciation: '/ˈiːkəʊsɪstəm/', example: 'Pollution can have disastrous effects on the delicately balanced ecosystem.' },
  { deckId: 'TCOYggEc8dw', word: 'Conservation', meaning: 'Sự bảo tồn', pronunciation: '/ˌkɒnsəˈveɪʃn/', example: 'Energy conservation reduces your fuel bills and helps the environment.' },
  { deckId: 'TCOYggEc8dw', word: 'Extinct', meaning: 'Tuyệt chủng', pronunciation: '/ɪkˈstɪŋkt/', example: 'There is concern that the giant panda will soon become extinct.' },
  { deckId: 'TCOYggEc8dw', word: 'Renewable', meaning: 'Có thể tái tạo', pronunciation: '/rɪˈnjuːəbl/', example: 'Renewable sources of energy such as wind and solar power.' },
  { deckId: 'TCOYggEc8dw', word: 'Pollution', meaning: 'Sự ô nhiễm', pronunciation: '/pəˈluːʃn/', example: 'The manifesto includes tough measures to tackle road congestion and environmental pollution.' },
  { deckId: 'TCOYggEc8dw', word: 'Global Warming', meaning: 'Sự nóng lên toàn cầu', pronunciation: '/ˌɡləʊbl ˈwɔːmɪŋ/', example: 'The effects of global warming are already being felt.' },
  { deckId: 'TCOYggEc8dw', word: 'Carbon Footprint', meaning: 'Lượng khí thải carbon', pronunciation: '/ˌkɑːbən ˈfʊtprɪnt/', example: 'Companies are measuring their carbon footprints.' },
  { deckId: 'TCOYggEc8dw', word: 'Endangered', meaning: 'Gặp nguy hiểm', pronunciation: '/ɪnˈdeɪndʒəd/', example: 'The sea turtle is an endangered species.' },
  { deckId: 'TCOYggEc8dw', word: 'Fossil Fuel', meaning: 'Nhiên liệu hóa thạch', pronunciation: '/ˈfɒsl fjuːəl/', example: 'Carbon dioxide is produced by the burning of fossil fuels.' },
  { deckId: 'TCOYggEc8dw', word: 'Vegetation', meaning: 'Thảm thực vật', pronunciation: '/ˌvedʒəˈteɪʃn/', example: 'The railway track is heavily overgrown with vegetation.' },

  // Deck 3: PET B1 (10 more cards)
  { deckId: 'aPZwGTPgqN0', word: 'Advantage', meaning: 'Lợi thế, ưu điểm', pronunciation: '/ədˈvɑːntɪdʒ/', example: 'It gives you an unfair advantage.' },
  { deckId: 'aPZwGTPgqN0', word: 'Brilliant', meaning: 'Xuất sắc, tuyệt vời', pronunciation: '/ˈbrɪliənt/', example: 'What a brilliant idea!' },
  { deckId: 'aPZwGTPgqN0', word: 'Celebrate', meaning: 'Ăn mừng', pronunciation: '/ˈselɪbreɪt/', example: 'We celebrated our 25th wedding anniversary in Florence.' },
  { deckId: 'aPZwGTPgqN0', word: 'Destination', meaning: 'Điểm đến', pronunciation: '/ˌdestɪˈneɪʃn/', example: 'Our luggage was checked all the way through to our final destination.' },
  { deckId: 'aPZwGTPgqN0', word: 'Excellent', meaning: 'Xuất sắc, hoàn hảo', pronunciation: '/ˈeksələnt/', example: 'The food was excellent.' },
  { deckId: 'aPZwGTPgqN0', word: 'Frequent', meaning: 'Thường xuyên', pronunciation: '/ˈfriːkwənt/', example: 'He is a frequent visitor to this country.' },
  { deckId: 'aPZwGTPgqN0', word: 'Guarantee', meaning: 'Đảm bảo, bảo hành', pronunciation: '/ˌɡærənˈtiː/', example: 'We cannot guarantee that our flights will never be delayed.' },
  { deckId: 'aPZwGTPgqN0', word: 'Hesitate', meaning: 'Do dự, ngập ngừng', pronunciation: '/ˈhezɪteɪt/', example: 'She hesitated before replying.' },
  { deckId: 'aPZwGTPgqN0', word: 'Inspire', meaning: 'Truyền cảm hứng', pronunciation: '/ɪnˈspaɪə(r)/', example: 'The actors inspired the kids with their enthusiasm.' },
  { deckId: 'aPZwGTPgqN0', word: 'Journey', meaning: 'Chuyến đi, hành trình', pronunciation: '/ˈdʒɜːni/', example: 'They went on a long train journey across India.' },

  // Deck 4: Phrasal Verbs (10 more cards)
  { deckId: 'deck-4', word: 'Give up', meaning: 'Từ bỏ', pronunciation: '/ɡɪv ʌp/', example: 'She didn’t give up work when she had the baby.' },
  { deckId: 'deck-4', word: 'Look after', meaning: 'Chăm sóc', pronunciation: '/lʊk ˈɑːftə(r)/', example: 'Who’s going to look after the children while you’re away?' },
  { deckId: 'deck-4', word: 'Set up', meaning: 'Thành lập, thiết lập', pronunciation: '/set ʌp/', example: 'She wants to repay the committee for the help she received when setting up in business.' },
  { deckId: 'deck-4', word: 'Take off', meaning: 'Cất cánh, cởi ra', pronunciation: '/teɪk ɒf/', example: 'The plane took off an hour late.' },
  { deckId: 'deck-4', word: 'Work out', meaning: 'Tìm ra giải pháp, tập thể dục', pronunciation: '/wɜːk aʊt/', example: 'I work out regularly to keep fit.' },
  { deckId: 'deck-4', word: 'Bring about', meaning: 'Gây ra, mang lại', pronunciation: '/brɪŋ əˈbaʊt/', example: 'What brought about the change in his attitude?' },
  { deckId: 'deck-4', word: 'Carry out', meaning: 'Thực hiện, tiến hành', pronunciation: '/ˈkæri aʊt/', example: 'Extensive tests have been carried out on the patient.' },
  { deckId: 'deck-4', word: 'Find out', meaning: 'Tìm ra, phát hiện ra', pronunciation: '/faɪnd aʊt/', example: 'We found out later that we had been at the same school.' },
  { deckId: 'deck-4', word: 'Go on', meaning: 'Tiếp tục', pronunciation: '/ɡəʊ ɒn/', example: 'Please go on with what you’re doing and don’t let us interrupt you.' },
  { deckId: 'deck-4', word: 'Make up', meaning: 'Bịa đặt, trang điểm, tạo thành', pronunciation: '/meɪk ʌp/', example: 'He made up some excuse about his daughter being sick.' },

  // Deck 5: Idioms (10 more cards)
  { deckId: 'deck-5', word: 'Bite the bullet', meaning: 'Cắn răng chịu đựng', pronunciation: '/baɪt ðə ˈbʊlɪt/', example: 'I hate going to the dentist, but I’ll just have to bite the bullet.' },
  { deckId: 'deck-5', word: 'Call it a day', meaning: 'Kết thúc công việc (trong ngày)', pronunciation: '/kɔːl ɪt ə deɪ/', example: 'After 14 hours of working, we decided to call it a day.' },
  { deckId: 'deck-5', word: 'Hit the nail on the head', meaning: 'Nói trúng phóc, hoàn toàn chính xác', pronunciation: '/hɪt ðə neɪl ɒn ðə hed/', example: 'You hit the nail on the head there, David.' },
  { deckId: 'deck-5', word: 'Let the cat out of the bag', meaning: 'Vô tình tiết lộ bí mật', pronunciation: '/let ðə kæt aʊt əv ðə bæɡ/', example: 'I wanted it to be a surprise, but my sister let the cat out of the bag.' },
  { deckId: 'deck-5', word: 'Spill the beans', meaning: 'Tiết lộ sự thật, bí mật', pronunciation: '/spɪl ðə biːnz/', example: 'Come on, spill the beans! What did he say?' },
  { deckId: 'deck-5', word: 'Take with a grain of salt', meaning: 'Không hoàn toàn tin tưởng', pronunciation: '/teɪk wɪð ə ɡreɪn əv sɔːlt/', example: 'You have to take everything she says with a grain of salt.' },
  { deckId: 'deck-5', word: 'Through thick and thin', meaning: 'Bất chấp khó khăn', pronunciation: '/θruː θɪk ənd θɪn/', example: 'She has stuck with me through thick and thin.' },
  { deckId: 'deck-5', word: 'Under the weather', meaning: 'Cảm thấy không khỏe', pronunciation: '/ˈʌndə ðə ˈweðə/', example: 'I’m feeling a bit under the weather today.' },
  { deckId: 'deck-5', word: 'Wrap your head around', meaning: 'Hiểu được điều gì đó phức tạp', pronunciation: '/ræp jɔː(r) hed əˈraʊnd/', example: 'I just couldn’t wrap my head around what had happened.' },
  { deckId: 'deck-5', word: 'A blessing in disguise', meaning: 'Trong cái rủi có cái may', pronunciation: '/ə ˈblesɪŋ ɪn dɪsˈɡaɪz/', example: 'Losing that job was a blessing in disguise really.' }
];

newCards.forEach(c => {
  c.id = 'card-' + Math.random().toString(36).substr(2, 9);
  c.status = 'active';
  c.imageUrl = '';
  c.audioUrl = '';
});

d.flashcards.push(...newCards);
fs.writeFileSync('db.json', JSON.stringify(d, null, 2));
console.log("Data generated successfully");
