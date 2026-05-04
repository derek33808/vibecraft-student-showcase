// ============================================================
// student-showcase · 交互逻辑（v2 Supabase）
// ============================================================

var appData = {
  votes: {},
  voted: {},
  comments: {}
};

// ========== 初始化（异步加载 Supabase 数据） ==========
async function init() {
  // 显示加载状态
  var grid = document.getElementById('cardsGrid');
  grid.innerHTML = '<div class="loading">加载中...</div>';

  try {
    // 并行加载投票数和已投票状态
    var countsPromise = fetchVoteCounts();
    var votedIdsPromise = fetchVotedStudentIds();

    var counts = await countsPromise;
    var votedIds = await votedIdsPromise;

    // 转换为 appData 格式
    appData.votes = { corum: 0, isaac: 0, langer: 0, max: 0 };
    for (var key in counts) {
      if (counts.hasOwnProperty(key)) {
        appData.votes[key] = counts[key];
      }
    }

    appData.voted = { corum: false, isaac: false, langer: false, max: false };
    for (var i = 0; i < votedIds.length; i++) {
      appData.voted[votedIds[i]] = true;
    }

    // 加载每位学生的留言
    appData.comments = { corum: [], isaac: [], langer: [], max: [] };
    var commentPromises = STUDENTS.map(function(s) {
      return fetchComments(s.id).then(function(comments) {
        appData.comments[s.id] = comments;
      });
    });
    await Promise.all(commentPromises);

    // 渲染卡片
    renderCards();
  } catch (err) {
    console.error('数据加载失败:', err);
    grid.innerHTML = '<div class="loading error">数据加载失败，请刷新重试</div>';
  }
}

// ========== 渲染所有学生卡片 ==========
function renderCards() {
  var grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';

  STUDENTS.forEach(function(student) {
    var card = createCard(student);
    grid.appendChild(card);
  });
}

// ========== 创建单个学生卡片 ==========
function createCard(student) {
  var card = document.createElement('div');
  card.className = 'card';

  // --- 头像 + 姓名 ---
  var header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = '<div class="card-avatar">' + student.name[0] + '</div>' +
    '<span class="card-name">' + student.name + '</span>';

  // --- Day1 / Day2 链接 ---
  var links = document.createElement('div');
  links.className = 'links';
  links.appendChild(createLinkRow('Day 1', student.day1));
  links.appendChild(createLinkRow('Day 2', student.day2));

  // --- 点赞区 ---
  var voteBar = createVoteBar(student);

  // --- 留言区 ---
  var commentSection = createCommentSection(student);

  card.appendChild(header);
  card.appendChild(links);
  card.appendChild(voteBar);
  card.appendChild(commentSection);
  return card;
}

