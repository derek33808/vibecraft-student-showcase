// ============================================================
// student-showcase · 交互逻辑（v2 Supabase）
// ============================================================

var appData = {
  votes: {},
  voted: {},
  comments: {}  // { studentId: [tree], ... }
};

var COMMENT_PREVIEW = 3; // 默认显示前3条

// ========== 初始化 ==========
async function init() {
  var grid = document.getElementById('cardsGrid');
  grid.innerHTML = '<div class="loading">加载中...</div>';

  try {
    var countsPromise = fetchVoteCounts();
    var votedIdsPromise = fetchVotedStudentIds();

    var counts = await countsPromise;
    var votedIds = await votedIdsPromise;

    appData.votes = { corum: 0, isaac: 0, langer: 0, max: 0 };
    for (var key in counts) {
      if (counts.hasOwnProperty(key)) appData.votes[key] = counts[key];
    }

    appData.voted = { corum: false, isaac: false, langer: false, max: false };
    for (var i = 0; i < votedIds.length; i++) {
      appData.voted[votedIds[i]] = true;
    }

    appData.comments = { corum: [], isaac: [], langer: [], max: [] };
    var commentPromises = STUDENTS.map(function(s) {
      return fetchComments(s.id).then(function(comments) {
        appData.comments[s.id] = buildCommentTree(comments);
      });
    });
    await Promise.all(commentPromises);

    renderCards();
  } catch (err) {
    console.error('数据加载失败:', err);
    grid.innerHTML = '<div class="loading error">数据加载失败，请刷新重试</div>';
  }
}

// ========== 构建评论树 ==========
function buildCommentTree(flatList) {
  var map = {};
  var topLevel = [];
  for (var i = 0; i < flatList.length; i++) {
    var c = flatList[i];
    c.replies = [];
    map[c.id] = c;
  }
  for (var i = 0; i < flatList.length; i++) {
    var c = flatList[i];
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(c);
    } else {
      topLevel.push(c);
    }
  }
  return topLevel;
}

// ========== 渲染卡片 ==========
function renderCards() {
  var grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  STUDENTS.forEach(function(student) {
    var card = createCard(student);
    grid.appendChild(card);
  });
  // 滚动条可见性检测
  updateScrollIndicators();
}

function createCard(student) {
  var card = document.createElement('div');
  card.className = 'card';

  var header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = '<div class="card-avatar">' + student.name[0] + '</div>' +
    '<span class="card-name">' + student.name + '</span>';

  var links = document.createElement('div');
  links.className = 'links';
  links.appendChild(createLinkRow('Day 1', student.day1));
  links.appendChild(createLinkRow('Day 2', student.day2));

  var voteBar = createVoteBar(student);
  var commentSection = createCommentSection(student);

  card.appendChild(header);
  card.appendChild(links);
  card.appendChild(voteBar);
  card.appendChild(commentSection);
  return card;
}

function createLinkRow(label, linkData) {
  var row = document.createElement('div');
  row.className = 'link-row';
  var badge = document.createElement('span');
  badge.className = linkData.ready ? 'link-badge ready' : 'link-badge wip';
  badge.textContent = linkData.ready ? '已发布' : '努力中';
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

// ========== 点赞 ==========
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
  btn.addEventListener('click', function() { handleVote(student.id, btn, count); });
  bar.appendChild(btn);
  bar.appendChild(count);
  return bar;
}

async function handleVote(studentId, btn, countEl) {
  if (appData.voted[studentId]) return;
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
    var counts = await fetchVoteCounts();
    appData.votes[studentId] = counts[studentId] || appData.votes[studentId] || 0;
    countEl.innerHTML = '共 <strong>' + appData.votes[studentId] + '</strong> 票';
  } else {
    btn.classList.remove('voted');
    btn.innerHTML = '<span class="vote-heart">♥</span> 点赞';
  }
}

