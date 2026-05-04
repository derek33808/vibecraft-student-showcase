// ============================================================
// student-showcase · 学生作品数据配置
// ============================================================

const STUDENTS = [
  {
    id: 'corum',
    name: 'Corum',
    day1: {
      label: 'Day 1 · 个人主页',
      url: 'https://corum-website.netlify.app/',
      ready: true
    },
    day2: {
      label: 'Day 2 · 大游戏',
      url: null,
      ready: false
    }
  },
  {
    id: 'isaac',
    name: 'Isaac',
    day1: {
      label: 'Day 1 · 个人主页',
      url: 'https://shiny-buttercream-a762db.netlify.app/',
      ready: true
    },
    day2: {
      label: 'Day 2 · Escape From Max',
      url: 'https://escape-from-max-game.netlify.app/',
      ready: true
    }
  },
  {
    id: 'langer',
    name: 'Langer',
    day1: {
      label: 'Day 1 · 个人主页',
      url: 'https://langer-homepage.netlify.app/',
      ready: true
    },
    day2: {
      label: 'Day 2 · F1 赛车游戏',
      url: 'https://langer-f1-game.netlify.app/',
      ready: true
    }
  },
  {
    id: 'max',
    name: 'Max',
    day1: {
      label: 'Day 1 · 个人主页',
      url: 'https://max-website-nine.vercel.app/',
      ready: true
    },
    day2: {
      label: 'Day 2 · Haunted Village',
      url: 'https://haunted-village.vercel.app',
      ready: true
    }
  }
];

// ============================================================
// localStorage 数据读写
// ============================================================

const STORAGE_KEY = 'vibecraft_showcase';

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn('数据读取失败，重置为空');
    }
  }
  return {
    votes: { corum: 0, isaac: 0, langer: 0, max: 0 },
    voted: { corum: false, isaac: false, langer: false, max: false },
    comments: { corum: [], isaac: [], langer: [], max: [] }
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 初始化（确保即使数据不完整也有默认结构）
function initData() {
  const data = loadData();
  const defaults = { corum: 0, isaac: 0, langer: 0, max: 0 };
  data.votes = { ...defaults, ...data.votes };
  data.voted = { corum: false, isaac: false, langer: false, max: false, ...data.voted };
  data.comments = {
    corum: data.comments?.corum || [],
    isaac: data.comments?.isaac || [],
    langer: data.comments?.langer || [],
    max: data.comments?.max || []
  };
  return data;
}
