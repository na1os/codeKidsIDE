document.addEventListener("DOMContentLoaded", () => {
  let editorInstance;
  let activeLesson = null;
  let userProgress = GameStorage.loadProgress();
  let isExecutionPending = false;

  const select = (selector) => document.querySelector(selector);
  const selectAll = (selector) => document.querySelectorAll(selector);

  async function initializeApp() {
    select("#loading").classList.remove("hidden");

    setupCodeEditor();
    setupNavigation();
    setupActionListeners();
    renderLessonsList();
    renderBadgesGrid();
    updateXpDisplay();
    applyThemeMode(userProgress.theme || "dark");

    try {
      await PythonRunner.runCode(""); 
    } catch (e) {
      logToConsole("Could not initialize Python environment.", "stderr");
    }

    select("#loading").classList.add("hidden");
    switchViewPanel("editor");

    if (userProgress.currentLesson) {
      const matchedLesson = LESSONS.find((l) => l.id === userProgress.currentLesson);
      if (matchedLesson) selectLesson(matchedLesson, false, true); 
    }
  }

  function switchViewPanel(panelName) {
    selectAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.panel === panelName);
    });
    select("#panel-lessons").classList.toggle("hidden", panelName !== "lessons");
    select("#panel-badges").classList.toggle("hidden", panelName !== "badges");
    select("#panel-editor-info").classList.toggle("hidden", panelName !== "editor");
  }

  function setupCodeEditor() {
    editorInstance = CodeMirror.fromTextArea(select("#code-editor"), {
      mode: "python",
      theme: "dracula",
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      lineWrapping: true,
      autofocus: true,
      matchBrackets: true,
      autoCloseBrackets: true
    });

    const savedCode = localStorage.getItem("codekids_saved_code");
    editorInstance.setValue(savedCode !== null ? savedCode : DEFAULT_CODE);
    editorInstance.setSize("100%", "100%");

    let saveTimeout;
    editorInstance.on("change", () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const currentCode = editorInstance.getValue();
        localStorage.setItem("codekids_saved_code", currentCode);
      }, 500);
    });

    editorInstance.on("keydown", (_, event) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleRunCode();
      }
    });
  }

  function setupNavigation() {
    selectAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchViewPanel(btn.dataset.panel));
    });
  }

  function setupActionListeners() {
    select("#run-btn").addEventListener("click", handleRunCode);
    select("#reset-btn").addEventListener("click", handleResetCode);
    select("#clear-console").addEventListener("click", clearConsoleOutput);
    select("#theme-btn").addEventListener("click", handleThemeToggle);
    select("#badge-close-btn").addEventListener("click", () => select("#badge-modal").classList.add("hidden"));
    select(".modal-backdrop")?.addEventListener("click", () => select("#badge-modal").classList.add("hidden"));
  }

  async function handleRunCode() {
    if (isExecutionPending) return;
    
    const runButton = select("#run-btn");
    isExecutionPending = true;
    runButton.classList.add("running");
    runButton.innerHTML = "Running...";
    updateStatusText("Executing code...");

    clearConsoleOutput();
    const userCode = editorInstance.getValue();

    try {
      const result = await PythonRunner.runCode(userCode);

      result.output.forEach((line) => logToConsole(line.text, "stdout"));
      result.errors.forEach((line) => logToConsole(line.text, "stderr"));

      if (result.success && result.errors.length === 0) {
        logToConsole("Success!", "success");
        updateStatusText("Execution completed.");

        if (activeLesson) {
          verifyLessonCompletion(result.output);
        }
      } else {
        updateStatusText("Execution failed.");
      }
    } catch (error) {
      logToConsole("Runtime Error: " + error.message, "stderr");
      updateStatusText("Runtime Error");
    } finally {
      isExecutionPending = false;
      runButton.classList.remove("running");
      runButton.innerHTML = "Run";
    }
  }

  function verifyLessonCompletion(output) {
    if (!activeLesson || GameStorage.isLessonComplete(activeLesson.id)) return;

    if (PythonRunner.checkLessonOutput(output, activeLesson.expected)) {
      const alreadyEarnedBadge = GameStorage.hasBadge(activeLesson.badge);
      userProgress = GameStorage.completeLesson(activeLesson.id, activeLesson.badge, activeLesson.xp);

      renderLessonsList();
      renderBadgesGrid();
      updateXpDisplay();

      if (!alreadyEarnedBadge && activeLesson.badge) {
        triggerBadgePopup(activeLesson.badge);
      }
    }
  }

  function renderLessonsList() {
    const container = select("#lessons-list");
    container.innerHTML = "";

    LESSONS.forEach((lesson) => {
      const isDone = GameStorage.isLessonComplete(lesson.id);
      const card = document.createElement("div");
      
      card.className = `lesson-card ${isDone ? "done" : ""} ${activeLesson?.id === lesson.id ? "active" : ""}`;
      card.innerHTML = `<h4>${lesson.title}</h4><p>${lesson.description}</p>`;
      card.addEventListener("click", () => selectLesson(lesson));
      container.appendChild(card);
    });

    const completedCount = userProgress.completedLessons.length;
    select("#progress-label").textContent = `${completedCount} / ${LESSONS.length} lessons`;
  }

  function selectLesson(lesson, shouldSave = true, isInit = false) {
    activeLesson = lesson;
    
    if (editorInstance && !isInit) {
      editorInstance.setValue(lesson.code);
    }

    const hintContainer = select("#lesson-hint-box");
    hintContainer.classList.remove("hidden");
    select("#lesson-hint-text").textContent = lesson.hint;

    if (shouldSave) {
      userProgress.currentLesson = lesson.id;
      GameStorage.saveProgress(userProgress);
    }

    renderLessonsList();
    updateStatusText(`Active Lesson: ${lesson.title}`);
    switchViewPanel("editor");
  }

  function renderBadgesGrid() {
    const grid = select("#badges-grid");
    grid.innerHTML = "";
    userProgress = GameStorage.loadProgress();

    Object.entries(BADGES).forEach(([id, badge]) => {
      const isEarned = userProgress.badges.includes(id);
      const element = document.createElement("div");
      element.className = `badge-item ${isEarned ? "earned" : "locked"}`;
      element.innerHTML = `<h4>${badge.name}</h4><p>${badge.description}</p>`;
      grid.appendChild(element);
    });
  }

  function triggerBadgePopup(badgeId) {
    const badgeData = BADGES[badgeId];
    if (!badgeData) return;

    select("#badge-unlock-name").textContent = badgeData.name;
    select("#badge-unlock-desc").textContent = badgeData.description;
    select("#badge-modal").classList.remove("hidden");
  }

  function updateXpDisplay() {
    userProgress = GameStorage.loadProgress();
    const { level, pct, xp } = GameStorage.getXpProgress(userProgress.xp || 0);
    
    select("#level-badge").textContent = `Lvl ${level}`;
    select("#xp-fill").style.width = `${pct}%`;
    select("#xp-text").textContent = `${xp} XP`;
  }

  function logToConsole(text, type = "stdout") {
    const consoleView = select("#console-output");
    const defaultMessage = consoleView.querySelector(".console-welcome");
    if (defaultMessage) defaultMessage.remove();

    if (consoleView.children.length > 50) {
      consoleView.removeChild(consoleView.firstChild);
    }

    const logLine = document.createElement("div");
    logLine.className = `console-line ${type}`;
    logLine.textContent = text;
    consoleView.appendChild(logLine);
    consoleView.scrollTop = consoleView.scrollHeight;
  }

  function clearConsoleOutput() {
    select("#console-output").innerHTML = "";
  }

  function updateStatusText(text) {
    select("#editor-status").textContent = text;
  }

  function handleResetCode() {
    const initialCode = activeLesson ? activeLesson.code : DEFAULT_CODE;
    editorInstance.setValue(initialCode);
    localStorage.removeItem("codekids_saved_code");
    clearConsoleOutput();
    updateStatusText("Code configuration reset.");
  }

  function handleThemeToggle() {
    const currentTheme = document.documentElement.dataset.theme;
    const targetTheme = currentTheme === "light" ? "dark" : "light";
    applyThemeMode(targetTheme);
    userProgress.theme = targetTheme;
    GameStorage.saveProgress(userProgress);
  }

  function applyThemeMode(themeName) {
    document.documentElement.dataset.theme = themeName;
    select("#theme-btn").textContent = themeName === "light" ? "🌙" : "☀️"; 
  }

  initializeApp();
});