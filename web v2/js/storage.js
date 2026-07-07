const STORAGE_KEY = "codekids_web_progress_v3";
const memoryStore = {};

window.GameStorage = {
  loadProgress() {
    const defaultData = {
      completedLessons: [],
      completedChallenges: [],
      badges: [],
      xp: 0,
      theme: "dark",
      currentLesson: null,
      maxLines: 0,
      bugsFixed: 0,
      streak: 0,
      lastVisit: null,
      achievements: [],
      avatar: { color: "default", pet: null }
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaultData,
          ...parsed,
          avatar: { ...defaultData.avatar, ...(parsed.avatar || {}) }
        };
      }
      return defaultData;
    } catch (error) {
      console.warn("localStorage blocked by browser. Using temporary memory.", error);
      return memoryStore[STORAGE_KEY] || defaultData;
    }
  },

  saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("localStorage blocked. Saving temporarily.", error);
      memoryStore[STORAGE_KEY] = data;
    }
  },

  setMaxLines(count) {
    const data = this.loadProgress();
    if (count > (data.maxLines || 0)) {
      data.maxLines = count;
      this.saveProgress(data);
    }
    return data.maxLines;
  },

  updateStreak() {
    const data = this.loadProgress();
    const today = new Date().toDateString();
    if (data.lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      data.streak = (data.lastVisit === yesterday) ? (data.streak || 0) + 1 : 1;
      data.lastVisit = today;
      this.saveProgress(data);
    }
    return data.streak;
  },

  addBugFix() {
    const data = this.loadProgress();
    data.bugsFixed = (data.bugsFixed || 0) + 1;
    this.saveProgress(data);
    return data.bugsFixed;
  },

  unlockAchievement(id) {
    const data = this.loadProgress();
    if (!data.achievements.includes(id)) {
      data.achievements.push(id);
      data.xp = (data.xp || 0) + (ACHIEVEMENTS[id]?.xp || 0);
      this.saveProgress(data);
      return true;
    }
    return false;
  },

  hasAchievement(id) {
    return this.loadProgress().achievements.includes(id);
  },

  spendXp(amount) {
    const data = this.loadProgress();
    if ((data.xp || 0) >= amount) {
      data.xp -= amount;
      this.saveProgress(data);
      return true;
    }
    return false;
  },

  completeLesson(lessonId, badgeId, xp) {
    const data = this.loadProgress();
    if (!data.completedLessons.includes(lessonId)) {
      data.completedLessons.push(lessonId);
      data.xp = (data.xp || 0) + xp;
    }
    if (badgeId && !data.badges.includes(badgeId)) {
      data.badges.push(badgeId);
    }
    if (data.completedLessons.length === LESSONS.length && !data.badges.includes("code_champion")) {
      data.badges.push("code_champion");
      data.xp += 200;
    }
    this.saveProgress(data);
    return data;
  },

  completeChallenge(challengeId, xp) {
    const data = this.loadProgress();
    if (!data.completedChallenges.includes(challengeId)) {
      data.completedChallenges.push(challengeId);
      data.xp = (data.xp || 0) + xp;
      this.saveProgress(data);
      return true;
    }
    return false;
  },

  isLessonComplete(lessonId) {
    return this.loadProgress().completedLessons.includes(lessonId);
  },

  isChallengeComplete(challengeId) {
    return this.loadProgress().completedChallenges.includes(challengeId);
  },

  hasBadge(badgeId) {
    return this.loadProgress().badges.includes(badgeId);
  },

  getXpProgress(xp) {
    const level = Math.floor(xp / 100) + 1;
    const currentLevelXp = xp % 100;
    return { level, pct: currentLevelXp, xp };
  }
};