const MARKER_ALIASES = {
  'multiple choice': 'Multiple Choice',
  mcq: 'Multiple Choice',
  'true/false/not given': 'True/False/Not Given',
  'true false not given': 'True/False/Not Given',
  't/f/ng': 'True/False/Not Given',
  tfng: 'True/False/Not Given',
  'yes/no/not given': 'Yes/No/Not Given',
  'yes no not given': 'Yes/No/Not Given',
  'y/n/ng': 'Yes/No/Not Given',
  ynng: 'Yes/No/Not Given',
  'sentence completion': 'Sentence Completion',
  completion: 'Sentence Completion',
  'fill in the blank': 'Sentence Completion',
  'fill in the blanks': 'Sentence Completion',
  'note completion': 'Note/Table/Flow-chart Completion',
  'table completion': 'Note/Table/Flow-chart Completion',
  'flow-chart completion': 'Note/Table/Flow-chart Completion',
  'summary completion': 'Summary Completion',
  'short answer': 'Short-answer Questions',
  'short answer questions': 'Short-answer Questions',
  saq: 'Short-answer Questions',
};

const normalizeMarker = (line = '') => {
  const marker = String(line).trim().match(/^\[([^\]]+)\]$/);
  if (!marker) return null;
  return MARKER_ALIASES[marker[1].trim().toLowerCase()] || null;
};

const getMarkerLabel = (line = '') => {
  const marker = String(line).trim().match(/^\[([^\]]+)\]$/);
  return marker ? marker[1].trim() : '';
};

const getQuestionType = (blockType) => {
  if (blockType === 'Multiple Choice') return 'multiple-choice';
  if (blockType === 'True/False/Not Given' || blockType === 'Yes/No/Not Given') {
    return 'true-false-not-given';
  }
  return 'fill-in-the-blank';
};

const normalizeAnswer = (answer, blockType) => {
  const raw = String(answer || '').trim();
  const key = raw.toLowerCase().replace(/\s+/g, ' ');
  if (['true', 't'].includes(key)) return 'True';
  if (['false', 'f'].includes(key)) return 'False';
  if (['not given', 'ng'].includes(key)) return 'Not Given';
  if (['yes', 'y'].includes(key)) return blockType === 'Yes/No/Not Given' ? 'Yes' : raw;
  if (['no', 'n'].includes(key)) return blockType === 'Yes/No/Not Given' ? 'No' : raw;
  return raw;
};