// ========== 留言区（折叠展开） ==========
function createCommentSection(student) {
  var section = document.createElement('div');
  section.className = 'comments-section';

  var title = document.createElement('div');
  title.className = 'comments-title';
  title.id = 'comment-title-' + student.id;

  var list = document.createElement('div');
  list.className = 'comment-list';
  list.id = 'comment-list-' + student.id;

  renderCommentList(list, student.id, title);

  var form = createCommentForm(student.id, null);

  section.appendChild(title);
  section.appendChild(list);
  section.appendChild(form);
  return section;
}

function renderCommentList(list, studentId, titleEl) {
  var tree = appData.comments[studentId] || [];
  var total = tree.length;

  // 清除旧内容
  list.innerHTML = '';

  if (total === 0) {
    if (titleEl) updateCommentTitle(studentId, titleEl);
    updateScrollIndicator(list);
    return;
  }

  // 渲染全部（折叠由 CSS + hidden class 控制）
  for (var i = 0; i < total; i++) {
    var item = createCommentTreeItem(tree[i], studentId, 0);
    if (i >= COMMENT_PREVIEW) item.classList.add('comment-collapsed');
    list.appendChild(item);
  }

  // 折叠按钮
  if (total > COMMENT_PREVIEW) {
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'comment-toggle-btn';
    toggleBtn.textContent = '▼ 查看全部 (' + total + '条)';
    toggleBtn.addEventListener('click', function() {
      var collapsed = list.querySelectorAll('.comment-collapsed');
      if (collapsed.length > 0) {
        // 展开
        for (var j = 0; j < collapsed.length; j++) collapsed[j].classList.remove('comment-collapsed');
        toggleBtn.textContent = '▲ 收起';
        toggleBtn.classList.add('expanded');
      } else {
        // 收起
        var items = list.querySelectorAll('.comment-tree-item');
        for (var j = COMMENT_PREVIEW; j < items.length; j++) items[j].classList.add('comment-collapsed');
        toggleBtn.textContent = '▼ 查看全部 (' + total + '条)';
        toggleBtn.classList.remove('expanded');
      }
      updateScrollIndicator(list);
    });
    list.appendChild(toggleBtn);
  }

  if (titleEl) updateCommentTitle(studentId, titleEl);
  updateScrollIndicator(list);
}

// ========== 滚动条可见性指示 ==========
function updateScrollIndicators() {
  var lists = document.querySelectorAll('.comment-list');
  for (var i = 0; i < lists.length; i++) {
    updateScrollIndicator(lists[i]);
  }
}

function updateScrollIndicator(list) {
  if (!list) return;
  var hasOverflow = list.scrollHeight > list.clientHeight + 2;
  if (hasOverflow) {
    list.classList.add('has-scroll');
  } else {
    list.classList.remove('has-scroll');
  }
  // 隐藏已展开时无意义的折叠项标记
  var visibleCollapsed = list.querySelectorAll('.comment-collapsed');
  if (visibleCollapsed.length === 0) {
    list.classList.remove('has-hidden');
  } else if (list.querySelectorAll('.comment-tree-item').length > COMMENT_PREVIEW) {
    list.classList.add('has-hidden');
  }
}

// ========== 评论树递归渲染 ==========
function createCommentTreeItem(comment, studentId, depth) {
  var wrapper = document.createElement('div');
  wrapper.className = 'comment-tree-item';
  var item = createCommentItemDom(comment, studentId, depth);
  wrapper.appendChild(item);
  if (comment.replies && comment.replies.length > 0) {
    for (var i = 0; i < comment.replies.length; i++) {
      wrapper.appendChild(createCommentTreeItem(comment.replies[i], studentId, depth + 1));
    }
  }
  return wrapper;
}

