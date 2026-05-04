// ============================================================
// student-showcase · Supabase API 封装（投票 + 留言）
// ============================================================

// ========== 投票 API ==========

// 获取所有学生的投票数
async function fetchVoteCounts() {
  const { data, error } = await sb
    .from('showcase_votes')
    .select('student_id');

  if (error) {
    console.error('fetchVoteCounts error:', error);
    return {};
  }

  const counts = {};
  for (var i = 0; i < data.length; i++) {
    var sid = data[i].student_id;
    counts[sid] = (counts[sid] || 0) + 1;
  }
  return counts;
}

// 获取当前浏览器已投票的学生ID列表
async function fetchVotedStudentIds() {
  var fp = getFingerprint();
  const { data, error } = await sb
    .from('showcase_votes')
    .select('student_id')
    .eq('voter_fingerprint', fp);

  if (error) {
    console.error('fetchVotedStudentIds error:', error);
    return [];
  }

  var ids = [];
  for (var i = 0; i < data.length; i++) {
    ids.push(data[i].student_id);
  }
  return ids;
}

// 添加投票
async function addVote(studentId) {
  var fp = getFingerprint();
  const { error } = await sb
    .from('showcase_votes')
    .insert({
      student_id: studentId,
      voter_fingerprint: fp
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, duplicate: true };
    }
    console.error('addVote error:', error);
    return { success: false, duplicate: false };
  }

  return { success: true, duplicate: false };
}

// ========== 留言 API ==========

// 获取某位学生的留言列表
async function fetchComments(studentId) {
  const { data, error } = await sb
    .from('showcase_comments')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchComments error:', error);
    return [];
  }

  return data.map(function(row) {
    return {
      nickname: row.author,
      content: row.content,
      time: new Date(row.created_at).getTime()
    };
  });
}

// 添加留言
async function addComment(studentId, author, content) {
  const { data, error } = await sb
    .from('showcase_comments')
    .insert({
      student_id: studentId,
      author: author.trim(),
      content: content.trim()
    })
    .select()
    .single();

  if (error) {
    console.error('addComment error:', error);
    return null;
  }

  return {
    nickname: data.author,
    content: data.content,
    time: new Date(data.created_at).getTime()
  };
}