// ========== 创建链接行 ==========
function createLinkRow(label, linkData) {
  var row = document.createElement('div');
  row.className = 'link-row';

  var badge = document.createElement('span');
  badge.className = linkData.ready ? 'link-badge ready' : 'link-badge wip';
  badge.textContent = linkData.ready ? '✓ 已发布' : '🚧 努力中';

  var labelSpan = document.createElement('span');
  labelSpan.className = 'link-label';
  labelSpan.textContent = label;

  if (linkData.ready && linkData.url) {
    var a = document.createElement('a');
    a.className = 'link-url';
    a.href = linkData.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = linkData.label;
    row.appendChild(badge);
    row.appendChild(labelSpan);
    row.appendChild(a);
  } else {
    var span = document.createElement('span');
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
  var bar = document.createElement('div');
  bar.className = 'vote-bar';

  var btn = document.createElement('button');
  btn.className = 'vote-btn';
  btn.id = 'vote-btn-' + student.id;
  btn.innerHTML = '<span class="vote-heart">♥</span> 点赞';

  var count = document.createElement('span');
  count.className = 'vote-count';
  count.id = 'vote-count-' + student.id;

  var votes = appData.votes[student.id] || 0;
  var hasVoted = appData.voted[student.id];

  if (hasVoted) {
    btn.classList.add('voted');
    btn.innerHTML = '<span class="vote-heart">♥</span> 已点赞';
  }

  count.innerHTML = '共 <strong>' + votes + '</strong> 票';

  btn.addEventListener('click', function() {
    handleVote(student.id, btn, count);
  });

  bar.appendChild(btn);
  bar.appendChild(count);
  return bar;
}

// ========== 处理点赞（异步） ==========
async function handleVote(studentId, btn, countEl) {
  if (appData.voted[studentId]) {
    return;
  }

  // 乐观更新 UI
  btn.classList.add('voted');
  btn.innerHTML = '<span class="vote-heart">♥</span> 已点赞';
  btn.style.transform = 'scale(1.15)';
  setTimeout(function() { btn.style.transform = ''; }, 150);

  var result = await addVote(studentId);

  if (result.success) {
    appData.voted[studentId] = true;
    appData.votes[studentId] = (appData.votes[studentId] || 0) + 1;
    countEl.innerHTML = '共 <strong>' + appData.votes[studentId] + '</strong> 票';
  } else if (result.duplicate) {
    // 已经投过，保持 UI 状态（从数据库刷新最新票数）
    var counts = await fetchVoteCounts();
    appData.votes[studentId] = counts[studentId] || appData.votes[studentId] || 0;
    countEl.innerHTML = '共 <strong>' + appData.votes[studentId] + '</strong> 票';
  } else {
    // 失败，回滚 UI
    btn.classList.remove('voted');
    btn.innerHTML = '<span class="vote-heart">♥</span> 点赞';
  }
}

// ========== 创建留言区 ==========
function createCommentSection(student) {
  var section = document.createElement('div');
  section.className = 'comments-section';

  var title = document.createElement('div');
  title.className = 'comments-title';
  var commentCount = (appData.comments[student.id] || []).length;
  title.textContent = '💬 留言 (' + commentCount + ')';
  title.id = 'comment-title-' + student.id;

  var list = document.createElement('div');
  list.className = 'comment-list';
  list.id = 'comment-list-' + student.id;

  (appData.comments[student.id] || []).forEach(function(c) {
    list.appendChild(createCommentItem(c));
  });

  if (list.children.length > 0) {
    setTimeout(function() { list.scrollTop = list.scrollHeight; }, 0);
  }

  // 留言表单
  var form = document.createElement('div');
  form.className = 'comment-form';

  var nicknameInput = document.createElement('input');
  nicknameInput.className = 'comment-input';
  nicknameInput.placeholder = '你的昵称';
  nicknameInput.maxLength = 20;

  var contentInput = document.createElement('input');
  contentInput.className = 'comment-input';
  contentInput.placeholder = '写句鼓励的话...';
  contentInput.maxLength = 200;

  var submitBtn = document.createElement('button');
  submitBtn.className = 'comment-submit';
  submitBtn.textContent = '发送';

  var doSubmit = async function() {
    var nickname = nicknameInput.value.trim();
    var content = contentInput.value.trim();

    if (!nickname) {
      nicknameInput.focus();
      return;
    }
    if (!content) {
      contentInput.focus();
      return;
    }

    // 禁用按钮防重复
    submitBtn.disabled = true;
    submitBtn.textContent = '发送中...';

    var comment = await addComment(student.id, nickname, content);

    submitBtn.disabled = false;
    submitBtn.textContent = '发送';

    if (comment) {
      if (!appData.comments[student.id]) {
        appData.comments[student.id] = [];
      }
      appData.comments[student.id].push(comment);

      list.appendChild(createCommentItem(comment));
      list.scrollTop = list.scrollHeight;

      var titleEl = document.getElementById('comment-title-' + student.id);
      if (titleEl) {
        titleEl.textContent = '💬 留言 (' + appData.comments[student.id].length + ')';
      }

      nicknameInput.value = '';
      contentInput.value = '';
    } else {
      alert('留言发送失败，请重试');
    }
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
  var div = document.createElement('div');
  div.className = 'comment-item';

  var date = new Date(comment.time);
  var timeStr = date.toLocaleString('zh-CN', {
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
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== 启动 ==========
document.addEventListener('DOMContentLoaded', init);
