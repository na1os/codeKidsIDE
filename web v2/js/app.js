document.addEventListener("DOMContentLoaded", () => {
  let editorInstance;
  let activeLesson = null;
  let userProgress = {};
  let isExecutionPending = false;
  let lastRunHadError = false;
  
  let projects = {};
  let activeProjectName = null;
  let fileSystem = [];
  let activeFilePath = "main.py";

  const select = (selector) => document.querySelector(selector);
  const selectAll = (selector) => document.querySelectorAll(selector);

  try {
    userProgress = GameStorage.loadProgress();
  } catch (e) {
    userProgress = { 
      xp: 0, 
      completedLessons: [], 
      badges: [], 
      completedChallenges: [], 
      achievements: [], 
      maxLines: 0, 
      bugsFixed: 0, 
      streak: 0, 
      currentLesson: null, 
      theme: "dark" 
    };
  }

  async function initializeApp() {
    try {
      select("#loading").classList.remove("hidden");

      loadProjects();
      setupCodeEditor();
      setupNavigation();
      setupActionListeners();
      renderLessonsList();
      renderChallengesList();
      renderBadgesGrid();
      renderAchievementsList();
      updateXpDisplay();
      applyThemeMode(userProgress.theme || "dark");

      try {
        GameStorage.updateStreak();
        renderAchievementsList();
        checkDailyChallenge();
      } catch (e) {}

      try {
        await PythonRunner.runCode("", []); 
      } catch (e) {
        logToConsole("Error: The Python environment could not be started. Make sure you are using Live Server.", "stderr");
      }

    } catch (err) {
      console.error("Critical error during initialization:", err);
    } finally {
      select("#loading").classList.add("hidden");
      showWelcomeScreen();
    }
  }

  function loadProjects() {
    try {
      const saved = localStorage.getItem("codekids_projects_v1");
      if (saved) projects = JSON.parse(saved);
    } catch (e) { 
      projects = {}; 
    }
    
    if (Object.keys(projects).length === 0) {
      projects["New Project"] = [{ path: 'main.py', code: DEFAULT_CODE }];
    }
  }

  function saveProjects() {
    try {
      if (editorInstance && activeProjectName) {
        let fileIndex = fileSystem.findIndex(f => f.path === activeFilePath);
        if (fileIndex !== -1) {
          fileSystem[fileIndex].code = editorInstance.getValue();
        }
      }
      localStorage.setItem("codekids_projects_v1", JSON.stringify(projects));
    } catch (e) {}
  }

  function showWelcomeScreen() {
    const listContainer = select("#recent-projects-list");
    listContainer.innerHTML = "";
    
    Object.keys(projects).forEach(name => {
      const item = document.createElement("div");
      item.className = "project-list-item";
      item.innerHTML = `<span><i class="fas fa-folder"></i> ${name}</span> <i class="fas fa-trash delete-project-btn" data-name="${name}"></i>`;
      
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains('delete-project-btn')) {
          if (confirm("Are you sure you want to delete the project '" + name + "'?")) {
            delete projects[name];
            saveProjects();
            showWelcomeScreen();
          }
        } else {
          openProject(name);
        }
      });
      listContainer.appendChild(item);
    });
    
    select("#welcome-screen").classList.remove("hidden");
  }

  function hideWelcomeScreen() { 
    select("#welcome-screen").classList.add("hidden"); 
  }

  function openProject(name) {
    activeProjectName = name;
    fileSystem = projects[name] || [{ path: 'main.py', code: DEFAULT_CODE }];
    activeFilePath = "main.py";
    
    const activeFile = fileSystem.find(f => f.path === activeFilePath);
    editorInstance.setValue(activeFile ? activeFile.code : DEFAULT_CODE);
    
    renderFileExplorer();
    hideWelcomeScreen();
    switchViewPanel("files");
  }

  function createNewProject() {
    const name = prompt("Name of the new project:", "Project " + (Object.keys(projects).length + 1));
    if (!name) return;
    if (projects[name]) return alert("A project with this name already exists!");
    
    projects[name] = [{ path: 'main.py', code: DEFAULT_CODE }];
    saveProjects();
    openProject(name);
  }

  function exportProjectAsZip() {
    if (typeof JSZip === 'undefined') return alert("Error: JSZip library failed to load.");
    if (!activeProjectName) return;
    
    saveProjects(); 
    const zip = new JSZip();
    fileSystem.forEach(file => zip.file(file.path, file.code));
    
    zip.generateAsync({ type: "blob" }).then(function(content) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${activeProjectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      logToConsole("[SUCCESS] Project exported as a ZIP archive.", "success");
    });
  }

  function handleImportFile(e) {
    const files = e.target.files;
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => addImportedFile(file.name, event.target.result);
      reader.readAsText(file);
    }
    e.target.value = "";
    select("#import-dropdown").classList.add("hidden");
  }

  function handleImportZip(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    JSZip.loadAsync(file).then(zip => {
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          zipEntry.async("string").then(content => {
            addImportedFile(relativePath, content);
          });
        }
      });
    }).catch(err => alert("Error unzipping file: " + err.message));
    
    e.target.value = "";
    select("#import-dropdown").classList.add("hidden");
  }

  function handleImportFolder(e) {
    const files = e.target.files;
    for (const file of files) {
      const path = file.webkitRelativePath;
      if (path.endsWith('.py') || path.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => addImportedFile(path, event.target.result);
        reader.readAsText(file);
      }
    }
    e.target.value = "";
    select("#import-dropdown").classList.add("hidden");
  }

  function addImportedFile(path, content) {
    if (fileSystem.some(f => f.path === path)) {
      let file = fileSystem.find(f => f.path === path);
      file.code = content;
    } else {
      fileSystem.push({ path: path, code: content });
    }
    saveFileSystem();
    renderFileExplorer();
    selectFile(path);
    logToConsole(`[SUCCESS] File ${path} was imported.`, "success");
  }

  function saveFileSystem() { 
    if (activeProjectName) saveProjects(); 
  }

  function buildTree() {
    const root = { name: "", path: "", files: [], folders: {} };
    
    fileSystem.forEach(file => {
      const parts = file.path.split('/');
      let currentLevel = root;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        const folderPath = parts.slice(0, i + 1).join('/');
        
        if (!currentLevel.folders[folderName]) {
          currentLevel.folders[folderName] = { name: folderName, path: folderPath, files: [], folders: {} };
        }
        currentLevel = currentLevel.folders[folderName];
      }
      currentLevel.files.push(file);
    });
    
    return root;
  }

  function renderFileExplorer() {
    const container = select("#file-explorer");
    container.innerHTML = "";
    const tree = buildTree();
    renderTreeLevel(tree, container, 0);
    select("#active-file-tab").textContent = activeFilePath;
  }

  function renderTreeLevel(node, container, level) {
    const folderNames = Object.keys(node.folders).sort();
    const files = [...node.files].sort((a, b) => a.path.localeCompare(b.path));

    folderNames.forEach(folderName => {
      const folder = node.folders[folderName];
      const folderEl = document.createElement("div");
      folderEl.className = "tree-item tree-folder";
      folderEl.style.marginLeft = `${level * 15}px`;
      folderEl.innerHTML = `<i class="fas fa-chevron-down"></i> <i class="fas fa-folder"></i> ${folderName} <div class="file-actions"><i class="fas fa-file-circle-plus new-file-in-folder-btn" data-path="${folder.path}" title="New file here"></i><i class="fas fa-folder-plus new-folder-in-folder-btn" data-path="${folder.path}" title="New subfolder here"></i><i class="fas fa-trash delete-folder-btn" data-path="${folder.path}" title="Delete folder"></i></div>`;
      
      const childrenWrap = document.createElement("div");
      childrenWrap.className = "tree-children";
      
      folderEl.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target.classList.contains('delete-folder-btn')) {
          deleteFolder(e.target.dataset.path);
        } else if (e.target.classList.contains('new-file-in-folder-btn')) {
          createNewFile(e.target.dataset.path);
        } else if (e.target.classList.contains('new-folder-in-folder-btn')) {
          createNewFolder(e.target.dataset.path);
        } else { 
          folderEl.classList.toggle("collapsed"); 
          childrenWrap.classList.toggle("hidden"); 
        }
      });
      
      container.appendChild(folderEl);
      renderTreeLevel(folder, childrenWrap, level + 1);
      container.appendChild(childrenWrap);
    });

    files.forEach(file => {
      const fileName = file.path.split('/').pop();
      container.appendChild(createFileElement(file.path, fileName, level));
    });
  }

  function createFileElement(path, displayName, level) {
    const item = document.createElement("div");
    item.className = `tree-item ${path === activeFilePath ? "active" : ""}`;
    item.style.marginLeft = `${level * 15}px`;
    item.innerHTML = `<i class="fas fa-file-code"></i> <span>${displayName || path}</span> <div class="file-actions">${path !== 'main.py' ? '<i class="fas fa-pen edit-file-btn" data-path="'+path+'"></i> <i class="fas fa-trash delete-file-btn" data-path="'+path+'"></i>' : ''}</div>`;
    
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains('delete-file-btn')) { 
        e.stopPropagation(); 
        deleteFile(e.target.dataset.path); 
      } else if (e.target.classList.contains('edit-file-btn')) { 
        e.stopPropagation(); 
        renameFile(e.target.dataset.path); 
      } else {
        selectFile(path);
      }
    });
    
    return item;
  }

  function selectFile(path) {
    if (editorInstance) {
      let currentIdx = fileSystem.findIndex(f => f.path === activeFilePath);
      if (currentIdx !== -1) fileSystem[currentIdx].code = editorInstance.getValue();
    }
    activeFilePath = path;
    const file = fileSystem.find(f => f.path === path);
    if (file) {
      editorInstance.setValue(file.code || "");
      renderFileExplorer();
    }
  }

  function createNewFile(targetFolder = "") {
    const promptMsg = targetFolder ? `Name of the new file in '${targetFolder}':` : "Name of the new file (e.g., test.py):";
    const name = prompt(promptMsg);
    if (!name) return;
    
    let fileName = name.endsWith('.py') ? name : name + '.py';
    let finalPath = targetFolder ? `${targetFolder}/${fileName}` : fileName;
    
    if (fileSystem.some(f => f.path === finalPath)) return alert("File already exists!");
    
    fileSystem.push({ path: finalPath, code: "" });
    saveFileSystem(); 
    selectFile(finalPath);
  }

  function createNewFolder(targetFolder = "") {
    const promptMsg = targetFolder ? `Name of the new subfolder in '${targetFolder}':` : "Name of the new folder (e.g., utils):";
    const name = prompt(promptMsg);
    if (!name) return;
    
    let folderPath = targetFolder ? `${targetFolder}/${name}` : name;
    let initPath = folderPath + "/__init__.py";
    
    if (fileSystem.some(f => f.path === initPath)) return alert("Folder already exists!");
    
    fileSystem.push({ path: initPath, code: "" });
    saveFileSystem(); 
    renderFileExplorer();
  }

  function renameFile(path) {
    const newName = prompt("New file name:", path.split('/').pop());
    if (!newName || newName === path) return;
    
    let fileName = newName.endsWith('.py') ? newName : newName + '.py';
    const parentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : "";
    let finalPath = parentDir ? `${parentDir}/${fileName}` : fileName;
    
    if (fileSystem.some(f => f.path === finalPath)) return alert("A file with this name already exists!");
    
    let file = fileSystem.find(f => f.path === path);
    file.path = finalPath;
    
    if (activeFilePath === path) activeFilePath = finalPath;
    
    saveFileSystem(); 
    renderFileExplorer();
  }

  function deleteFile(path) {
    if (path === "main.py") return alert("You cannot delete main.py!");
    if (!confirm("Are you sure you want to delete " + path + "?")) return;
    
    fileSystem = fileSystem.filter(f => f.path !== path);
    if (activeFilePath === path) selectFile("main.py");
    
    saveFileSystem(); 
    renderFileExplorer();
  }

  function deleteFolder(folderPath) {
    if (!confirm("Are you sure you want to delete the folder '" + folderPath + "' and all its contents?")) return;
    
    fileSystem = fileSystem.filter(f => !f.path.startsWith(folderPath + "/"));
    if (activeFilePath.startsWith(folderPath + "/")) selectFile("main.py");
    
    saveFileSystem(); 
    renderFileExplorer();
  }

  function applyThemeMode(themeName) {
    document.documentElement.dataset.theme = themeName;
    const btn = select("#theme-btn");
    if (themeName === "dark") btn.innerHTML = '<i class="fas fa-moon"></i> Theme';
    else if (themeName === "light") btn.innerHTML = '<i class="fas fa-sun"></i> Theme';
    else if (themeName === "kids") btn.innerHTML = '<i class="fas fa-child"></i> Theme';
  }

  function handleThemeToggle() {
    const currentTheme = document.documentElement.dataset.theme || "dark";
    let nextTheme = "dark";
    if (currentTheme === "dark") nextTheme = "light";
    else if (currentTheme === "light") nextTheme = "kids";
    
    applyThemeMode(nextTheme);
    userProgress.theme = nextTheme;
    try { GameStorage.saveProgress(userProgress); } catch(e) {}
  }

  function switchViewPanel(panelName) {
    selectAll(".nav-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.panel === panelName));
    select("#panel-lessons").classList.toggle("hidden", panelName !== "lessons");
    select("#panel-challenges").classList.toggle("hidden", panelName !== "challenges");
    select("#panel-badges").classList.toggle("hidden", panelName !== "badges");
    select("#panel-editor-info").classList.toggle("hidden", panelName !== "editor");
    select("#panel-files").classList.toggle("hidden", panelName !== "files");
  }

  function customPythonHint(editor) {
    const cur = editor.getCursor();
    const token = editor.getTokenAt(cur);
    const code = editor.getValue();
    const variables = new Set();
    const functions = new Set();
    
    code.split('\n').forEach(line => {
      let match;
      if (match = line.match(/^\s*([a-zA-Z_]\w*)\s*=/)) variables.add(match[1]);
      if (match = line.match(/^\s*def\s+([a-zA-Z_]\w*)\s*\(/)) functions.add(match[1]);
    });
    
    const builtins = ['print', 'input', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'if', 'else', 'elif', 'for', 'while', 'def', 'return', 'import', 'True', 'False', 'None'];
    const list = [];
    
    builtins.forEach(b => list.push({text: b, displayText: b + " (built-in)"}));
    variables.forEach(v => list.push({text: v, displayText: v + " (variable)"}));
    functions.forEach(f => list.push({text: f, displayText: f + " (function)"}));
    
    const filteredList = list.filter(item => item.text.toLowerCase().startsWith(token.string.toLowerCase()));
    
    if (filteredList.length > 0) {
      return { 
        list: filteredList, 
        from: CodeMirror.Pos(cur.line, token.start), 
        to: CodeMirror.Pos(cur.line, token.end) 
      };
    }
  }

  function setupCodeEditor() {
    editorInstance = CodeMirror.fromTextArea(select("#code-editor"), {
      mode: "python", 
      theme: "dracula", 
      lineNumbers: true, 
      indentUnit: 4, 
      tabSize: 4,
      lineWrapping: true, 
      autofocus: true, 
      matchBrackets: true, 
      autoCloseBrackets: true,
      extraKeys: { "Ctrl-Space": "autocomplete", "Ctrl-F": "find", "Ctrl-H": "replace" }
    });

    editorInstance.on("inputRead", function(editor, change) {
      if (change.origin === "+input" && change.text[0].match(/[a-zA-Z_]/)) {
        editor.showHint({ hint: customPythonHint, completeSingle: false });
      }
    });

    editorInstance.setSize("100%", "100%");
    let saveTimeout;
    
    editorInstance.on("change", () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => saveFileSystem(), 500);
    });

    editorInstance.on("keydown", (_, event) => {
      if (event.ctrlKey && event.key === "Enter") { 
        event.preventDefault(); 
        handleRunCode(); 
      }
    });
  }

  function setupNavigation() {
    selectAll(".nav-btn").forEach((btn) => btn.addEventListener("click", () => switchViewPanel(btn.dataset.panel)));
  }

  function setupActionListeners() {
    select("#run-btn").addEventListener("click", handleRunCode);
    select("#reset-btn").addEventListener("click", handleResetCode);
    select("#clear-console").addEventListener("click", clearConsoleOutput);
    select("#explain-btn").addEventListener("click", handleExplainCode);
    select("#fix-btn").addEventListener("click", handleSmartFixCode);
    select("#daily-btn").addEventListener("click", triggerDailyChallenge);
    select("#theme-btn").addEventListener("click", handleThemeToggle);
    select("#export-btn").addEventListener("click", exportProjectAsZip);
    select("#projects-btn").addEventListener("click", showWelcomeScreen);
    select("#create-project-btn").addEventListener("click", createNewProject);
    
    select("#open-tutorials-btn").addEventListener("click", () => { 
      hideWelcomeScreen(); 
      switchViewPanel("lessons"); 
    });
    
    select("#new-file-btn").addEventListener("click", () => createNewFile(""));
    select("#new-folder-btn").addEventListener("click", () => createNewFolder(""));
    select("#exit-task-btn").addEventListener("click", exitTask);
    select("#badge-close-btn").addEventListener("click", () => select("#badge-modal").classList.add("hidden"));
    
    select(".modal-backdrop")?.addEventListener("click", () => select("#badge-modal").classList.add("hidden"));
    
    select("#hint-1-btn").addEventListener("click", () => showHint(1));
    select("#hint-2-btn").addEventListener("click", () => showHint(2));
    select("#solution-btn").addEventListener("click", showSolution);

    select("#import-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      select("#import-dropdown").classList.toggle("hidden");
    });
    
    document.addEventListener("click", (e) => {
      if (!select("#import-btn").contains(e.target) && !select("#import-dropdown").contains(e.target)) {
        select("#import-dropdown").classList.add("hidden");
      }
    });
    
    select("#import-file-trigger").addEventListener("click", () => select("#import-file-input").click());
    select("#import-zip-trigger").addEventListener("click", () => select("#import-zip-input").click());
    select("#import-folder-trigger").addEventListener("click", () => select("#import-folder-input").click());
    
    select("#import-file-input").addEventListener("change", handleImportFile);
    select("#import-zip-input").addEventListener("change", handleImportZip);
    select("#import-folder-input").addEventListener("change", handleImportFolder);
  }

  function exitTask() {
    activeLesson = null;
    select("#interactive-question").classList.add("hidden");
    select("#lesson-hint-box").classList.add("hidden");
    select("#hints-container").classList.add("hidden");
    select("#exit-task-btn").classList.add("hidden");
    updateStatusText("Free Mode");
    switchViewPanel("files");
  }

  async function handleRunCode() {
    if (isExecutionPending) return;
    
    const runButton = select("#run-btn");
    isExecutionPending = true;
    runButton.innerHTML = "Running...";
    updateStatusText("Executing code...");
    clearConsoleOutput();
    saveFileSystem();
    
    const userCode = editorInstance.getValue();

    try {
      GameStorage.setMaxLines(userCode.split('\n').length);
      checkLinesAchievement();
    } catch(e) {}

    try {
      const result = await PythonRunner.runCode(userCode, fileSystem);
      result.output.forEach((line) => logToConsole(line.text, "stdout"));
      result.errors.forEach((line) => logToConsole(line.text, "stderr"));

      if (result.success && result.errors.length === 0) {
        if (lastRunHadError) {
          try {
            GameStorage.addBugFix();
            const bugs = GameStorage.loadProgress().bugsFixed;
            if (bugs >= 10 && !GameStorage.hasAchievement("bugs_10")) { 
              GameStorage.unlockAchievement("bugs_10"); 
              triggerBadgePopup("bugs_10"); 
            }
            renderAchievementsList();
          } catch(e) {}
        }
        
        lastRunHadError = false;
        
        try {
          if (!GameStorage.hasAchievement("first_program")) { 
            GameStorage.unlockAchievement("first_program"); 
            triggerBadgePopup("first_program"); 
            renderAchievementsList(); 
          }
          if (userCode.includes("def ") && GameStorage.unlockAchievement("first_function")) { 
            triggerBadgePopup("first_function"); 
            renderAchievementsList(); 
          }
        } catch(e) {}
        
        if (activeLesson) verifyTaskCompletion(result.output);
        
      } else { 
        lastRunHadError = true; 
      }
      updateXpDisplay();
    } catch (error) {
      logToConsole("System error: " + error.message, "stderr");
      lastRunHadError = true;
    } finally {
      isExecutionPending = false;
      runButton.innerHTML = '<i class="fas fa-play"></i> Run';
    }
  }

  function verifyTaskCompletion(output) {
    if (!activeLesson || !activeLesson.expected) return;
    
    const isCorrect = PythonRunner.checkLessonOutput(output, activeLesson.expected);
    if (!isCorrect) return logToConsole("[ERROR] The output is incorrect. Try again!", "stderr");

    try {
      if (activeLesson.id?.startsWith("d")) {
        const today = new Date().toDateString();
        if (localStorage.getItem("codekids_last_daily_v3") !== today) {
          localStorage.setItem("codekids_last_daily_v3", today);
          userProgress = GameStorage.loadProgress();
          userProgress.xp += activeLesson.xp;
          GameStorage.saveProgress(userProgress);
          
          updateXpDisplay();
          logToConsole(`[SUCCESS] Daily Challenge solved! +${activeLesson.xp} XP`, "success");
          checkDailyChallenge();
          
          select("#lesson-hint-box").classList.add("hidden"); 
          select("#hints-container").classList.add("hidden"); 
          select("#interactive-question").classList.add("hidden");
          updateStatusText("Challenge Completed!");
        }
      } else if (activeLesson.id?.startsWith("c")) {
        if (!GameStorage.isChallengeComplete(activeLesson.id)) {
          GameStorage.completeChallenge(activeLesson.id, activeLesson.xp);
          renderChallengesList(); 
          updateXpDisplay();
          
          logToConsole(`[SUCCESS] Challenge completed! +${activeLesson.xp} XP`, "success");
          select("#lesson-hint-box").classList.add("hidden"); 
          select("#hints-container").classList.add("hidden"); 
          select("#interactive-question").classList.add("hidden");
          updateStatusText("Challenge Completed!");
        }
      } else {
        if (!GameStorage.isLessonComplete(activeLesson.id)) {
          const alreadyEarnedBadge = GameStorage.hasBadge(activeLesson.badge);
          userProgress = GameStorage.completeLesson(activeLesson.id, activeLesson.badge, activeLesson.xp);
          
          renderLessonsList(); 
          renderBadgesGrid(); 
          updateXpDisplay();
          
          if (!alreadyEarnedBadge && activeLesson.badge) triggerBadgePopup(activeLesson.badge);
          
          logToConsole(`[SUCCESS] Lesson completed! +${activeLesson.xp} XP`, "success");
          select("#lesson-hint-box").classList.add("hidden"); 
          select("#hints-container").classList.add("hidden"); 
          select("#interactive-question").classList.add("hidden");
          updateStatusText("Lesson Completed!");
        }
      }
    } catch(e) { 
      logToConsole("Progress calculated, but could not be saved permanently.", "stderr"); 
    }
  }

  function renderLessonsList() {
    const container = select("#lessons-list");
    container.innerHTML = "";
    
    LESSONS.forEach((lesson) => {
      let isDone = false;
      try { isDone = GameStorage.isLessonComplete(lesson.id); } catch(e) {}
      
      const card = document.createElement("div");
      card.className = `lesson-card ${isDone ? "done" : ""} ${activeLesson?.id === lesson.id ? "active" : ""}`;
      card.innerHTML = `<div><h4>${lesson.title}</h4><p>${lesson.description}</p></div>`;
      card.addEventListener("click", () => selectLesson(lesson));
      container.appendChild(card);
    });
    
    const completedCount = userProgress.completedLessons.length;
    select("#progress-label").textContent = `${completedCount} / ${LESSONS.length} lessons`;
  }

  function renderChallengesList() {
    const container = select("#challenges-list");
    container.innerHTML = "";
    
    CHALLENGES.forEach((ch) => {
      let isDone = false;
      try { isDone = GameStorage.isChallengeComplete(ch.id); } catch(e) {}
      
      const card = document.createElement("div");
      card.className = `lesson-card ${isDone ? "done" : ""}`;
      card.innerHTML = `<div><h4>${ch.title}</h4><p>${ch.description}</p></div>`;
      card.addEventListener("click", () => selectChallenge(ch));
      container.appendChild(card);
    });
  }

  function selectLesson(lesson, shouldSave = true, isInit = false) {
    activeLesson = lesson;
    select("#exit-task-btn").classList.remove("hidden");
    
    if (editorInstance && !isInit && lesson.code) {
      editorInstance.setValue(lesson.code);
      let fileIndex = fileSystem.findIndex(f => f.path === activeFilePath);
      if (fileIndex !== -1) fileSystem[fileIndex].code = lesson.code;
      saveFileSystem();
    }
    
    setupTaskUI(lesson);
    if (shouldSave) { 
      try { 
        userProgress.currentLesson = lesson.id; 
        GameStorage.saveProgress(userProgress); 
      } catch(e) {} 
    }
    
    renderLessonsList();
    if (lesson.title) updateStatusText(`Active lesson: ${lesson.title}`);
    switchViewPanel("editor");
  }

  function selectChallenge(challenge) {
    activeLesson = challenge;
    select("#exit-task-btn").classList.remove("hidden");
    
    if (challenge.code) {
      editorInstance.setValue(challenge.code);
      let fileIndex = fileSystem.findIndex(f => f.path === activeFilePath);
      if (fileIndex !== -1) fileSystem[fileIndex].code = challenge.code;
      saveFileSystem();
    }
    
    setupTaskUI(challenge);
    renderChallengesList();
    updateStatusText(`Challenge: ${challenge.title}`);
    switchViewPanel("editor");
  }

  function setupTaskUI(task) {
    if (task.question) { 
      select("#interactive-question").classList.remove("hidden"); 
      select("#question-text").textContent = task.question; 
    } else {
      select("#interactive-question").classList.add("hidden");
    }
    
    if (task.hints?.length > 0) {
      select("#hints-container").classList.remove("hidden"); 
      select("#hint-1-btn").classList.remove("hidden");
      select("#hint-2-btn").classList.add("hidden"); 
      select("#solution-btn").classList.add("hidden"); 
      select("#hint-text-display").textContent = "";
    } else {
      select("#hints-container").classList.add("hidden");
    }
    
    if (task.hint) { 
      select("#lesson-hint-box").classList.remove("hidden"); 
      select("#lesson-hint-text").textContent = task.hint; 
    } else {
      select("#lesson-hint-box").classList.add("hidden");
    }
  }

  function showHint(level) {
    if (!activeLesson?.hints) return;
    const display = select("#hint-text-display");
    
    if (level === 1 && activeLesson.hints[0]) { 
      display.textContent = "Hint 1: " + activeLesson.hints[0]; 
      select("#hint-1-btn").classList.add("hidden"); 
      select("#hint-2-btn").classList.remove("hidden"); 
    } else if (level === 2 && activeLesson.hints[1]) { 
      display.textContent += "\n\nHint 2: " + activeLesson.hints[1]; 
      select("#hint-2-btn").classList.add("hidden"); 
      select("#solution-btn").classList.remove("hidden"); 
    }
  }

  function showSolution() {
    if (!activeLesson?.solution) return logToConsole("No predefined solution available.", "stderr");
    
    if (confirm("Are you sure you want to see the solution?")) {
      editorInstance.setValue(activeLesson.solution);
      let fileIndex = fileSystem.findIndex(f => f.path === activeFilePath);
      if (fileIndex !== -1) fileSystem[fileIndex].code = activeLesson.solution;
      saveFileSystem();
      logToConsole("Solution loaded. Study it carefully!", "success");
    }
  }

  function handleExplainCode() {
    const selectedCode = editorInstance.getSelection() || editorInstance.getValue();
    if (!selectedCode.trim()) return logToConsole("Please select the code first!", "stderr");
    
    logToConsole("Analyzing code...", "stdout");
    let explanation = "";
    
    let hasLoop = selectedCode.includes('for ') || selectedCode.includes('while ');
    let hasPrint = selectedCode.includes('print(');
    let hasDef = selectedCode.includes('def ');
    let hasIf = selectedCode.includes('if ');
    
    if (hasLoop && hasPrint) explanation += "This code uses a loop to repeat an action and displays output on the screen.\n\n";
    else if (hasDef) explanation += "This code defines a function that you can use later in the program.\n\n";
    else if (hasIf) explanation += "This code makes decisions based on conditions.\n\n";
    else if (hasPrint) explanation += "This code prints something on the screen.\n\n";

    explanation += "Detailed analysis:\n";
    
    selectedCode.split('\n').forEach((line, i) => {
      let lineExp = "";
      let trimmed = line.trim();
      
      let forMatch = trimmed.match(/for\s+(\w+)\s+in\s+range\((\d+)\)/);
      let whileMatch = trimmed.match(/while\s+(.*):/);
      let printStrMatch = trimmed.match(/print\(["'](.*)["']\)/);
      let printVarMatch = trimmed.match(/print\((.*)\)/);
      let varMatch = trimmed.match(/^(\w+)\s*=\s*(.*)/);
      let ifMatch = trimmed.match(/if\s+(.*):/);
      let defMatch = trimmed.match(/def\s+(\w+)\s*\((.*)\):/);
      let importMatch = trimmed.match(/import\s+(\w+)/);
      
      if (forMatch) lineExp = `Creates a loop that repeats ${forMatch[2]} times.`;
      else if (whileMatch) lineExp = "Repeats the code as long as a condition is true.";
      else if (printStrMatch) lineExp = `Prints the text '${printStrMatch[1]}'.`;
      else if (printVarMatch) lineExp = `Prints the value of the variable '${printVarMatch[1]}'.`;
      else if (varMatch && !trimmed.includes('==')) lineExp = `Saves the value '${varMatch[2]}' in the variable '${varMatch[1]}'.`;
      else if (ifMatch) lineExp = "Checks a condition. If true, runs the code block below it.";
      else if (defMatch) lineExp = `Defines a new function named '${defMatch[1]}'.`;
      else if (importMatch) lineExp = `Imports the module '${importMatch[1]}' to use its functions.`;
      else if (trimmed === '') lineExp = "(Empty line)";
      else lineExp = "Executes a Python statement.";
      
      if (lineExp) explanation += `Line ${i+1}: ${lineExp}\n`;
    });
    
    const explainDiv = document.createElement("div");
    explainDiv.className = "code-explanation";
    explainDiv.textContent = explanation;
    select("#console-output").appendChild(explainDiv);
  }

  function handleSmartFixCode() {
    let code = editorInstance.getValue();
    let fixes = [];
    let newCode = code;
    
    if (/\bprin\b/.test(newCode)) { 
      newCode = newCode.replace(/\bprin\b/g, 'print'); 
      fixes.push("Corrected 'prin' to 'print'."); 
    }
    if (/\bflase\b/.test(newCode)) { 
      newCode = newCode.replace(/\bflase\b/g, 'False'); 
      fixes.push("Corrected 'flase' to 'False'."); 
    }
    if (/\bture\b/.test(newCode)) { 
      newCode = newCode.replace(/\bture\b/g, 'True'); 
      fixes.push("Corrected 'ture' to 'True'."); 
    }

    const lines = newCode.split('\n');
    const fixedLines = lines.map(line => {
      let trimmed = line.trim();
      let match = trimmed.match(/^(if|elif|else|for|while|def|class)\b.*[^:]$/);
      if (match) {
        if (trimmed.endsWith(')') || trimmed.endsWith('"') || trimmed.endsWith("'") || trimmed.endsWith(']')) {
          fixes.push(`Added ':' to the end of the line: "${trimmed}"`);
          return line + ':';
        }
      }
      return line;
    });
    
    newCode = fixedLines.join('\n');

    if (/print\s+["']/.test(newCode)) {
      newCode = newCode.replace(/print\s+(["'])/g, 'print($1').replace(/(["'])\s*$/gm, '$1)');
      fixes.push("Added missing parentheses to the print() function.");
    }

    if (fixes.length > 0) {
      editorInstance.setValue(newCode);
      logToConsole("Applied the following automatic fixes:", "success");
      fixes.forEach(f => logToConsole(" - " + f, "stdout"));
      logToConsole("Try pressing Run again!", "success");
      lastRunHadError = false;
    } else {
      logToConsole("Found no common syntax errors to automatically fix.", "stdout");
      logToConsole("If the code still doesn't work, check your indentation (spaces at the beginning of the line) or the program's logic.", "stderr");
    }
  }

  function checkLinesAchievement() {
    try {
      const lines = GameStorage.loadProgress().maxLines || 0;
      if (lines >= 100 && !GameStorage.hasAchievement("lines_100")) {
        GameStorage.unlockAchievement("lines_100"); 
        triggerBadgePopup("lines_100"); 
        renderAchievementsList();
      }
    } catch(e) {}
  }

  function checkDailyChallenge() {
    const today = new Date().toDateString();
    let lastDaily = null;
    try { lastDaily = localStorage.getItem("codekids_last_daily_v3"); } catch(e) {}
    
    if (lastDaily !== today) {
      select("#daily-btn").classList.add("btn-run");
    } else {
      select("#daily-btn").classList.remove("btn-run");
    }
  }

  function triggerDailyChallenge() {
    const today = new Date().toDateString();
    let lastDaily = null;
    try { lastDaily = localStorage.getItem("codekids_last_daily_v3"); } catch(e) {}
    
    const challenge = DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)];
    
    if (lastDaily !== today) {
      logToConsole(`[DAILY CHALLENGE] ${challenge.prompt}`, "success");
      logToConsole(`Write the code in the editor and press Run! Reward: +${challenge.xp} XP`, "stdout");
      
      activeLesson = { 
        id: challenge.id, 
        title: "Daily Challenge", 
        expected: challenge.expected, 
        xp: challenge.xp, 
        badge: null, 
        code: ``,
        hint: "Read the requirements carefully.", 
        hints: [], 
        solution: null, 
        question: null
      };
      
      select("#exit-task-btn").classList.remove("hidden");
      editorInstance.setValue(activeLesson.code);
      
      let fileIndex = fileSystem.findIndex(f => f.path === activeFilePath);
      if (fileIndex !== -1) fileSystem[fileIndex].code = activeLesson.code;
      saveFileSystem();
      
      setupTaskUI(activeLesson);
      updateStatusText("Daily Challenge");
      switchViewPanel("editor");
    } else { 
      logToConsole("You've already solved today's challenge! Come back tomorrow.", "stdout"); 
    }
  }

  function renderBadgesGrid() {
    const grid = select("#badges-grid"); 
    grid.innerHTML = "";
    
    try { userProgress = GameStorage.loadProgress(); } catch(e) {}
    
    Object.entries(BADGES).forEach(([id, badge]) => {
      const isEarned = userProgress.badges.includes(id);
      const element = document.createElement("div");
      element.className = `badge-item ${isEarned ? "earned" : "locked"}`;
      element.innerHTML = `<h4>${badge.name}</h4><p>${badge.description}</p>`;
      grid.appendChild(element);
    });
  }

  function renderAchievementsList() {
    const list = select("#achievements-list");
    if (!list) return;
    list.innerHTML = "";
    
    let data = {};
    try { data = GameStorage.loadProgress(); } catch(e) { data = userProgress; }
    
    const streak = data.streak || 0; 
    const bugs = data.bugsFixed || 0; 
    const lines = data.maxLines || 0;
    
    Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
      const isEarned = (data.achievements || []).includes(id);
      let progressText = "";
      
      if (id === "bugs_10") progressText = ` (${bugs}/10)`;
      if (id === "lines_100") progressText = ` (${lines}/100 lines)`;
      if (id === "streak_7") progressText = ` (${streak}/7 days)`;
      
      const element = document.createElement("div");
      element.className = `achievement-item ${isEarned ? "earned" : "locked"}`;
      element.innerHTML = `<div class="achievement-info"><h4>${ach.name}</h4><p>${ach.desc} <span style="color: var(--text-muted);">${progressText}</span></p></div><div class="achievement-xp">+${ach.xp} XP</div>`;
      list.appendChild(element);
    });
    
    try {
      if (streak >= 7 && !GameStorage.hasAchievement("streak_7")) {
        GameStorage.unlockAchievement("streak_7"); 
        triggerBadgePopup("streak_7"); 
        renderAchievementsList();
      }
    } catch(e) {}
  }

  function triggerBadgePopup(id) {
    let data;
    if (ACHIEVEMENTS[id]) data = ACHIEVEMENTS[id];
    else if (BADGES[id]) data = BADGES[id];
    
    if (!data) return;
    
    select("#badge-unlock-name").textContent = data.name;
    select("#badge-unlock-desc").textContent = data.description || data.desc;
    select("#badge-modal").classList.remove("hidden");
    updateXpDisplay();
  }

  function updateXpDisplay() {
    try { userProgress = GameStorage.loadProgress(); } catch(e) {}
    
    const { level, pct, xp } = GameStorage.getXpProgress(userProgress.xp || 0);
    select("#level-badge").textContent = `Level ${level}`;
    select("#xp-fill").style.width = `${pct}%`;
    select("#xp-text").textContent = `${xp} XP`;
  }

  function logToConsole(text, type = "stdout") {
    const consoleView = select("#console-output");
    const defaultMessage = consoleView.querySelector(".console-welcome");
    
    if (defaultMessage) defaultMessage.remove();
    if (consoleView.children.length > 50) consoleView.removeChild(consoleView.firstChild);
    
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
    const initialCode = activeLesson?.code ? activeLesson.code : DEFAULT_CODE;
    editorInstance.setValue(initialCode);
    
    let fileIndex = fileSystem.findIndex(f => f.path === activeFilePath);
    if (fileIndex !== -1) fileSystem[fileIndex].code = initialCode;
    
    try { saveFileSystem(); } catch(e) {}
    
    clearConsoleOutput();
    updateStatusText("Code reset.");
  }

  initializeApp();
});