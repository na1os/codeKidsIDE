const STORAGE_KEY = "codekids_web_progress";

window.GameStorage = {
  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.error(error);
    }
    return {
      completedLessons: [],
      badges: [],
      xp: 0,
      theme: "dark",
      currentLesson: null,
    };
  },

  saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error(error);
    }
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

  isLessonComplete(lessonId) {
    return this.loadProgress().completedLessons.includes(lessonId);
  },

  hasBadge(badgeId) {
    return this.loadProgress().badges.includes(badgeId);
  },

  getXpProgress(xp) {
    const level = Math.floor(xp / 100) + 1;
    const currentLevelXp = xp % 100;
    return {
      level,
      pct: currentLevelXp,
      xp
    };
  }
};