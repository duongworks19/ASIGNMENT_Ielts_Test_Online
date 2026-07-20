import { buildObjectiveQuestionsFromConfig, countQuestionsInConfig } from './ieltsQuestionBlocks';

export const IELTS_SKILLS = ['Reading', 'Listening', 'Writing', 'Speaking'];

export const SKILL_DEFAULTS = {
  Reading: { durationMinutes: 60, totalQuestions: 40 },
  Listening: { durationMinutes: 40, totalQuestions: 40 },
  Writing: { durationMinutes: 60, totalQuestions: 2 },
  Speaking: { durationMinutes: 15, totalQuestions: 3 },
};

export const getLegacyNumericId = (id) => {
  const match = String(id || '').match(/^test-0*(\d+)$/);
  if (!match) return null;
  return String(Number(match[1]));
};

export const matchesTestId = (questionTestId, testId) => {
  const left = String(questionTestId);
  const right = String(testId);
  return left === right || left === getLegacyNumericId(right);
};

export const buildDefaultTestConfig = (skill) => {
  if (skill === 'Reading') {
    return {
      passages: [
        { id: 'passage-1', title: 'Passage 1', content: '', instruction: '', imageUrl: '', defaultRange: '1-13', blocks: [], order: 1 },
        { id: 'passage-2', title: 'Passage 2', content: '', instruction: '', imageUrl: '', defaultRange: '14-26', blocks: [], order: 2 },
        { id: 'passage-3', title: 'Passage 3', content: '', instruction: '', imageUrl: '', defaultRange: '27-40', blocks: [], order: 3 },
      ],
    };
  }

  if (skill === 'Listening') {
    return {
      audioUrl: '',
      audioPolicy: 'allow-replay',
      sections: [1, 2, 3, 4].map((order) => ({
        id: `section-${order}`,
        title: `Section ${order}`,
        instruction: `Listen and answer questions for Section ${order}.`,
        transcript: '',
        showTranscript: false,
        defaultRange: `${((order - 1) * 10) + 1}-${order * 10}`,
        audioUrl: '',
        blocks: [],
        order,
      })),
    };
  }

  if (skill === 'Writing') {
    return {
      task1: {
        id: 'task-1',
        prompt: '',
        imageUrl: '',
        minimumWords: 150,
      },
      task2: {
        id: 'task-2',
        prompt: '',
        minimumWords: 250,
      },
      bandCriteria: 'Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy',
    };
  }

  if (skill === 'Speaking') {
    return {
      parts: [
        {
          id: 'speaking-part-1',
          partNumber: 1,
          title: 'Introduction & Interview',
          questions: [
            { id: 'sp-q-1', text: '', answerSeconds: 45 },
          ],
        },
        {
          id: 'speaking-part-2',
          partNumber: 2,
          title: 'Cue Card',
          cueCard: '',
          bulletPrompts: ['', '', ''],
          prepSeconds: 60,
          answerSeconds: 120,
        },
        {
          id: 'speaking-part-3',
          partNumber: 3,
          title: 'Discussion',
          questions: [
            { id: 'sp-q-2', text: '', answerSeconds: 60 },
          ],
        },
      ],
    };
  }

  return {};
};

export const normalizeTest = (test = {}) => {
  const skill = test.skill || 'Reading';
  const defaults = SKILL_DEFAULTS[skill] || SKILL_DEFAULTS.Reading;
  const testMode = test.testMode || (test.courseId ? 'course' : 'free');
  return {
    ...test,
    skill,
    testMode,
    courseId: test.courseId || '',
    status: test.status || 'published',
    practiceMode: test.practiceMode || 'exam',
    attemptLimit: Number(test.attemptLimit ?? (testMode === 'free' ? 3 : 0)),
    durationMinutes: Number(test.durationMinutes || defaults.durationMinutes),
    totalQuestions: Number(test.totalQuestions || defaults.totalQuestions),
    bandScale: test.bandScale || 'IELTS 0-9',
    description: test.description || '',
    testConfig: test.testConfig || buildDefaultTestConfig(skill),
  };
};

export const getReferenceOptions = (test) => {
  const normalized = normalizeTest(test);
  const config = normalized.testConfig || {};

  if (normalized.skill === 'Reading') {
    return (config.passages || []).map((passage) => ({
      id: passage.id,
      type: 'passage',
      label: passage.title || `Passage ${passage.order || ''}`,
    }));
  }

  if (normalized.skill === 'Listening') {
    return (config.sections || []).map((section) => ({
      id: section.id,
      type: 'section',
      label: section.title || `Section ${section.order || ''}`,
    }));
  }

  if (normalized.skill === 'Speaking') {
    return (config.parts || []).map((part) => ({
      id: part.id,
      type: 'part',
      label: `Part ${part.partNumber}: ${part.title || ''}`,
    }));
  }

  if (normalized.skill === 'Writing') {
    return [
      { id: 'task-1', type: 'task', label: 'Writing Task 1' },
      { id: 'task-2', type: 'task', label: 'Writing Task 2' },
    ];
  }

  return [];
};

export const getPassageForQuestion = (test, question) => {
  const normalized = normalizeTest(test);
  const passages = normalized.testConfig?.passages || [];
  const passage = passages.find((item) => item.id === question.referenceId);
  return passage?.content || question.passage || '';
};

export const getSectionForQuestion = (test, question) => {
  const normalized = normalizeTest(test);
  const sections = normalized.testConfig?.sections || [];
  return sections.find((item) => item.id === question.referenceId) || null;
};