function createCommentItemDom(comment, studentId, depth) {
  var div = document.createElement('div');
  div.className = 'comment-item';
  div.id = 'comment-' + comment.id;
  if (depth > 0) div.classList.add('comment-reply');

  var date = new Date(comment.time);
  var timeStr = date.toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  div.innerHTML =
    '<span class="comment-nickname">' + escapeHtml(comment.nickname) + '</span>' +
    '<span class="comment-text">' + escapeHtml(comment.content) + '</span>' +
    '<span class="comment-time">' + timeStr + '</span>';

  var actions = document.createElement('div');
  actions.className = 'comment-actions';

  var replyBtn = document.createElement('button');
  replyBtn.className = 'comment-action-btn';
  replyBtn.textContent = '回复';
  replyBtn.addEventListener('click', function() { toggleReplyForm(comment.id, studentId, div); });
  actions.appendChild(replyBtn);

  var delBtn = document.createElement('button');
  delBtn.className = 'comment-action-btn comment-del-btn';
  delBtn.textContent = '删除';
  delBtn.addEventListener('click', function() { handleDeleteComment(comment.id, studentId); });
  actions.appendChild(delBtn);

  div.appendChild(actions);
  return div;
}

// ========== 回复表单 ==========
function toggleReplyForm(commentId, studentId, commentEl) {
  var existing = commentEl.querySelector('.reply-form-inline');
  if (existing) { existing.remove(); return; }
  var allForms = document.querySelectorAll('.reply-form-inline');
  for (var i = 0; i < allForms.length; i++) allForms[i].remove();
  var form = createCommentForm(studentId, commentId);
  form.classList.add('reply-form-inline');
  commentEl.appendChild(form);
  var inputs = form.querySelectorAll('.comment-input');
  if (inputs.length >= 2) inputs[1].focus();
}

function createCommentForm(studentId, parentId) {
  var form = document.createElement('div');
  form.className = 'comment-form';

  var nicknameInput = document.createElement('input');
  nicknameInput.className = 'comment-input';
  nicknameInput.placeholder = '你的昵称';
  nicknameInput.maxLength = 20;

  var contentInput = document.createElement('input');
  contentInput.className = 'comment-input';
  contentInput.placeholder = parentId ? '写回复...' : '写句鼓励的话...';
  contentInput.maxLength = 200;

  var submitBtn = document.createElement('button');
  submitBtn.className = 'comment-submit';
  submitBtn.textContent = '发送';

  var doSubmit = async function() {
    var nickname = nicknameInput.value.trim();
    var content = contentInput.value.trim();
    if (!nickname) { nicknameInput.focus(); return; }
    if (!content) { contentInput.focus(); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = '发送中...';
    var comment = await addComment(studentId, nickname, content, parentId);
    submitBtn.disabled = false;
    submitBtn.textContent = '发送';
    if (comment) {
      var freshComments = await fetchComments(studentId);
      appData.comments[studentId] = buildCommentTree(freshComments);
      refreshCommentSection(studentId);
    } else {
      alert('发送失败，请重试');
    }
  };

  submitBtn.addEventListener('click', doSubmit);
  contentInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSubmit(); });
  nicknameInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') contentInput.focus(); });

  form.appendChild(nicknameInput);
  form.appendChild(contentInput);
  form.appendChild(submitBtn);
  return form;
}

// ========== 删除 ==========
async function handleDeleteComment(commentId, studentId) {
  if (!confirm('确定要删除吗？')) return;
  var ok = await deleteComment(commentId);
  if (ok) {
    var freshComments = await fetchComments(studentId);
    appData.comments[studentId] = buildCommentTree(freshComments);
    refreshCommentSection(studentId);
  } else {
    alert('删除失败');
  }
}

// ========== 刷新留言区 ==========
function refreshCommentSection(studentId) {
  var list = document.getElementById('comment-list-' + studentId);
  var title = document.getElementById('comment-title-' + studentId);
  if (!list) return;
  renderCommentList(list, studentId, title);
  list.scrollTop = 0;
}

function updateCommentTitle(studentId, titleEl) {
  var count = countAllComments(appData.comments[studentId] || []);
  titleEl.textContent = '💬 留言 (' + count + ')';
}

function countAllComments(tree) {
  var n = 0;
  for (var i = 0; i < tree.length; i++) {
    n += 1 + countAllComments(tree[i].replies || []);
  }
  return n;
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);
