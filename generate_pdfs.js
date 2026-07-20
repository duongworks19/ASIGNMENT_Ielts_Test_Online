const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

const libraryDir = path.join(__dirname, 'public', 'library');
if (!fs.existsSync(libraryDir)) {
  fs.mkdirSync(libraryDir, { recursive: true });
}

const filesToGenerate = [
  {
    filename: 'cambridge-18.pdf',
    title: 'Cambridge IELTS 18 Academic - Full PDF',
    content: 'Đây là bản Demo giả lập của tài liệu Cambridge IELTS 18 Academic.\n\nTài liệu bao gồm 4 phần Test đầy đủ cho các kỹ năng: Listening, Reading, Writing, và Speaking.\n\nPhần bài tập Reading:...\nPhần bài tập Writing:...\n\n(Dữ liệu mẫu dành cho đồ án FER202)'
  },
  {
    filename: 'simons-ideas.pdf',
    title: "Simon's Writing Task 2 Idea Compilation",
    content: 'Đây là bản Demo giả lập của tài liệu Simon\'s Writing Task 2 Idea Compilation.\n\nTổng hợp các ý tưởng (ideas) siêu xịn để làm bài IELTS Writing Task 2, được biên soạn từ thầy Simon.\n\nChủ đề 1: Education\nChủ đề 2: Environment\n\n(Dữ liệu mẫu dành cho đồ án FER202)'
  },
  {
    filename: 'speaking-p1.pdf',
    title: 'Speaking Part 1 Common Questions 2024',
    content: 'Đây là bản Demo giả lập tài liệu Speaking Part 1 Common Questions 2024.\n\nTổng hợp các câu hỏi phổ biến và cách trả lời mẫu:\n1. Do you work or are you a student?\n2. Where do you live?\n\n(Dữ liệu mẫu dành cho đồ án FER202)'
  },
  {
    filename: 'internal-material.pdf',
    title: 'Internal Teacher Material (Not for Students)',
    content: 'TÀI LIỆU LƯU HÀNH NỘI BỘ\n\nĐây là tài liệu tuyệt mật dành riêng cho Giáo viên.\nNếu bạn là học sinh, bạn sẽ không thể thấy nội dung này trên hệ thống thư viện.\n\n(Dữ liệu mẫu dành cho đồ án FER202)'
  }
];

filesToGenerate.forEach(file => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(path.join(libraryDir, file.filename)));
  
  // Custom font if needed, but standard font will do if we just use basic ASCII characters or let pdfkit handle it.
  // Pdfkit standard fonts don't support Vietnamese well out of the box without a custom TTF.
  // To avoid font issues, we can just use a standard TTF if available, but for now we'll write without Vietnamese accents or rely on it supporting basic chars. Wait, pdfkit fails on Vietnamese without a font.
  // Let's strip Vietnamese accents for safety just in case, or let's try if it works.
  // Actually, I'll provide a font path just in case, or just strip accents.
  
  const stripVietnameseTones = (str) => {
      str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
      str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
      str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
      str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
      str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
      str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
      str = str.replace(/đ/g,"d");
      str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
      str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
      str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
      str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
      str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
      str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
      str = str.replace(/Đ/g, "D");
      return str;
  }

  doc.fontSize(20).text(stripVietnameseTones(file.title), { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(stripVietnameseTones(file.content), { align: 'left' });
  doc.end();
});

console.log('PDFs generated successfully in public/library');