export const buildWritingQuestions = (test) => {
  const normalized = normalizeTest(test);
  const config = normalized.testConfig || {};
  const task1 = config.task1 || {};
  const task2 = config.task2 || {};

  return [
    {
      id: 'task1',
      testId: normalized.id,
      skill: 'Writing',
      type: 'writing-task',
      referenceType: 'task',
      referenceId: task1.id || 'task-1',
      taskNumber: 1,
      prompt: task1.prompt || 'Writing Task 1 prompt is not configured yet.',
      questionText: task1.prompt || '',
      imageUrl: task1.imageUrl || '',
      minWords: Number(task1.minimumWords || 150),
    },
    {
      id: 'task2',
      testId: normalized.id,
      skill: 'Writing',
      type: 'writing-task',
      referenceType: 'task',
      referenceId: task2.id || 'task-2',
      taskNumber: 2,
      prompt: task2.prompt || 'Writing Task 2 prompt is not configured yet.',
      questionText: task2.prompt || '',
      minWords: Number(task2.minimumWords || 250),
    },
  ];
};

export const buildSpeakingQuestions = (test) => {
  const normalized = normalizeTest(test);
  const parts = normalized.testConfig?.parts || [];
  const result = [];

  parts.forEach((part) => {
    if (part.partNumber === 2) {
      result.push({
        id: 'part2',
        testId: normalized.id,
        skill: 'Speaking',
        type: 'speaking-part',
        referenceType: 'part',
        referenceId: part.id,
        part: 2,
        prompt: part.cueCard || 'Cue card is not configured yet.',
        questionText: part.cueCard || '',
        subPoints: (part.bulletPrompts || []).filter(Boolean),
        prepSeconds: Number(part.prepSeconds || 60),
        answerSeconds: Number(part.answerSeconds || 120),
      });
      return;
    }

    (part.questions || []).forEach((question, index) => {
      result.push({
        id: question.id || `${part.id}-q-${index + 1}`,
        testId: normalized.id,
        skill: 'Speaking',
        type: 'speaking-part',
        referenceType: 'part',
        referenceId: part.id,
        part: part.partNumber,
        prompt: question.text || '',
        questionText: question.text || '',
        answerSeconds: Number(question.answerSeconds || 45),
      });
    });
  });

  return result;
};

export const buildConfigQuestions = buildObjectiveQuestionsFromConfig;

export const countEmbeddedQuestions = (test = {}) => countQuestionsInConfig(test.testConfig || {});

export const getAnswerValue = (answers = {}, question, index) => {
  if (!question) return '';
  if (question.skill === 'Writing' || question.type === 'writing-task') {
    return answers[question.id] || answers[`task${question.taskNumber}`] || answers[index] || '';
  }
  if (question.skill === 'Speaking' || question.type === 'speaking-part') {
    if (question.part === 2) {
      const answer = answers.part2 || answers[question.id] || answers[index];
      return typeof answer === 'object' ? answer.value || answer.audioUrl || '' : answer || '';
    }
    const partKey = `part${question.part || 1}`;
    const answer = answers[partKey]?.[question.id] || answers[question.id] || answers[index];
    return typeof answer === 'object' ? answer.value || answer.audioUrl || '' : answer || '';
  }
  return answers[question.id] ?? answers[index] ?? '';
};

export const setAnswerValue = (answers = {}, question, value) => {
  if (question.skill === 'Writing' || question.type === 'writing-task') {
    return {
      ...answers,
      [question.id]: value,
    };
  }

  if (question.skill === 'Speaking' || question.type === 'speaking-part') {
    if (question.part === 2) {
      return {
        ...answers,
        part2: {
          type: 'text',
          value,
        },
      };
    }
    const partKey = `part${question.part || 1}`;
    return {
      ...answers,
      [partKey]: {
        ...(answers[partKey] || {}),
        [question.id]: {
          type: 'text',
          value,
        },
      },
    };
  }

  return {
    ...answers,
    [question.id]: value,
  };
};

export const countAnswered = (answers = {}, questions = []) => {
  return questions.filter((question, index) => {
    const value = getAnswerValue(answers, question, index);
    return String(value || '').trim().length > 0;
  }).length;
};

export const isAutoGradedSkill = (skill) => !['Writing', 'Speaking'].includes(skill);

export const isCorrectAnswer = (question, studentAnswer) => {
  if (!studentAnswer && studentAnswer !== 0) return false;
  return String(studentAnswer).trim().toLowerCase() === String(question.answer || '').trim().toLowerCase();
};

export const calculateObjectiveScore = (questions = [], answers = {}) => {
  let correct = 0;
  questions.forEach((question, index) => {
    if (isCorrectAnswer(question, getAnswerValue(answers, question, index))) {
      correct += 1;
    }
  });
  return {
    correct,
    total: questions.length,
  };
};

export const isFreeAccessibleTest = (test) => {
  const normalized = normalizeTest(test);
  return normalized.testMode === 'free' || Boolean(normalized.isFreePreview);
};

export const getOrCreateGuestId = () => {
  const key = 'ielts_guest_id';
  let guestId = localStorage.getItem(key);
  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, guestId);
  }
  return guestId;
};

export const getAttemptOwner = (user) => {
  if (user?.id) {
    return { userId: user.id, guestId: null };
  }
  return { userId: null, guestId: getOrCreateGuestId() };
};

export const getAttemptExpiredAt = (startTime, durationMinutes) => {
  return new Date(new Date(startTime).getTime() + Number(durationMinutes || 60) * 60 * 1000).toISOString();
};

export const isAttemptCounted = (attempt) => {
  if (!attempt) return false;
  if (attempt.status === 'completed') return true;
  if (attempt.status === 'expired') return false;
  if (attempt.status === 'in-progress') {
    if (!attempt.expiredAt) return true;
    return new Date(attempt.expiredAt).getTime() > Date.now();
  }
  return false;
};
