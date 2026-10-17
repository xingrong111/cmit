const { learnerId, request } = require('../../utils/learning-api.js');

Page({
  readArchive(){const id=Object.fromEntries(require('../../utils/人物关联.json').filter(x=>x.readingId).map(x=>[x.name,x.readingId]))[this.data.attempt&&this.data.attempt.person_name];if(id)wx.navigateTo({url:'/pages/person/index?id='+id});else wx.showToast({title:'人物档案持续整理中',icon:'none'});},
  explorePlaces(){const id=Object.fromEntries(require('../../utils/人物关联.json').filter(x=>x.readingId).map(x=>[x.name,x.readingId]))[this.data.attempt&&this.data.attempt.person_name];if(id){wx.setStorageSync('yingji:radar-person',id);wx.switchTab({url:'/pages/radar/index'});}else wx.switchTab({url:'/pages/radar/index'});},
  data: { loading: true, error: '', attempt: null, earned: [], earnedText: '', reviewMode: '', visible: [] },
  onLoad(query) {
    this.attemptId = query.id;
    this.load();
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const attempt = await request(`/api/attempts/${this.attemptId}`);
      if (!attempt.finished) {
        wx.redirectTo({ url: `/pages/quiz/quiz?id=${attempt.id}` });
        return;
      }
      const earned = wx.getStorageSync(`yingji:earned:${attempt.id}`) || [];
      const score = attempt.score;
      const optionText = option => option.key === option.text ? option.key : `${option.key}　${option.text}`;
      const reviews = attempt.questions.map((question, index) => {
        const feedback = question.feedback;
        const yours = question.options.find(option => option.key === feedback.choice);
        const answer = question.options.find(option => option.key === feedback.correct_answer);
        return {
          id: question.id,
          n: index + 1,
          stem: question.stem,
          type: question.type,
          correct: feedback.correct,
          summary: feedback.correct
            ? `你的选择 ${optionText(yours || { key: feedback.choice, text: feedback.choice })}，这是正确答案。`
            : `你的选择 ${optionText(yours || { key: feedback.choice, text: feedback.choice })}。正确答案 ${optionText(answer || { key: feedback.correct_answer, text: feedback.correct_answer })}。`,
          explanation: feedback.explanation,
          source_id: feedback.source_id,
          evidence: feedback.evidence,
          source_url: feedback.source_url || '',
          options: question.options.map(option => ({
            key: option.key,
            label: optionText(option),
            kind: option.key === feedback.correct_answer ? 'right' : option.key === feedback.choice ? 'wrong' : ''
          }))
        };
      });
      const marks = reviews.map(item => ({ n: item.n, label: item.correct ? '对' : '错', kind: item.correct ? 'hit' : 'miss' }));
      this.reviews = reviews;
      this.setData({
        loading: false,
        attempt,
        earned,
        earnedText: earned.map(item => item.name).join('、'),
        reviewMode: '',
        visible: [],
        marks,
        barLabel: `答对 ${score.correct} 题，答错 ${score.wrong} 题`
      });
    } catch (error) {
      this.setData({ loading: false, error: error.message });
    }
  },
  setReview(event) {
    const mode = event.currentTarget.dataset.mode;
    const reviewMode = this.data.reviewMode === mode ? '' : mode;
    const visible = reviewMode === 'all' ? this.reviews : reviewMode === 'wrong' ? this.reviews.filter(item => !item.correct) : [];
    this.setData({ reviewMode, visible });
  },
  openHonors() { wx.navigateTo({ url: '/pages/honors/honors' }); },
  hall() {
    wx.removeStorageSync('yingji:attempt');
    wx.reLaunch({ url: '/pages/learn/learn' });
  },
  copySource(event) {
    wx.setClipboardData({ data: event.currentTarget.dataset.url });
  },
  async nextLevel() {
    try {
      const next = await request('/api/attempts', 'POST', { level_id: this.data.attempt.next_level.id, learner_id: learnerId() });
      wx.setStorageSync('yingji:attempt', next.id);
      wx.redirectTo({ url: `/pages/quiz/quiz?id=${next.id}` });
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },
  async again() {
    try {
      const next = await request('/api/attempts', 'POST', { level_id: this.data.attempt.level_id, learner_id: learnerId() });
      wx.setStorageSync('yingji:attempt', next.id);
      wx.redirectTo({ url: `/pages/quiz/quiz?id=${next.id}` });
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  }
});