const createQuestion = (order, text) => ({
  id: `q-${order}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  questionOrder: Number(order),
  text: String(text || '').trim(),
  options: [],
  correctAnswer: '',
  explanation: '',
});

const parseBlockText = (rawText, blockType) => {
  const lines = String(rawText || '').split(/\r?\n/);
  const questions = [];
  let current = null;
  let readingExplanation = false;

  const commit = () => {
    if (current) {
      current.text = current.text.trim();
      current.explanation = current.explanation.trim();
      questions.push(current);
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const questionMatch = line.match(/^(\d+)\.\s*(.*)$/);
    if (questionMatch) {
      commit();
      current = createQuestion(questionMatch[1], questionMatch[2]);
      readingExplanation = false;
      return;
    }

    if (!current) return;

    const explanationMatch = line.match(/^(explanation|giai thich|giải thích)\s*:\s*(.*)$/i);
    if (explanationMatch) {
      current.explanation = explanationMatch[2].trim();
      readingExplanation = true;
      return;
    }

    if (readingExplanation) {
      current.explanation = `${current.explanation} ${line}`.trim();
      return;
    }

    if (blockType === 'Multiple Choice') {
      const optionMatch = line.match(/^(\*)?\s*([A-H])[.)]\s*(.*)$/i);
      if (optionMatch) {
        const text = optionMatch[3].trim();
        current.options.push(text);
        if (optionMatch[1]) {
          current.correctAnswer = text;
        }
      }
      return;
    }

    if (line.startsWith('*')) {
      current.correctAnswer = normalizeAnswer(line.slice(1), blockType);
      return;
    }

    if (!current.correctAnswer && /^(true|false|not given|yes|no)$/i.test(line)) {
      current.correctAnswer = normalizeAnswer(line, blockType);
      return;
    }

    current.text = `${current.text} ${line}`.trim();
  });

  commit();
  return questions;
};

const validateQuestions = (questions, blockType) => {
  const errors = [];
  if (!questions.length) {
    errors.push('Khong tim thay cau hoi. Moi cau can bat dau bang "1.", "2.", ...');
  }

  questions.forEach((question) => {
    const prefix = `Cau ${question.questionOrder || '?'}`;
    if (!question.text) errors.push(`${prefix}: thieu noi dung cau hoi.`);
    if (blockType === 'Multiple Choice' && question.options.length < 2) {
      errors.push(`${prefix}: multiple choice can it nhat 2 option.`);
    }
    if (!question.correctAnswer) {
      errors.push(`${prefix}: thieu dap an dung, hay dat dau * truoc dap an.`);
    }
  });

  return errors;
};

export const parseAdvancedQuestionText = (rawText) => {
  const text = String(rawText || '').trim();
  if (!text) {
    return { blocks: [], errors: ['Noi dung nhap nhanh dang trong.'] };
  }

  const lines = text.split(/\r?\n/);
  if (!normalizeMarker(lines[0])) {
    return {
      blocks: [],
      errors: ['Dong dau tien phai la marker hop le, vi du [MCQ], [T/F/NG], [NOTE COMPLETION].'],
    };
  }

  const chunks = [];
  let current = null;

  lines.forEach((line, index) => {
    const normalized = normalizeMarker(line);
    const markerLike = /^\[[^\]]+\]$/.test(line.trim());
    if (markerLike && !normalized) {
      if (current) chunks.push(current);
      current = null;
      chunks.push({ unsupported: getMarkerLabel(line), line: index + 1 });
      return;
    }
    if (normalized) {
      if (current) chunks.push(current);
      current = { type: normalized, lines: [] };
      return;
    }
    if (current) current.lines.push(line);
  });

  if (current) chunks.push(current);

  const blocks = [];
  const errors = [];

  chunks.forEach((chunk) => {
    if (chunk.unsupported) {
      errors.push(`Marker [${chunk.unsupported}] o dong ${chunk.line} chua duoc ho tro.`);
      return;
    }

    const questions = parseBlockText(chunk.lines.join('\n'), chunk.type);
    errors.push(...validateQuestions(questions, chunk.type));
    if (!questions.length) return;

    const orders = questions.map((question) => Number(question.questionOrder)).filter(Boolean);
    const first = Math.min(...orders);
    const last = Math.max(...orders);
    blocks.push({
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: chunk.type,
      rendererType: getQuestionType(chunk.type),
      range: Number.isFinite(first) && Number.isFinite(last) ? `${first}-${last}` : `1-${questions.length}`,
      questions,
    });
  });

  return { blocks, errors: errors.length ? errors : null };
};

export const toQuestionRecordsFromBlocks = ({
  blocks = [],
  skill,
  referenceId,
  referenceType,
  referenceLabel,
  passage = '',
  startOrder = 1,
  testId,
}) => {
  const records = [];
  let order = startOrder;

  blocks.forEach((block, blockIndex) => {
    const type = block.rendererType || getQuestionType(block.type);
    const options = type === 'true-false-not-given'
      ? (block.type === 'Yes/No/Not Given' ? ['Yes', 'No', 'Not Given'] : ['True', 'False', 'Not Given'])
      : [];

    (block.questions || []).forEach((question, questionIndex) => {
      records.push({
        id: `${referenceId}-${block.id || blockIndex}-${question.id || questionIndex}`,
        testId,
        skill,
        referenceId,
        referenceType,
        type,
        order,
        questionText: question.text || question.questionText || '',
        prompt: question.text || question.questionText || '',
        options: type === 'multiple-choice' ? (question.options || []) : options,
        answer: question.correctAnswer || question.answer || '',
        explanation: question.explanation || '',
        passage,
        section: referenceType === 'section' ? referenceLabel : undefined,
        score: 1,
      });
      order += 1;
    });
  });

  return { records, nextOrder: order };
};

export const buildObjectiveQuestionsFromConfig = (test) => {
  const config = test?.testConfig || {};
  let order = 1;
  let records = [];

  if (test?.skill === 'Reading') {
    (config.passages || []).forEach((passage) => {
      const built = toQuestionRecordsFromBlocks({
        blocks: passage.blocks || [],
        skill: 'Reading',
        referenceId: passage.id,
        referenceType: 'passage',
        referenceLabel: passage.title,
        passage: passage.content || '',
        startOrder: order,
        testId: test.id,
      });
      records = records.concat(built.records);
      order = built.nextOrder;
    });
  }

  if (test?.skill === 'Listening') {
    (config.sections || []).forEach((section) => {
      const built = toQuestionRecordsFromBlocks({
        blocks: section.blocks || [],
        skill: 'Listening',
        referenceId: section.id,
        referenceType: 'section',
        referenceLabel: section.title,
        startOrder: order,
        testId: test.id,
      });
      records = records.concat(built.records);
      order = built.nextOrder;
    });
  }

  return records;
};

export const countQuestionsInConfig = (testConfig = {}) => {
  const passageCount = (testConfig.passages || []).reduce(
    (sum, passage) => sum + (passage.blocks || []).reduce((blockSum, block) => blockSum + (block.questions || []).length, 0),
    0
  );
  const sectionCount = (testConfig.sections || []).reduce(
    (sum, section) => sum + (section.blocks || []).reduce((blockSum, block) => blockSum + (block.questions || []).length, 0),
    0
  );
  const writingCount = ['task1', 'task2'].reduce((sum, taskKey) => {
    const task = testConfig[taskKey] || {};
    return sum + (String(task.prompt || '').trim() ? 1 : 0);
  }, 0);
  const speakingCount = (testConfig.parts || []).reduce((sum, part) => {
    if (Number(part.partNumber) === 2) {
      return sum + (String(part.cueCard || '').trim() ? 1 : 0);
    }
    return sum + (part.questions || []).filter((question) => String(question.text || '').trim()).length;
  }, 0);

  return passageCount + sectionCount + writingCount + speakingCount;
};
