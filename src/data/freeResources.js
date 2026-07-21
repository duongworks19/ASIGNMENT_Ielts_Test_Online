// ============================================================
// DỮ LIỆU TÀI NGUYÊN MIỄN PHÍ (GUEST)
// Nội dung học IELTS bằng tiếng Việt, dùng chung cho:
//  - CourseList.jsx  (trang /courses - danh sách tài nguyên)
//  - ResourceDetail.jsx (trang /resources/:id - bài viết chi tiết)
// Nội dung tĩnh nên đặt trong data module thay vì database.json để giàu nội dung.
// ============================================================

export const RESOURCE_SKILLS = ['Tất cả', 'Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary', 'Grammar'];

export const freeResources = [
  {
    id: 'reading-skimming-scanning',
    title: 'Skimming & Scanning: đọc nhanh để không hết giờ',
    skill: 'Reading',
    type: 'Hướng dẫn',
    level: 'Band 5.0 - 6.5',
    readingTime: 6,
    date: '10/06/2026',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Hai kỹ thuật đọc cốt lõi giúp bạn xử lý 3 đoạn văn trong 60 phút mà không bị cuốn vào từng chữ.',
    content: [
      {
        heading: 'Vì sao bạn hay hết giờ ở Reading?',
        paragraphs: [
          'Lỗi phổ biến nhất là cố đọc và hiểu từng câu ngay từ đầu. Bài thi Reading có khoảng 2.000 từ cho mỗi passage, nếu đọc kỹ toàn bộ bạn sẽ không còn thời gian trả lời 13-14 câu hỏi.',
          'Giải pháp là tách quá trình đọc thành hai bước: đọc lướt để nắm bố cục (skimming) và đọc quét để tìm thông tin cụ thể (scanning).',
        ],
      },
      {
        heading: 'Skimming - đọc lướt lấy ý chính',
        paragraphs: [
          'Skimming giúp bạn nắm chủ đề chung và vị trí các ý lớn trong vòng 2-3 phút trước khi làm câu hỏi.',
        ],
        list: [
          'Đọc kỹ câu đầu và câu cuối của mỗi đoạn (thường chứa ý chính).',
          'Lướt qua phần giữa, chỉ dừng ở những từ in nghiêng, số liệu hoặc tên riêng.',
          'Ghi 1-2 từ khóa bên lề mỗi đoạn để biết "đoạn này nói về cái gì".',
        ],
      },
      {
        heading: 'Scanning - đọc quét tìm chi tiết',
        paragraphs: [
          'Khi đã biết đại ý từng đoạn, bạn dùng scanning để nhảy thẳng tới vùng chứa đáp án thay vì đọc lại từ đầu.',
        ],
        list: [
          'Gạch chân từ khóa trong câu hỏi (tên riêng, năm, con số, thuật ngữ).',
          'Đưa mắt quét theo hình chữ Z để tìm đúng từ khóa hoặc từ đồng nghĩa.',
          'Đọc kỹ 2-3 câu quanh từ khóa để xác nhận đáp án.',
        ],
      },
      {
        heading: 'Mẹo luyện tập',
        tip: 'Tập skim một bài báo tiếng Anh mỗi ngày và tự tóm tắt trong 1 câu. Sau 2 tuần tốc độ đọc của bạn sẽ cải thiện rõ rệt.',
      },
    ],
  },
  {
    id: 'reading-true-false-notgiven',
    title: 'Chinh phục dạng True / False / Not Given',
    skill: 'Reading',
    type: 'Hướng dẫn',
    level: 'Band 5.5 - 7.0',
    readingTime: 7,
    date: '08/06/2026',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Phân biệt rõ False và Not Given là chìa khóa lấy trọn điểm dạng câu hỏi gây nhầm lẫn nhất của Reading.',
    content: [
      {
        heading: 'Hiểu đúng 3 lựa chọn',
        list: [
          'TRUE: thông tin trong câu hỏi khớp với thông tin trong bài.',
          'FALSE: thông tin trong câu hỏi mâu thuẫn với thông tin trong bài.',
          'NOT GIVEN: bài đọc không hề nhắc tới thông tin này, không thể xác nhận đúng hay sai.',
        ],
      },
      {
        heading: 'Quy tắc vàng',
        paragraphs: [
          'Đừng dùng kiến thức bên ngoài hay suy đoán. Chỉ dựa vào đúng những gì văn bản viết ra.',
          'Nếu bạn phải "tưởng tượng thêm" thì khả năng cao đáp án là NOT GIVEN.',
        ],
      },
      {
        heading: 'Quy trình 4 bước',
        list: [
          'Gạch chân từ khóa trong câu hỏi.',
          'Scan để tìm vùng chứa từ khóa trong bài.',
          'So sánh nghĩa câu hỏi với câu trong bài, chú ý các từ chỉ mức độ (all, some, always, never).',
          'Quyết định: khớp (TRUE), trái ngược (FALSE) hay không có (NOT GIVEN).',
        ],
      },
      {
        heading: 'Bẫy thường gặp',
        tip: 'Các từ như "only", "all", "never" thường biến một câu TRUE thành FALSE. Hãy đọc thật kỹ những từ chỉ định lượng này.',
      },
    ],
  },
  {
    id: 'listening-keywords',
    title: 'Bắt keyword và từ đồng nghĩa trong Listening',
    skill: 'Listening',
    type: 'Hướng dẫn',
    level: 'Band 5.0 - 6.5',
    readingTime: 5,
    date: '07/06/2026',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Đáp án Listening hiếm khi lặp lại đúng từ trong câu hỏi. Đây là cách dự đoán paraphrase trước khi nghe.',
    content: [
      {
        heading: 'Tận dụng thời gian đọc câu hỏi',
        paragraphs: [
          'Trước mỗi phần nghe luôn có vài giây để đọc câu hỏi. Hãy dùng khoảng thời gian quý giá này để gạch chân từ khóa và dự đoán dạng thông tin cần điền (số, tên, danh từ...).',
        ],
      },
      {
        heading: 'Luôn nghĩ tới từ đồng nghĩa',
        paragraphs: [
          'Người nói sẽ paraphrase chứ không đọc nguyên văn câu hỏi. Ví dụ câu hỏi ghi "children" thì audio có thể nói "kids" hoặc "young people".',
        ],
        list: [
          'buy → purchase',
          'big → enormous / huge',
          'start → begin / launch',
          'help → assist / support',
        ],
      },
      {
        heading: 'Cẩn thận với bẫy sửa lời',
        tip: 'Người nói hay đổi ý: "It is on Tuesday... sorry, actually on Wednesday." Đáp án đúng luôn là thông tin được nói SAU cùng.',
      },
    ],
  },
  {
    id: 'listening-numbers-dates',
    title: 'Nghe chính xác số, ngày tháng và địa chỉ',
    skill: 'Listening',
    type: 'Bài luyện tập',
    level: 'Band 4.5 - 6.0',
    readingTime: 5,
    date: '05/06/2026',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Section 1 luôn có số điện thoại, ngày tháng, mã bưu chính. Sai chính tả là mất điểm oan.',
    content: [
      {
        heading: 'Số và cách đọc dễ nhầm',
        list: [
          '"fifteen" (15) và "fifty" (50) - chú ý trọng âm ở cuối hay đầu.',
          '"double two" nghĩa là 22, "triple five" là 555.',
          'Số 0 trong tiếng Anh-Anh thường đọc là "oh".',
        ],
      },
      {
        heading: 'Ngày tháng',
        paragraphs: [
          'Người Anh nói "the third of May", người Mỹ nói "May third". Hãy quen với cả hai cách để không bị lỡ thông tin.',
        ],
      },
      {
        heading: 'Quy tắc chính tả',
        tip: 'Khi nghe đánh vần địa chỉ hay tên riêng, hãy viết hoa chữ cái đầu và kiểm tra phụ âm đôi (Hall, Bann...). Sai một chữ là mất trọn điểm.',
      },
    ],
  },
  {
    id: 'writing-task2-structure',
    title: 'Khung bài Writing Task 2 đạt Band 6.5+',
    skill: 'Writing',
    type: 'Hướng dẫn',
    level: 'Band 6.0 - 7.5',
    readingTime: 8,
    date: '04/06/2026',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Một dàn bài 4 đoạn rõ ràng giúp bạn ghi điểm Coherence & Cohesion mà không cần ý tưởng quá phức tạp.',
    content: [
      {
        heading: 'Cấu trúc 4 đoạn chuẩn',
        list: [
          'Mở bài: paraphrase đề + nêu quan điểm / định hướng bài viết.',
          'Thân bài 1: ý chính thứ nhất + giải thích + ví dụ.',
          'Thân bài 2: ý chính thứ hai + giải thích + ví dụ.',
          'Kết bài: tóm tắt lại quan điểm, không thêm ý mới.',
        ],
      },
      {
        heading: 'Mỗi đoạn thân bài theo công thức PEEL',
        list: [
          'Point: nêu luận điểm bằng một câu chủ đề rõ ràng.',
          'Explain: giải thích vì sao luận điểm đó đúng.',
          'Example: đưa ví dụ cụ thể để thuyết phục.',
          'Link: nối lại với câu hỏi của đề bài.',
        ],
      },
      {
        heading: 'Phân bổ thời gian',
        paragraphs: [
          'Dành 40 phút cho Task 2: 5 phút lập dàn ý, 30 phút viết, 5 phút soát lỗi ngữ pháp và chính tả.',
        ],
      },
      {
        heading: 'Lời khuyên',
        tip: 'Đừng cố dùng từ "đao to búa lớn" nếu chưa chắc nghĩa. Một câu đơn giản đúng ngữ pháp luôn ăn điểm hơn một câu phức sai be bét.',
      },
    ],
  },
  {
    id: 'speaking-part1-fluency',
    title: 'Trả lời trôi chảy IELTS Speaking Part 1',
    skill: 'Speaking',
    type: 'Hướng dẫn',
    level: 'Band 5.0 - 7.0',
    readingTime: 6,
    date: '02/06/2026',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Part 1 là phần "khởi động". Trả lời đúng độ dài và tự nhiên sẽ tạo ấn tượng tốt với giám khảo.',
    content: [
      {
        heading: 'Trả lời bao nhiêu là đủ?',
        paragraphs: [
          'Đừng trả lời cụt lủn một từ, cũng đừng nói lê thê. Lý tưởng là 2-3 câu: một câu trả lời trực tiếp, một câu mở rộng lý do hoặc ví dụ.',
        ],
      },
      {
        heading: 'Công thức Answer + Reason + Example',
        paragraphs: [
          'Ví dụ với câu hỏi "Do you like coffee?":',
        ],
        list: [
          'Answer: "Yes, I absolutely love coffee."',
          'Reason: "It helps me stay focused during long study sessions."',
          'Example: "I usually grab a cup of latte before my morning classes."',
        ],
      },
      {
        heading: 'Cụm từ câu giờ tự nhiên',
        list: [
          '"That\'s a good question, let me think..."',
          '"Well, to be honest..."',
          '"I\'d say that..."',
        ],
      },
      {
        heading: 'Lưu ý',
        tip: 'Giám khảo chấm sự trôi chảy, không chấm việc bạn nói thật hay bịa. Cứ tự tin kể một ví dụ hợp lý dù không có thật.',
      },
    ],
  },
  {
    id: 'vocabulary-education-topic',
    title: 'Từ vựng Academic chủ đề Education',
    skill: 'Vocabulary',
    type: 'Từ vựng',
    level: 'Band 6.0 - 7.5',
    readingTime: 5,
    date: '31/05/2026',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Bộ từ vựng học thuật chủ đề Giáo dục thường gặp ở cả Writing Task 2 lẫn Speaking Part 3.',
    content: [
      {
        heading: 'Cụm từ ghi điểm',
        list: [
          'compulsory education - giáo dục bắt buộc',
          'tuition fees - học phí',
          'critical thinking - tư duy phản biện',
          'lifelong learning - học tập suốt đời',
          'academic performance - thành tích học tập',
          'vocational training - đào tạo nghề',
        ],
      },
      {
        heading: 'Áp dụng vào câu',
        paragraphs: [
          '"Compulsory education ensures that every child has access to basic knowledge regardless of their background."',
          '"Many argue that vocational training is just as valuable as a university degree."',
        ],
      },
      {
        heading: 'Cách học hiệu quả',
        tip: 'Học từ vựng theo cụm (collocation) thay vì từ lẻ. Khi cần, bạn sẽ bật ra cả cụm một cách tự nhiên.',
      },
    ],
  },
  {
    id: 'grammar-complex-sentences',
    title: 'Dùng câu phức để nâng band Writing',
    skill: 'Grammar',
    type: 'Hướng dẫn',
    level: 'Band 6.0 - 7.5',
    readingTime: 6,
    date: '29/05/2026',
    image: 'https://images.unsplash.com/photo-1503945438517-f65904a52ce6?auto=format&fit=crop&w=900&q=80',
    excerpt:
      'Tiêu chí Grammatical Range yêu cầu bạn dùng đa dạng cấu trúc. Câu phức là cách nhanh nhất để thể hiện điều đó.',
    content: [
      {
        heading: 'Vì sao cần câu phức?',
        paragraphs: [
          'Nếu cả bài chỉ toàn câu đơn, bạn khó vượt Band 6.0 ở tiêu chí ngữ pháp. Câu phức cho thấy bạn kiểm soát được nhiều cấu trúc khác nhau.',
        ],
      },
      {
        heading: 'Ba loại mệnh đề nên dùng',
        list: [
          'Mệnh đề quan hệ: "Students who study abroad often become more independent."',
          'Mệnh đề điều kiện: "If governments invested more in education, literacy rates would rise."',
          'Mệnh đề trạng ngữ: "Although technology saves time, it can reduce face-to-face interaction."',
        ],
      },
      {
        heading: 'Đừng lạm dụng',
        tip: 'Xen kẽ câu đơn và câu phức. Viết câu nào quá dài tới mức người đọc lạc ý thì nên tách ra cho rõ ràng.',
      },
    ],
  },
];

export function getResourceById(id) {
  return freeResources.find((item) => item.id === id) || null;
}

export function getRelatedResources(resource, limit = 3) {
  if (!resource) return [];
  return freeResources
    .filter((item) => item.id !== resource.id && item.skill === resource.skill)
    .slice(0, limit);
}
