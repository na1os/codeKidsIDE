let pyodideWorker = null;
let pendingResolve = null;
let runTimeout = null;

function initializeWorker() {
  if (!pyodideWorker) {
    try {
      pyodideWorker = new Worker("js/pyodide-worker.js");
      pyodideWorker.onmessage = (event) => {
        if (pendingResolve) {
          clearTimeout(runTimeout);
          if (event.data.success) {
            pendingResolve({ success: true, output: event.data.output, errors: event.data.errors });
          } else {
            const formattedMsg = formatErrorMessage(event.data.errorMsg || "");
            const currentErrors = event.data.errors || [];
            if (formattedMsg) currentErrors.push({ type: "stderr", text: formattedMsg });
            pendingResolve({ success: false, output: event.data.output || [], errors: currentErrors });
          }
          pendingResolve = null;
        }
      };
      pyodideWorker.onerror = (error) => {
        if (pendingResolve) {
          clearTimeout(runTimeout);
          pendingResolve({ success: false, output: [], errors: [{ type: "stderr", text: "Error: Browser blocked execution. Use Live Server." }] });
          pendingResolve = null;
        }
      };
    } catch (e) { console.error("Worker Error:", e); }
  }
  return pyodideWorker;
}

function formatErrorMessage(rawMsg) {
  try {
    if (rawMsg.includes("input not supported")) return ""; 
    
    let lineMatch = rawMsg.match(/detected at line (\d+)/) || rawMsg.match(/File "<exec>", line (\d+)/) || rawMsg.match(/line (\d+), in <module>/);
    let lineNum = lineMatch ? lineMatch[1] : null;

    if (lineNum && window.highlightErrorLine) {
      window.highlightErrorLine(parseInt(lineNum));
    }

    let typeMatch = rawMsg.match(/([a-zA-Z]+Error|Exception):\s*(.*)/);
    if (!typeMatch) return rawMsg; 

    let errorType = typeMatch[1];
    let errorDetail = typeMatch[2];

    let friendlyMsg = `[ERROR] ${errorType}\n`;
    if (lineNum) friendlyMsg += `Line: ${lineNum}\n`;
    friendlyMsg += `Details: ${errorDetail}\n`;
    
    if (errorType === "SyntaxError") {
      if (errorDetail.includes("unterminated string literal") || errorDetail.includes("EOL while scanning string literal")) {
        friendlyMsg += `[HINT] You forgot to close the quotes. Text must be enclosed inside " " or ' '.\nExample: print("hello")`;
      } else if (errorDetail.includes("never closed")) {
        friendlyMsg += `[HINT] You forgot to close a parenthesis. Check if you added ) at the end.`;
      } else if (errorDetail.includes("expected ':'")) {
        friendlyMsg += `[HINT] You forgot a colon ':' at the end of the line.\nYou must always put : after if, for, while, def.`;
      } else if (errorDetail.includes("unindent does not match")) {
        friendlyMsg += `[HINT] You mixed spaces and tabs. Delete them and use only 4 spaces.`;
      } else if (errorDetail.includes("invalid character")) {
        friendlyMsg += `[HINT] You used an invalid character (maybe a special symbol or non-standard letter).`;
      } else if (errorDetail.includes("cannot assign to literal")) {
        friendlyMsg += `[HINT] You are trying to assign a value to a literal. Example: 10 = x (wrong). Correct: x = 10`;
      } else if (errorDetail.includes("invalid syntax")) {
        friendlyMsg += `[HINT] Check the words and symbols on line ${lineNum}. Maybe you misspelled a word or forgot a comma.`;
      } else {
        friendlyMsg += `[HINT] Check the syntax on line ${lineNum}.`;
      }
    } else if (errorType === "NameError") {
      let vM = errorDetail.match(/name '([^']+)'/); let vN = vM ? vM[1] : "variable";
      friendlyMsg += `[HINT] You used '${vN}' before creating it.\nExample: ${vN} = 10`;
    } else if (errorType === "ModuleNotFoundError" || errorType === "ImportError") {
      let modMatch = errorDetail.match(/No module named '([^']+)'/);
      let modName = modMatch ? modMatch[1] : "the module";
      friendlyMsg += `[HINT] You cannot use external modules (such as '${modName}') on the Web.\nDownload the Desktop app to install and use any module!`;
    } else if (errorType === "IndentationError") {
      friendlyMsg += `[HINT] Indentation issue. Python requires exactly 4 spaces at the start of the line.`;
    } else if (errorType === "TypeError") {
      if (errorDetail.includes("unsupported operand type")) {
        friendlyMsg += `[HINT] You are combining incompatible types (e.g., text with numbers). Check your variables.`;
      } else {
        friendlyMsg += `[HINT] You used the wrong data type for an operation.`;
      }
    } else if (errorType === "IndexError") {
      friendlyMsg += `[HINT] You tried to access a list element that does not exist. Check the list length.`;
    } else if (errorType === "KeyError") {
      friendlyMsg += `[HINT] The key you are looking for does not exist in the dictionary.`;
    } else if (errorType === "ZeroDivisionError") {
      friendlyMsg += `[HINT] You cannot divide by zero!`;
    } else if (errorType === "ValueError") {
      friendlyMsg += `[HINT] The value you provided is incorrect.`;
    }
    return friendlyMsg;
  } catch (e) { return rawMsg; }
}

window.PythonRunner = {
  async runCode(code, files = []) {
    return new Promise((resolve) => {
      const worker = initializeWorker();
      if (!worker) { resolve({ success: false, output: [], errors: [{ type: "stderr", text: "Error: Python not initialized." }] }); return; }
      runTimeout = setTimeout(() => {
        if (pendingResolve === resolve) {
          resolve({ success: false, output: [], errors: [{ type: "stderr", text: "Timeout: Code took too long to run." }] });
          pendingResolve = null;
        }
      }, 20000);
      pendingResolve = resolve;
      worker.postMessage({ code, files });
    });
  },
  checkLessonOutput(output, expected) {
    if (!output || output.length === 0) return false;
    const combined = output.map(line => line.text.trim()).join("\n").toLowerCase();
    return combined.includes(expected.trim().toLowerCase());
  }
};