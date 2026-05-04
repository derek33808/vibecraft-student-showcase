// ============================================================
// student-showcase · Supabase 客户端初始化
// ============================================================

const SUPABASE_URL = 'https://ihkdquydhciabhrwffkb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloa2RxdXlkaGNpYWJocndmZmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTI5MDksImV4cCI6MjA3MjIyODkwOX0.3saXYqHnoamYu2hOp6zsZ1owddvm5Pf2ZkugmBG6C_w';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 浏览器指纹（防重复投票）
function getFingerprint() {
  return window.screen.width + 'x' + window.screen.height + '-' +
    navigator.language + '-' +
    Intl.DateTimeFormat().resolvedOptions().timeZone;
}
