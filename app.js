// ============================================================
// student-showcase · 交互逻辑
// ============================================================

let appData;

// ========== 初始化 ==========
function init() {
  appData = initData();
  renderCards();
}

// ========== 渲染所有学生卡片 ==========
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';

  STUDENTS.forEach((student) => {
    const card = createCard(student);
    grid.appendChild(card);
  });
}

// ========== 创建单个学生卡片 ==========
function createCard(student) {
  const card = document.createElement('div');
  card.className = 'card';

  // --- 头像 + 姓名 ---
  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = '<div class="card-avatar">' + student.name[0] + '</div>' +
    '<span class="card-name">' + student.name + '</span>';

  // --- Day1 / Day2 链接 ---
  const links = document.createElement('div');
  links.className = 'links';
  links.appendChild(createLinkRow('Day 1', student.day1));
  links.appendChild(createLinkRow('Day 2', student.day2));

  // --- 点赞区 ---
  const voteBar = createVoteBar(student);

  // --- 留言区 ---
  const commentSection = createCommentSection(student);

  card.appendChild(header);
  card.appendChild(links);
  card.appendChild(voteBar);
  card.appendChild(commentSection);
  return card;
}

// ========== 创建链接行 ==========
function createLinkRow(label, linkData) {
  const row = document.createElement('div');
  row.className = 'link-row';

  const badge = document.createElement('span');
  badge.className = linkData.ready ? 'link-badge ready' : 'link-badge wip';
  badge.textContent = linkData.ready ? '✓ 已发布' : '🚧 努力中';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'link-label';
  labelSpan.textContent = label;

  if (linkData.ready && linkData.url) {
    const a = document.createElement('a');
    a.className = 'link-url';
    a.href = linkData.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = linkData.label;
    row.appendChild(badge);
    row.appendChild(labelSpan);
    row.appendChild(a);
  } else {
    const span = document.createElement('span');
    span.className = 'link-url disabled';
    span.textContent = linkData.label;
    row.appendChild(badge);
    row.appendChild(labelSpan);
    row.appendChild(span);
  }

  return row;
}

// ========== 创建点赞区 ==========
function createVoteBar(student) {
  const bar = document.createElement('div');
  bar.className = 'vote-bar';

  const btn = document.createElement('button');
  btn.className = 'vote-btn';
  btn.id = 'vote-btn-' + student.id;
  btn.innerHTML = '♥ 点赞';

  const count = document.createElement('span');
  count.className = 'vote-count';
  count.id = 'vote-count-' + student.id;

  const votes = appData.votes[student.id] || 0;
  const hasVoted = appData.voted[student.id];

  if (hasVoted) {
    btn.classList.add('voted');
    btn.innerHTML = '♥ 已点赞';
  }

  count.innerHTML = '共 <strong>' + votes + '</strong> 票';

  btn.addEventListener('click', function() {
    handleVote(student.id, btn, count);
  });

  bar.appendChild(btn);
  bar.appendChild(count);
  return bar;
}

// ========== 处理点赞 ==========
function handleVote(studentId, btn, countEl) {
  if (appData.voted[studentId]) {
    return;
  }

  appData.voted[studentId] = true;
  appData.votes[studentId] = (appData.votes[studentId] || 0) + 1;
  saveData(appData);

  btn.classList.add('voted');
  btn.innerHTML = '♥ 已点赞';
  countEl.innerHTML = '共 <strong>' + appData.votes[studentId] + '</strong> 票';

  btn.style.transform = 'scale(1.15)';
  setTimeout(function() { btn.style.transform = ''; }, 150);
}

// ========== 创建留言区 ==========
function createCommentSection(student) {
  const section = document.createElement('div');
  section.className = 'comments-section';

  const title = document.createElement('div');
  title.className = 'comments-title';
  const commentCount = (appData.comments[student.id] || []).length;
  title.textContent = '💬 留言 (' + commentCount + ')';

  const list = document.createElement('div');
  list.className = 'comment-list';
  list.id = 'comment-list-' + student.id;

  (appData.comments[student.id] || []).forEach(function(c) {
    list.appendChild(createCommentItem(c));
  });

  if (list.children.length > 0) {
    setTimeout(function() { list.scrollTop = list.scrollHeight; }, 0);
  }

  const form = document.createElement('div');
  form.className = 'comment-form';

  const nicknameInput = document.createElement('input');
  nicknameInput.className = 'comment-input';
  nicknameInput.placeholder = '你的昵称';
  nicknameInput.maxLength = 20;

  const contentInput = document.createElement('input');
  contentInput.className = 'comment-input';
  contentInput.placeholder = '写句鼓励的话...';
  contentInput.maxLength = 200;

  const submitBtn = document.createElement('button');
  submitBtn.className = 'comment-submit';
  submitBtn.textContent = '发送';

  var doSubmit = function() {
    const nickname = nicknameInput.value.trim();
    const content = contentInput.value.trim();

    if (!nickname) {
      nicknameInput.focus();
      return;
    }
    if (!content) {
      contentInput.focus();
      return;
    }

    const comment = {
      nickname: nickname,
      content: content,
      time: Date.now()
    };

    if (!appData.comments[student.id]) {
      appData.comments[student.id] = [];
    }
    appData.comments[student.id].push(comment);
    saveData(appData);

    list.appendChild(createCommentItem(comment));
    list.scrollTop = list.scrollHeight;
    title.textContent = '💬 留言 (' + appData.comments[student.id].length + ')';

    nicknameInput.value = '';
    contentInput.value = '';
  };

  submitBtn.addEventListener('click', doSubmit);
  contentInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSubmit();
  });
  nicknameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') contentInput.focus();
  });

  form.appendChild(nicknameInput);
  form.appendChild(contentInput);
  form.appendChild(submitBtn);

  section.appendChild(title);
  section.appendChild(list);
  section.appendChild(form);
  return section;
}

// ========== 创建单条留言 DOM ==========
function createCommentItem(comment) {
  const div = document.createElement('div');
  div.className = 'comment-item';

  const date = new Date(comment.time);
  const timeStr = date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  div.innerHTML =
    '<span class="comment-nickname">' + escapeHtml(comment.nickname) + '</span>' +
    '<span class="comment-text">' + escapeHtml(comment.content) + '</span>' +
    '<span class="comment-time">' + timeStr + '</span>';
  return div;
}

// ========== HTML 转义（防 XSS） ==========
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== 启动 ==========
document.addEventListener('DOMContentLoaded', init);
