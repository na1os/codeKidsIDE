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
          pendingResolve({ success: false, output: [], errors: [{ type: "stderr", text: "Error: Browser blocked Python scripts. Use Live Server." }] });
          pendingResolve = null;
        }
      };
    } catch (e) {
      console.error("Error creating Worker:", e);
    }
  }
  return pyodideWorker;
}

function formatErrorMessage(rawMsg) {
  try {
    if (rawMsg.includes("input not supported")) return ""; 
    
    let lineMatch = rawMsg.match(/line (\d+)/);
    let lineNum = lineMatch ? lineMatch[1] : "unknown";

    let typeMatch = rawMsg.match(/([a-zA-Z]+Error|Exception):\s*(.*)/);
    if (!typeMatch) return rawMsg; 

    let errorType = typeMatch[1];
    let errorDetail = typeMatch[2];

    let friendlyMsg = `[ERROR] Line ${lineNum} (${errorType}):\n`;
    
    if (errorType === "SyntaxError") {
      friendlyMsg += `You have a typo.\n`;
      if (errorDetail.includes("never closed")) {
        friendlyMsg += `You forgot to close a parenthesis, quote, or bracket.\n`;
        friendlyMsg += `[HINT] Check if you put ) at the end of print() or " at the end of text.`;
      } else if (errorDetail.includes("expected ':'")) {
        friendlyMsg += `You forgot a colon ':' at the end of the line.\n`;
        friendlyMsg += `[HINT] After if, for, while, def, you must always put :`;
      } else {
        friendlyMsg += `Details: ${errorDetail}\n[HINT] Check the words and symbols on line ${lineNum}.`;
      }
    } else if (errorType === "NameError") {
      let varMatch = errorDetail.match(/name '([^']+)'/);
      let varName = varMatch ? varMatch[1] : "variable";
      friendlyMsg += `You used the variable '${varName}' before creating it.\n`;
      friendlyMsg += `[HINT] Create it first, for example: ${varName} = 10`;
    } else if (errorType === "IndentationError") {
      friendlyMsg += `Problem with spaces at the beginning of the line.\n`;
      friendlyMsg += `[HINT] Python wants exactly 4 spaces at the beginning. Check line ${lineNum}.`;
    } else if (errorType === "TypeError") {
      friendlyMsg += `You tried to combine things that don't match (e.g., text with numbers).\n`;
      friendlyMsg += `[HINT] Check if you are trying to do a mathematical operation on text.`;
    } else if (errorType === "ZeroDivisionError") {
      friendlyMsg += `You cannot divide a number by zero!\n`;
      friendlyMsg += `[HINT] Change the value to something other than 0.`;
    } else if (errorType === "ModuleNotFoundError") {
      let modMatch = errorDetail.match(/No module named '([^']+)'/);
      let modName = modMatch ? modMatch[1] : "module";
      friendlyMsg += `Cannot find module '${modName}'.\n`;
      friendlyMsg += `[HINT] Make sure you created a file named '${modName}.py' and that it is in the same folder.`;
    } else {
      friendlyMsg += errorDetail;
    }
    return friendlyMsg;
  } catch (e) {
    return rawMsg;
  }
}

window.PythonRunner = {
  async runCode(code, files = []) {
    return new Promise((resolve) => {
      const worker = initializeWorker();
      if (!worker) {
        resolve({ success: false, output: [], errors: [{ type: "stderr", text: "Error: Python environment could not be started." }] });
        return;
      }

      runTimeout = setTimeout(() => {
        if (pendingResolve === resolve) {
          resolve({ success: false, output: [], errors: [{ type: "stderr", text: "Timeout: Code took too long or was blocked." }] });
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