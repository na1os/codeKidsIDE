document.addEventListener("DOMContentLoaded", () => {
  let editorInstance;
  let activeLesson = null;
  let userProgress = {};
  let isExecutionPending = false;
  let lastRunHadError = false;
  let lastErrorLine = null;
  let isTyping = false;
  
  let projects = {};
  let activeProjectName = null;
  let fileSystem = [];
  let activeFilePath = "main.py";
  
  let syncInterval = null;
  let lastPushedData = "";

  const select = (s) => document.querySelector(s);
  const selectAll = (s) => document.querySelectorAll(s);

  function bindClick(id, fn) {
    const el = select(id);
    if (el) el.addEventListener("click", fn);
  }

  try { 
    userProgress = GameStorage.loadProgress(); 
  } catch (e) { 
    userProgress = { xp: 0, completedLessons: [], badges: [], completedChallenges: [], achievements: [], maxLines: 0, bugsFixed: 0, streak: 0, currentLesson: null, theme: "dark" }; 
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
      
      try { GameStorage.updateStreak(); renderAchievementsList(); checkDailyChallenge(); } catch (e) {}
      try { await PythonRunner.runCode("", []); } catch (e) { logToConsole("Error: Python environment could not be started.", "stderr"); }
    } catch (err) {
      console.error("Critical error:", err);
    } finally {
      select("#loading").classList.add("hidden");
      showWelcomeScreen();
    }
  }

  function startLiveSync() {
    if (syncInterval) clearInterval(syncInterval);
    
    pushToDesktop(true);
    
    syncInterval = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/sync');
        const data = await res.json();
        const remoteStr = JSON.stringify(data);
        
        if (remoteStr !== lastPushedData) {
          let filesChanged = JSON.stringify(data.files) !== JSON.stringify(fileSystem);
          let progressChanged = JSON.stringify(data.progress) !== JSON.stringify(userProgress);
          
          if (filesChanged) {
            fileSystem = data.files;
            renderFileExplorer();
            
            const activeFile = fileSystem.find(f => f.path === activeFilePath);
            if (activeFile && !editorInstance.hasFocus()) {
              const currActiveCode = editorInstance.getValue();
              if (activeFile.code !== currActiveCode) {
                editorInstance.setValue(activeFile.code || "");
              }
            }
          }
          if (progressChanged) {
            userProgress = data.progress;
            try { GameStorage.saveProgress(userProgress); } catch(e){}
            updateXpDisplay();
            renderBadgesGrid();
            renderAchievementsList();
          }
        }
      } catch (e) {}
    }, 1500);
  }

  async function pushToDesktop(force = false) {
    if (!editorInstance) return;
    const data = { files: fileSystem, progress: userProgress };
    const dataStr = JSON.stringify(data);
    if (!force && dataStr === lastPushedData) return;
    lastPushedData = dataStr;
    try {
      await fetch('http://127.0.0.1:8000/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dataStr
      });
    } catch (e) {}
  }

  async function toggleDesktopLink() {
    if (syncInterval) {
      clearInterval(syncInterval); 
      syncInterval = null;
      select("#sync-btn").innerHTML = '<i class="fas fa-link"></i> Link Desktop';
      showToast("Disconnected from Desktop.", "info");
      return;
    }
    
    const accepted = await customModal({ title: "Desktop Connection", msg: "To connect the site to the Desktop app, the browser will ask for permission to access local devices. Press OK to continue.", isConfirm: true });
    if (!accepted) return;
    
    select("#sync-btn").innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    
    try {
      const res = await fetch('http://127.0.0.1:8000/sync');
      if (res.ok) {
        showToast("Connected to Desktop app!", "success");
        select("#sync-btn").innerHTML = '<i class="fas fa-unlink"></i> Stop Sync';
        startLiveSync();
      } else { 
        throw new Error("Server not responding"); 
      }
    } catch (e) {
      showToast("Connection refused. Make sure the Desktop app is running and you are using Live Server.", "error");
      select("#sync-btn").innerHTML = '<i class="fas fa-link"></i> Link Desktop';
    }
  }

  function showToast(msg, type = 'info') {
    const t = document.createElement("div"); 
    t.className = `toast ${type}`; 
    t.textContent = msg;
    const container = select("#toast-container");
    if (container) container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  function customModal({ title, msg, isPrompt = false, isConfirm = false }) {
    return new Promise(resolve => {
      const tEl = select("#cm-title"); if(tEl) tEl.textContent = title;
      const mEl = select("#cm-msg"); if(mEl) mEl.textContent = msg;
      const input = select("#cm-input");
      const codeArea = select("#cm-code-area");
      if (codeArea) codeArea.classList.add("hidden");
      if (isPrompt && input) { input.classList.remove("hidden"); input.value = ""; } else if(input) input.classList.add("hidden");
      const okBtn = select("#cm-ok");
      const cancelBtn = select("#cm-cancel");
      if (okBtn) okBtn.textContent = isConfirm ? "Yes" : "OK";
      if (cancelBtn) cancelBtn.classList.toggle("hidden", !isConfirm);
      const modal = select("#custom-modal"); 
      if(modal) modal.classList.remove("hidden");
      const cleanup = (v) => { 
        if(modal) modal.classList.add("hidden"); 
        if(okBtn) okBtn.onclick = null; 
        if(cancelBtn) cancelBtn.onclick = null; 
        resolve(v); 
      };
      if (okBtn) okBtn.onclick = () => cleanup(isPrompt && input ? input.value : true);
      if (isConfirm && cancelBtn) cancelBtn.onclick = () => cleanup(false);
    });
  }

  function loadProjects() {
    try { const s = localStorage.getItem("codekids_projects_v1"); if (s) projects = JSON.parse(s); } catch (e) { projects = {}; }
    if (Object.keys(projects).length === 0) projects["New Project"] = [{ path: 'main.py', code: DEFAULT_CODE }];
  }

  function saveProjects() {
    try { 
      if (editorInstance && activeProjectName) { 
        let i = fileSystem.findIndex(f => f.path === activeFilePath); 
        if (i !== -1) fileSystem[i].code = editorInstance.getValue(); 
      } 
      localStorage.setItem("codekids_projects_v1", JSON.stringify(projects)); 
    } catch (e) {}
    pushToDesktop();
  }

  function showWelcomeScreen() {
    const l = select("#recent-projects-list"); 
    if(!l) return; 
    l.innerHTML = "";
    Object.keys(projects).forEach(n => {
      const i = document.createElement("div"); 
      i.className = "project-list-item";
      i.innerHTML = `<span><i class="fas fa-folder"></i> ${n}</span> <i class="fas fa-trash delete-project-btn" data-name="${n}"></i>`;
      i.addEventListener("click", async (e) => {
        if (e.target.classList.contains('delete-project-btn')) { 
          if (await customModal({ title: "Delete", msg: `Are you sure you want to delete ${n}?`, isConfirm: true })) { 
            delete projects[n]; saveProjects(); showWelcomeScreen(); 
          } 
        } else {
          openProject(n);
        }
      }); 
      l.appendChild(i);
    }); 
    select("#welcome-screen").classList.remove("hidden");
  }

  function openProject(n) {
    activeProjectName = n; 
    fileSystem = projects[n] || [{ path: 'main.py', code: DEFAULT_CODE }]; 
    activeFilePath = "main.py";
    const f = fileSystem.find(f => f.path === activeFilePath); 
    editorInstance.setValue(f ? f.code : DEFAULT_CODE);
    renderFileExplorer(); 
    select("#welcome-screen").classList.add("hidden"); 
    switchViewPanel("files");
    if (!localStorage.getItem("codekids_onboarding_done")) startOnboarding();
  }

  async function createNewProject() {
    const n = await customModal({ title: "New Project", msg: "Enter name:", isPrompt: true }); 
    if (!n) return;
    if (projects[n]) return showToast("Already exists!", "error");
    projects[n] = [{ path: 'main.py', code: DEFAULT_CODE }]; 
    saveProjects(); 
    openProject(n);
  }

  function exportProjectAsZip() {
    if (!activeProjectName || typeof JSZip === 'undefined') return; 
    saveProjects(); 
    const z = new JSZip();
    fileSystem.forEach(f => z.file(f.path, f.code));
    z.generateAsync({type:"blob"}).then(c => { 
      const l = document.createElement('a'); 
      l.href = URL.createObjectURL(c); 
      l.download = `${activeProjectName}.zip`; 
      document.body.appendChild(l); 
      l.click(); 
      document.body.removeChild(l); 
      showToast("Exported as ZIP.", "success"); 
    });
  }

  function handleImportFile(e) { 
    for (const f of e.target.files) { 
      const r = new FileReader(); 
      r.onload = (ev) => addImportedFile(f.name, ev.target.result); 
      r.readAsText(f); 
    } 
    e.target.value = ""; 
    const d = select("#import-dropdown"); 
    if(d) d.classList.add("hidden"); 
  }

  function handleImportZip(e) { 
    const f = e.target.files[0]; 
    if (!f) return; 
    JSZip.loadAsync(f).then(z => z.forEach((p, e) => { 
      if (!e.dir) e.async("string").then(c => addImportedFile(p, c)); 
    })).catch(() => showToast("Unzip error", "error")); 
    e.target.value = ""; 
    const d = select("#import-dropdown"); 
    if(d) d.classList.add("hidden"); 
  }

  function handleImportFolder(e) { 
    for (const f of e.target.files) { 
      const p = f.webkitRelativePath; 
      if (p.endsWith('.py') || p.endsWith('.txt')) { 
        const r = new FileReader(); 
        r.onload = (ev) => addImportedFile(p, ev.target.result); 
        r.readAsText(f); 
      } 
    } 
    e.target.value = ""; 
    const d = select("#import-dropdown"); 
    if(d) d.classList.add("hidden"); 
  }

  function addImportedFile(p, c) { 
    if (fileSystem.some(f => f.path === p)) fileSystem.find(f => f.path === p).code = c; 
    else fileSystem.push({ path: p, code: c }); 
    saveFileSystem(); 
    renderFileExplorer(); 
    selectFile(p); 
    showToast(`Imported: ${p}`, "success"); 
  }

  function saveFileSystem() { if (activeProjectName) saveProjects(); }
  
  function buildTree() { 
    const r = { name: "", path: "", files: [], folders: {} }; 
    fileSystem.forEach(f => { 
      const p = f.path.split('/'); 
      let c = r; 
      for (let i = 0; i < p.length - 1; i++) { 
        const n = p[i], pt = p.slice(0, i + 1).join('/'); 
        if (!c.folders[n]) c.folders[n] = { name: n, path: pt, files: [], folders: {} }; 
        c = c.folders[n]; 
      } 
      c.files.push(f); 
    }); 
    return r; 
  }

  function renderFileExplorer() { 
    const c = select("#file-explorer"); 
    if(!c) return; 
    c.innerHTML = ""; 
    renderTreeLevel(buildTree(), c, 0); 
    const t = select("#active-file-tab"); 
    if(t) t.textContent = activeFilePath; 
  }

  function renderTreeLevel(n, c, l) {
    Object.keys(n.folders).sort().forEach(fN => { 
      const f = n.folders[fN], e = document.createElement("div"); 
      e.className = "tree-item tree-folder"; 
      e.style.marginLeft = `${l * 15}px`; 
      e.innerHTML = `<i class="fas fa-chevron-down"></i> <i class="fas fa-folder"></i> ${fN} <div class="file-actions"><i class="fas fa-file-circle-plus new-file-in-folder-btn" data-path="${f.path}"></i><i class="fas fa-folder-plus new-folder-in-folder-btn" data-path="${f.path}"></i><i class="fas fa-trash delete-folder-btn" data-path="${f.path}"></i></div>`; 
      const ch = document.createElement("div"); 
      ch.className = "tree-children"; 
      e.addEventListener("click", ev => { 
        ev.stopPropagation(); 
        if (ev.target.classList.contains('delete-folder-btn')) deleteFolder(ev.target.dataset.path); 
        else if (ev.target.classList.contains('new-file-in-folder-btn')) createNewFile(ev.target.dataset.path); 
        else if (ev.target.classList.contains('new-folder-in-folder-btn')) createNewFolder(ev.target.dataset.path); 
        else { e.classList.toggle("collapsed"); ch.classList.toggle("hidden"); } 
      }); 
      c.appendChild(e); 
      renderTreeLevel(f, ch, l + 1); 
      c.appendChild(ch); 
    });
    [...n.files].sort((a, b) => a.path.localeCompare(b.path)).forEach(f => c.appendChild(createFileElement(f.path, f.path.split('/').pop(), l)));
  }

  function createFileElement(p, d, l) { 
    const e = document.createElement("div"); 
    e.className = `tree-item ${p === activeFilePath ? "active" : ""}`; 
    e.style.marginLeft = `${l * 15}px`; 
    e.innerHTML = `<i class="fas fa-file-code"></i> <span>${d || p}</span> <div class="file-actions">${p !== 'main.py' ? `<i class="fas fa-pen edit-file-btn" data-path="${p}"></i> <i class="fas fa-trash delete-file-btn" data-path="${p}"></i>` : ''}</div>`; 
    e.addEventListener("click", ev => { 
      if (ev.target.classList.contains('delete-file-btn')) { ev.stopPropagation(); deleteFile(ev.target.dataset.path); } 
      else if (ev.target.classList.contains('edit-file-btn')) { ev.stopPropagation(); renameFile(ev.target.dataset.path); } 
      else selectFile(p); 
    }); 
    return e; 
  }

  function selectFile(p) { 
    if (editorInstance) { 
      let i = fileSystem.findIndex(f => f.path === activeFilePath); 
      if (i !== -1) fileSystem[i].code = editorInstance.getValue(); 
    } 
    activeFilePath = p; 
    const f = fileSystem.find(f => f.path === p); 
    if (f) { editorInstance.setValue(f.code || ""); renderFileExplorer(); } 
  }

  async function createNewFile(t = "") { 
    const n = await customModal({ title: "New File", msg: `Name ${t ? 'in ' + t : ''}:`, isPrompt: true }); 
    if (!n) return; 
    let fN = n.endsWith('.py') ? n : n + '.py'; 
    let p = t ? `${t}/${fN}` : fN; 
    if (fileSystem.some(f => f.path === p)) return showToast("Exists!", "error"); 
    fileSystem.push({ path: p, code: "" }); 
    saveFileSystem(); 
    selectFile(p); 
  }

  async function createNewFolder(t = "") { 
    const n = await customModal({ title: "New Folder", msg: `Name ${t ? 'in ' + t : ''}:`, isPrompt: true }); 
    if (!n) return; 
    let p = t ? `${t}/${n}` : n; 
    let i = p + "/__init__.py"; 
    if (fileSystem.some(f => f.path === i)) return showToast("Exists!", "error"); 
    fileSystem.push({ path: i, code: "" }); 
    saveFileSystem(); 
    renderFileExplorer(); 
    showToast("Folder created!", "success"); 
  }

  async function renameFile(p) { 
    const n = await customModal({ title: "Rename", msg: "New name:", isPrompt: true }); 
    if (!n || n === p) return; 
    let fN = n.endsWith('.py') ? n : n + '.py'; 
    const pD = p.includes('/') ? p.substring(0, p.lastIndexOf('/')) : ""; 
    let fP = pD ? `${pD}/${fN}` : fN; 
    if (fileSystem.some(f => f.path === fP)) return showToast("Exists!", "error"); 
    fileSystem.find(f => f.path === p).path = fP; 
    if (activeFilePath === p) activeFilePath = fP; 
    saveFileSystem(); 
    renderFileExplorer(); 
  }

  async function deleteFile(p) { 
    if (p === "main.py") return showToast("Cannot delete main.py!", "error"); 
    if (!await customModal({ title: "Delete", msg: `Are you sure you want to delete ${p}?`, isConfirm: true })) return; 
    fileSystem = fileSystem.filter(f => f.path !== p); 
    if (activeFilePath === p) selectFile("main.py"); 
    saveFileSystem(); 
    renderFileExplorer(); 
  }

  async function deleteFolder(fP) { 
    if (!await customModal({ title: "Delete Folder", msg: `Are you sure you want to delete ${fP}?`, isConfirm: true })) return; 
    fileSystem = fileSystem.filter(f => !f.path.startsWith(fP + "/")); 
    if (activeFilePath.startsWith(fP + "/")) selectFile("main.py"); 
    saveFileSystem(); 
    renderFileExplorer(); 
  }

  function applyThemeMode(t) { 
    document.documentElement.dataset.theme = t; 
    const b = select("#theme-btn"); 
    if(b) b.innerHTML = t === "dark" ? '<i class="fas fa-moon"></i> Theme' : t === "light" ? '<i class="fas fa-sun"></i> Theme' : '<i class="fas fa-rocket"></i> Theme'; 
  }

  function handleThemeToggle() { 
    const c = document.documentElement.dataset.theme || "dark"; 
    let n = "dark"; 
    if (c === "dark") n = "light"; 
    else if (c === "light") n = "kids"; 
    applyThemeMode(n); 
    userProgress.theme = n; 
    try { GameStorage.saveProgress(userProgress); } catch(e) {} 
  }

  function switchViewPanel(p) { 
    selectAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.panel === p)); 
    const pl = select("#panel-lessons"); if(pl) pl.classList.toggle("hidden", p !== "lessons"); 
    const pc = select("#panel-challenges"); if(pc) pc.classList.toggle("hidden", p !== "challenges"); 
    const pb = select("#panel-badges"); if(pb) pb.classList.toggle("hidden", p !== "badges"); 
    const pe = select("#panel-editor-info"); if(pe) pe.classList.toggle("hidden", p !== "editor"); 
    const pf = select("#panel-files"); if(pf) pf.classList.toggle("hidden", p !== "files"); 
  }

  function customPythonHint(ed) { 
    const c = ed.getCursor(), t = ed.getTokenAt(c), code = ed.getValue(), v = new Set(), f = new Set(); 
    code.split('\n').forEach(l => { 
      let m; 
      if (m = l.match(/^\s*([a-zA-Z_]\w*)\s*=/)) v.add(m[1]); 
      if (m = l.match(/^\s*def\s+([a-zA-Z_]\w*)\s*\(/)) f.add(m[1]); 
    }); 
    const b = ['print', 'input', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'if', 'else', 'elif', 'for', 'while', 'def', 'return', 'import']; 
    const list = []; 
    b.forEach(x => list.push({text: x, displayText: x + " (built-in)"})); 
    v.forEach(x => list.push({text: x, displayText: x + " (variable)"})); 
    f.forEach(x => list.push({text: x, displayText: x + " (function)"})); 
    const fl = list.filter(i => i.text.toLowerCase().startsWith(t.string.toLowerCase())); 
    if (fl.length > 0) return { list: fl, from: CodeMirror.Pos(c.line, t.start), to: CodeMirror.Pos(c.line, t.end) }; 
  }

  function setupCodeEditor() { 
    editorInstance = CodeMirror.fromTextArea(select("#code-editor"), { 
      mode: "python", theme: "dracula", lineNumbers: true, indentUnit: 4, tabSize: 4, 
      lineWrapping: true, autofocus: true, matchBrackets: true, autoCloseBrackets: true, 
      extraKeys: { "Ctrl-Space": "autocomplete", "Ctrl-F": "find", "Ctrl-H": "replace" } 
    }); 
    editorInstance.on("inputRead", (ed, ch) => { 
      if (ch.origin === "+input" && ch.text[0].match(/[a-zA-Z_]/)) ed.showHint({ hint: customPythonHint, completeSingle: false }); 
    }); 
    editorInstance.setSize("100%", "100%"); 
    let st; 
    editorInstance.on("change", () => { 
      isTyping = true; 
      clearTimeout(st); 
      st = setTimeout(() => { isTyping = false; saveFileSystem(); }, 800); 
    }); 
    editorInstance.on("keydown", (_, e) => { if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleRunCode(); } }); 
  }

  function setupNavigation() { 
    selectAll(".nav-btn").forEach(b => b.addEventListener("click", () => switchViewPanel(b.dataset.panel))); 
  }

  function setupActionListeners() {
    bindClick("#run-btn", handleRunCode); 
    bindClick("#submit-btn", handleSubmitCode); 
    bindClick("#reset-btn", handleResetCode); 
    bindClick("#clear-console", clearConsoleOutput);
    bindClick("#explain-btn", handleExplainCode); 
    bindClick("#debug-btn", handleDebugCode); 
    bindClick("#daily-btn", triggerDailyChallenge); 
    bindClick("#theme-btn", handleThemeToggle);
    bindClick("#sync-btn", toggleDesktopLink); 
    bindClick("#export-btn", exportProjectAsZip); 
    bindClick("#projects-btn", showWelcomeScreen); 
    bindClick("#create-project-btn", createNewProject);
    bindClick("#open-tutorials-btn", () => { const w = select("#welcome-screen"); if(w) w.classList.add("hidden"); switchViewPanel("lessons"); }); 
    bindClick("#new-file-btn", () => createNewFile("")); 
    bindClick("#new-folder-btn", () => createNewFolder("")); 
    bindClick("#exit-task-btn", exitTask);
    bindClick("#badge-close-btn", () => { const m = select("#badge-modal"); if(m) m.classList.add("hidden"); }); 
    
    const backdrop = select(".modal-backdrop");
    if (backdrop) backdrop.addEventListener("click", () => { const m = select("#badge-modal"); if(m) m.classList.add("hidden"); });
    
    bindClick("#hint-1-btn", () => showHint(1)); 
    bindClick("#hint-2-btn", () => showHint(2)); 
    bindClick("#solution-btn", showSolution);
    
    bindClick("#import-btn", e => { e.stopPropagation(); const d = select("#import-dropdown"); if(d) d.classList.toggle("hidden"); });
    document.addEventListener("click", e => { 
      const ib = select("#import-btn"); 
      const id = select("#import-dropdown"); 
      if (ib && !ib.contains(e.target) && id && !id.contains(e.target)) id.classList.add("hidden"); 
    });
    
    bindClick("#import-file-trigger", () => select("#import-file-input").click()); 
    bindClick("#import-zip-trigger", () => select("#import-zip-input").click()); 
    bindClick("#import-folder-trigger", () => select("#import-folder-input").click());
    
    const ifInput = select("#import-file-input"); if(ifInput) ifInput.addEventListener("change", handleImportFile);
    const izInput = select("#import-zip-input"); if(izInput) izInput.addEventListener("change", handleImportZip);
    const ifoInput = select("#import-folder-input"); if(ifoInput) ifoInput.addEventListener("change", handleImportFolder);
  }

  function exitTask() { 
    activeLesson = null; 
    const tc = select("#theory-container"); if(tc) tc.classList.add("hidden"); 
    const iq = select("#interactive-question"); if(iq) iq.classList.add("hidden"); 
    const lhb = select("#lesson-hint-box"); if(lhb) lhb.classList.add("hidden"); 
    const hc = select("#hints-container"); if(hc) hc.classList.add("hidden"); 
    const etb = select("#exit-task-btn"); if(etb) etb.classList.add("hidden"); 
    updateStatusText("Free Mode"); 
    switchViewPanel("files"); 
  }

  async function handleRunCode() { 
    if (isExecutionPending) return; 
    isExecutionPending = true; 
    const rb = select("#run-btn"); 
    if(rb) rb.innerHTML = "Running..."; 
    updateStatusText("Executing..."); 
    clearConsoleOutput(); 
    if (lastErrorLine !== null) editorInstance.removeLineClass(lastErrorLine, 'background', 'cm-error-line'); 
    saveFileSystem(); 
    const c = editorInstance.getValue(); 
    try { GameStorage.setMaxLines(c.split('\n').length); checkLinesAchievement(); } catch(e) {} 
    try { 
      const r = await PythonRunner.runCode(c, fileSystem); 
      r.output.forEach(l => logToConsole(l.text, "stdout")); 
      r.errors.forEach(l => logToConsole(l.text, "stderr")); 
      if (r.success && r.errors.length === 0) { 
        if (lastRunHadError) { 
          try { 
            GameStorage.addBugFix(); 
            if (GameStorage.loadProgress().bugsFixed >= 10 && !GameStorage.hasAchievement("bugs_10")) { 
              GameStorage.unlockAchievement("bugs_10"); triggerBadgePopup("bugs_10"); 
            } 
            renderAchievementsList(); 
          } catch(e) {} 
        } 
        lastRunHadError = false; 
        try { 
          if (!GameStorage.hasAchievement("first_program")) { GameStorage.unlockAchievement("first_program"); triggerBadgePopup("first_program"); renderAchievementsList(); } 
          if (c.includes("def ") && GameStorage.unlockAchievement("first_function")) { triggerBadgePopup("first_function"); renderAchievementsList(); } 
        } catch(e) {} 
      } else { lastRunHadError = true; } 
      updateXpDisplay(); 
    } catch (e) { 
      logToConsole("Error: " + e.message, "stderr"); lastRunHadError = true; 
    } finally { 
      isExecutionPending = false; 
      if(rb) rb.innerHTML = '<i class="fas fa-play"></i> Run'; 
    } 
  }

  async function handleSubmitCode() { 
    if (!activeLesson) return showToast("Choose a lesson!", "error"); 
    if (isExecutionPending) return; 
    await handleRunCode(); 
    const t = select("#console-output").textContent; 
    if (PythonRunner.checkLessonOutput([{text: t}], activeLesson.expected)) verifyTaskCompletion([{text: t}]); 
    else { showToast("Incorrect. Try again!", "error"); logToConsole("[ERROR] Incorrect result.", "stderr"); } 
  }

  function verifyTaskCompletion(o) { 
    if (!activeLesson || !activeLesson.expected) return; 
    if (!PythonRunner.checkLessonOutput(o, activeLesson.expected)) return; 
    try { 
      if (activeLesson.id?.startsWith("d")) { 
        const t = new Date().toDateString(); 
        if (localStorage.getItem("codekids_last_daily_v3") !== t) { 
          localStorage.setItem("codekids_last_daily_v3", t); 
          userProgress = GameStorage.loadProgress(); 
          userProgress.xp += activeLesson.xp; 
          GameStorage.saveProgress(userProgress); 
          updateXpDisplay(); 
          showToast("Challenge Completed!", "success"); checkDailyChallenge(); exitTask(); 
        } 
      } else if (activeLesson.id?.startsWith("c")) { 
        if (!GameStorage.isChallengeComplete(activeLesson.id)) { 
          GameStorage.completeChallenge(activeLesson.id, activeLesson.xp); 
          renderChallengesList(); updateXpDisplay(); 
          showToast("Challenge Completed!", "success"); exitTask(); 
        } 
      } else { 
        if (!GameStorage.isLessonComplete(activeLesson.id)) { 
          const h = GameStorage.hasBadge(activeLesson.badge); 
          userProgress = GameStorage.completeLesson(activeLesson.id, activeLesson.badge, activeLesson.xp); 
          renderLessonsList(); renderBadgesGrid(); updateXpDisplay(); 
          if (!h && activeLesson.badge) triggerBadgePopup(activeLesson.badge); 
          showToast("Lesson Completed!", "success"); exitTask(); 
        } 
      } 
      pushToDesktop(); 
    } catch(e) {} 
  }

  function renderLessonsList() { 
    const c = select("#lessons-list"); if(!c) return; c.innerHTML = ""; 
    LESSONS.forEach(l => { 
      let d = false; try { d = GameStorage.isLessonComplete(l.id); } catch(e) {} 
      const card = document.createElement("div"); 
      card.className = `lesson-card ${d ? "done" : ""} ${activeLesson?.id === l.id ? "active" : ""}`; 
      card.innerHTML = `<div><h4>${l.title}</h4><p>${l.description}</p></div>`; 
      card.addEventListener("click", () => selectLesson(l)); 
      c.appendChild(card); 
    }); 
    const pl = select("#progress-label"); if(pl) pl.textContent = `${userProgress.completedLessons.length} / ${LESSONS.length} lessons`; 
  }

  function renderChallengesList() { 
    const c = select("#challenges-list"); if(!c) return; c.innerHTML = ""; 
    CHALLENGES.forEach(ch => { 
      let d = false; try { d = GameStorage.isChallengeComplete(ch.id); } catch(e) {} 
      const card = document.createElement("div"); 
      card.className = `lesson-card ${d ? "done" : ""}`; 
      card.innerHTML = `<div><h4>${ch.title}</h4><p>${ch.description}</p></div>`; 
      card.addEventListener("click", () => selectChallenge(ch)); 
      c.appendChild(card); 
    }); 
  }

  function selectLesson(l, s = true, i = false) { 
    activeLesson = l; 
    const etb = select("#exit-task-btn"); if(etb) etb.classList.remove("hidden"); 
    if (editorInstance && !i && l.code) { 
      editorInstance.setValue(l.code); 
      let idx = fileSystem.findIndex(f => f.path === activeFilePath); 
      if (idx !== -1) fileSystem[idx].code = l.code; 
      saveFileSystem(); 
    } 
    setupTaskUI(l); 
    if (s) { try { userProgress.currentLesson = l.id; GameStorage.saveProgress(userProgress); } catch(e) {} } 
    renderLessonsList(); 
    updateStatusText(`Lesson: ${l.title}`); 
    switchViewPanel("editor"); 
  }

  function selectChallenge(ch) { 
    activeLesson = ch; 
    const etb = select("#exit-task-btn"); if(etb) etb.classList.remove("hidden"); 
    if (ch.code) { 
      editorInstance.setValue(ch.code); 
      let i = fileSystem.findIndex(f => f.path === activeFilePath); 
      if (i !== -1) fileSystem[i].code = ch.code; 
      saveFileSystem(); 
    } 
    setupTaskUI(ch); 
    renderChallengesList(); 
    updateStatusText(`Challenge: ${ch.title}`); 
    switchViewPanel("editor"); 
  }

  function setupTaskUI(t) { 
    const tc = select("#theory-container"); 
    if (t.theory) { if(tc) tc.classList.remove("hidden"); const tt = select("#theory-text"); if(tt) tt.innerHTML = t.theory; } else if(tc) tc.classList.add("hidden"); 
    const iq = select("#interactive-question"); 
    if (t.question) { if(iq) iq.classList.remove("hidden"); const qt = select("#question-text"); if(qt) qt.textContent = t.question; } else if(iq) iq.classList.add("hidden"); 
    const hc = select("#hints-container"); 
    if (t.hints?.length > 0) { 
      if(hc) hc.classList.remove("hidden"); 
      const h1 = select("#hint-1-btn"); if(h1) h1.classList.remove("hidden"); 
      const h2 = select("#hint-2-btn"); if(h2) h2.classList.add("hidden"); 
      const sb = select("#solution-btn"); if(sb) sb.classList.add("hidden"); 
      const htd = select("#hint-text-display"); if(htd) htd.textContent = ""; 
    } else if(hc) hc.classList.add("hidden"); 
    const lhb = select("#lesson-hint-box"); 
    if (t.hint) { if(lhb) lhb.classList.remove("hidden"); const lht = select("#lesson-hint-text"); if(lht) lht.textContent = t.hint; } else if(lhb) lhb.classList.add("hidden"); 
  }

  async function showHint(l) { 
    if (!activeLesson?.hints) return; 
    const d = select("#hint-text-display"); 
    if (l === 1 && activeLesson.hints[0]) { if(d) d.textContent = "Hint 1: " + activeLesson.hints[0]; select("#hint-1-btn").classList.add("hidden"); select("#hint-2-btn").classList.remove("hidden"); } 
    else if (l === 2 && activeLesson.hints[1]) { if(d) d.textContent += "\n\nHint 2: " + activeLesson.hints[1]; select("#hint-2-btn").classList.add("hidden"); select("#solution-btn").classList.remove("hidden"); } 
  }

  async function showSolution() { 
    if (!activeLesson?.solution) return showToast("No solution exists.", "error"); 
    if (await customModal({ title: "Solution", msg: "Are you sure you want the solution?", isConfirm: true })) { 
      editorInstance.setValue(activeLesson.solution); 
      let i = fileSystem.findIndex(f => f.path === activeFilePath); 
      if (i !== -1) fileSystem[i].code = activeLesson.solution; 
      saveFileSystem(); 
    } 
  }

  function handleExplainCode() { 
    const c = editorInstance.getSelection() || editorInstance.getValue(); 
    if (!c.trim()) return showToast("Select the code!", "error"); 
    logToConsole("Analyzing...", "stdout"); 
    let e = ""; 
    if (c.includes('for ') || c.includes('while ')) e += "This code uses a loop.\n"; 
    else if (c.includes('def ')) e += "Defines a function.\n"; 
    else if (c.includes('if ')) e += "Makes decisions.\n"; 
    else e += "Executes instructions.\n"; 
    c.split('\n').forEach((l, i) => { 
      let t = l.trim(); 
      if (t.includes('print(')) e += `L${i+1}: Displays.\n`; 
      else if (t.match(/^(\w+)\s*=\s*(.*)/)) e += `L${i+1}: Saves.\n`; 
    }); 
    const d = document.createElement("div"); d.className = "code-explanation"; d.textContent = e; 
    const co = select("#console-output"); if(co) co.appendChild(d); 
  }

  function handleDebugCode() { 
    if (!lastRunHadError) return showToast("The code is perfect!", "success"); 
    logToConsole("Debug mode. Check the red line.", "debug"); 
    if (lastErrorLine !== null) editorInstance.addLineClass(lastErrorLine, 'background', 'cm-error-line'); 
  }

  function checkLinesAchievement() { 
    try { 
      const l = GameStorage.loadProgress().maxLines || 0; 
      if (l >= 100 && !GameStorage.hasAchievement("lines_100")) { 
        GameStorage.unlockAchievement("lines_100"); triggerBadgePopup("lines_100"); renderAchievementsList(); 
      } 
    } catch(e) {} 
  }

  function checkDailyChallenge() { 
    try { 
      if (localStorage.getItem("codekids_last_daily_v3") !== new Date().toDateString()) select("#daily-btn").classList.add("btn-run"); 
      else select("#daily-btn").classList.remove("btn-run"); 
    } catch(e) {} 
  }

  function triggerDailyChallenge() { 
    try { 
      if (localStorage.getItem("codekids_last_daily_v3") === new Date().toDateString()) return showToast("Come back tomorrow!", "info"); 
      const ch = DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)]; 
      activeLesson = { id: ch.id, title: "Daily", expected: ch.expected, xp: ch.xp, badge: null, code: `\n`, hint: "Read.", hints: [], solution: null, question: null, theory: null }; 
      const etb = select("#exit-task-btn"); if(etb) etb.classList.remove("hidden"); 
      editorInstance.setValue(activeLesson.code); 
      let i = fileSystem.findIndex(f => f.path === activeFilePath); 
      if (i !== -1) fileSystem[i].code = activeLesson.code; 
      saveFileSystem(); 
      setupTaskUI(activeLesson); 
      switchViewPanel("editor"); 
    } catch(e) {} 
  }

  function renderBadgesGrid() { 
    const g = select("#badges-grid"); if(!g) return; g.innerHTML = ""; 
    try { userProgress = GameStorage.loadProgress(); } catch(e) {} 
    Object.entries(BADGES).forEach(([id, b]) => { 
      const e = document.createElement("div"); 
      e.className = `badge-item ${userProgress.badges.includes(id) ? "earned" : "locked"}`; 
      e.innerHTML = `<h4>${b.name}</h4><p>${b.description}</p>`; 
      g.appendChild(e); 
    }); 
  }

  function renderAchievementsList() { 
    const l = select("#achievements-list"); if (!l) return; l.innerHTML = ""; 
    let d = {}; try { d = GameStorage.loadProgress(); } catch(e) { d = userProgress; } 
    Object.entries(ACHIEVEMENTS).forEach(([id, a]) => { 
      const iE = (d.achievements || []).includes(id); 
      let p = ""; 
      if (id === "bugs_10") p = ` (${d.bugsFixed||0}/10)`; 
      if (id === "lines_100") p = ` (${d.maxLines||0}/100)`; 
      const e = document.createElement("div"); 
      e.className = `achievement-item ${iE ? "earned" : "locked"}`; 
      e.innerHTML = `<div class="achievement-info"><h4>${a.name}</h4><p>${a.desc} <span style="color: var(--text-muted);">${p}</span></p></div><div class="achievement-xp">+${a.xp} XP</div>`; 
      l.appendChild(e); 
    }); 
  }

  function triggerBadgePopup(id) { 
    let d; 
    if (ACHIEVEMENTS[id]) d = ACHIEVEMENTS[id]; 
    else if (BADGES[id]) d = BADGES[id]; 
    if (!d) return; 
    const bn = select("#badge-unlock-name"); if(bn) bn.textContent = d.name; 
    const bd = select("#badge-unlock-desc"); if(bd) bd.textContent = d.description || d.desc; 
    const bm = select("#badge-modal"); if(bm) bm.classList.remove("hidden"); 
    updateXpDisplay(); 
  }

  function updateXpDisplay() { 
    try { userProgress = GameStorage.loadProgress(); } catch(e) {} 
    const { level, pct, xp } = GameStorage.getXpProgress(userProgress.xp || 0); 
    const lb = select("#level-badge"); if(lb) lb.textContent = `Level ${level}`; 
    const xf = select("#xp-fill"); if(xf) xf.style.width = `${pct}%`; 
    const xt = select("#xp-text"); if(xt) xt.textContent = `${xp} XP`; 
  }

  function logToConsole(t, type = "stdout") { 
    const c = select("#console-output"); if(!c) return; 
    const w = c.querySelector(".console-welcome"); if (w) w.remove(); 
    if (c.children.length > 50) c.removeChild(c.firstChild); 
    const l = document.createElement("div"); l.className = `console-line ${type}`; l.textContent = t; 
    c.appendChild(l); c.scrollTop = c.scrollHeight; 
  }

  function clearConsoleOutput() { const c = select("#console-output"); if(c) c.innerHTML = ""; }
  function updateStatusText(t) { const e = select("#editor-status"); if(e) e.textContent = t; }

  async function handleResetCode() { 
    if (await customModal({ title: "Reset", msg: "Reset code?", isConfirm: true })) { 
      const i = activeLesson?.code ? activeLesson.code : DEFAULT_CODE; 
      editorInstance.setValue(i); 
      let idx = fileSystem.findIndex(f => f.path === activeFilePath); 
      if (idx !== -1) fileSystem[idx].code = i; 
      try { saveFileSystem(); } catch(e) {} 
      clearConsoleOutput(); 
    } 
  }

  window.highlightErrorLine = (n) => { lastErrorLine = n - 1; editorInstance.addLineClass(lastErrorLine, 'background', 'cm-error-line'); };
  
  function startOnboarding() {
    const steps = [
      { el: ".workspace .editor-wrap", title: "Code Editor", text: "Here you write your Python code. You can create files and folders on the left." },
      { el: ".console", title: "Console", text: "Here you will see the results of your code or errors." },
      { el: "#run-btn", title: "Run Button", text: "Click here to run the code. If it's correct, press Submit!" },
      { el: '[data-panel="lessons"]', title: "Lessons", text: "Here you can find interactive lessons that teach you step by step." }
    ];
    let step = 0;
    const ov = select("#onboarding-overlay"); if(ov) ov.classList.remove("hidden");
    const showStep = () => {
      if (step >= steps.length) { if(ov) ov.classList.add("hidden"); localStorage.setItem("codekids_onboarding_done", "true"); return; }
      const s = steps[step], target = select(s.el); if(!target) return; 
      const rect = target.getBoundingClientRect(), highlight = select("#onboarding-highlight");
      if(highlight) { 
        highlight.style.top = (rect.top - 5) + "px"; 
        highlight.style.left = (rect.left - 5) + "px"; 
        highlight.style.width = (rect.width + 10) + "px"; 
        highlight.style.height = (rect.height + 10) + "px"; 
      }
      const ot = select("#ob-title"); if(ot) ot.textContent = s.title; 
      const ob = select("#ob-text"); if(ob) ob.textContent = s.text;
    };
    bindClick("#ob-next", () => { step++; showStep(); });
    bindClick("#ob-skip", () => { if(ov) ov.classList.add("hidden"); localStorage.setItem("codekids_onboarding_done", "true"); });
    showStep();
  }

  initializeApp();
});