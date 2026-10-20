const { request } = require('../../utils/api.js');

function labelOf(option) {
  return option.key === option.text ? option.key : `${option.key}　${option.text}`;
}

Page({
  data: { loading: true, error: '', attempt: null, question: null, picked: '', feedback: null, busy: false },
  onLoad(query) {
    this.attemptId = query.id;
    this.load();
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const attempt = await request(`/api/attempts/${this.attemptId}`);
      if (attempt.finished) {
        wx.removeStorageSync('yingji:attempt');
        wx.redirectTo({ url: `/pages/result/result?id=${attempt.id}` });
        return;
      }
      this.attempt = attempt;
      this.showQuestion(attempt, null, '');
      this.setData({ loading: false });
    } catch (error) {
      this.setData({ loading: false, error: error.message });
    }
  },
  showQuestion(attempt, feedback, picked) {
    const question = feedback
      ? attempt.questions.find(item => item.id === feedback.question_id)
      : attempt.questions.find(item => !item.answered);
    if (!question) return;
    question.options = question.options.map(option => ({ ...option, label: labelOf(option) }));
    this.setData({ attempt, question, feedback, picked });
  },
  pick(event) {
    if (this.data.feedback || this.data.busy) return;
    this.setData({ picked: event.currentTarget.dataset.key });
  },
  copySource(event) {
    wx.setClipboardData({ data: event.currentTarget.dataset.url });
  },
  act() {
    if (this.data.feedback) {
      if (this.data.attempt.finished) wx.redirectTo({ url: `/pages/result/result?id=${this.attemptId}` });
      else this.showQuestion(this.attempt, null, '');
      return;
    }
    this.submit();
  },
  async submit() {
    if (!this.data.picked) {
      wx.showToast({ title: '请先选择一个答案', icon: 'none' });
      return;
    }
    this.setData({ busy: true });
    try {
      const data = await request(`/api/attempts/${this.attemptId}/answers`, 'POST', { question_id: this.data.question.id, choice: this.data.picked });
      this.attempt = data;
      if (data.finished) wx.setStorageSync(`yingji:earned:${data.id}`, data.titles_earned || []);
      this.showQuestion(data, data.feedback, this.data.picked);
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    } finally {
      this.setData({ busy: false });
    }
  }
});
