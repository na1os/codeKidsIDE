let pyodideWorker = null;
let pendingResolve = null;

function initializeWorker() {
  if (!pyodideWorker) {
    pyodideWorker = new Worker("js/pyodide-worker.js");

    pyodideWorker.onmessage = (event) => {
      if (pendingResolve) {
        if (event.data.success) {
          pendingResolve({
            success: true,
            output: event.data.output,
            errors: event.data.errors
          });
        } else {
          const formattedMsg = formatErrorMessage(event.data.errorMsg || "");
          const currentErrors = event.data.errors || [];
          currentErrors.push({ type: "stderr", text: formattedMsg });
          pendingResolve({
            success: false,
            output: event.data.output || [],
            errors: currentErrors
          });
        }
        pendingResolve = null;
      }
    };

    pyodideWorker.onerror = (error) => {
      console.error("❌ [CodeKids] Error:", error.message, error);
      if (pendingResolve) {
        pendingResolve({
          success: false,
          output: [],
          errors: [{ type: "stderr", text: "Failed to load Python environment." }]
        });
        pendingResolve = null;
      }
    };
  }
  return pyodideWorker;
}

function formatErrorMessage(msg) {
  if (msg.includes("SyntaxError")) return "Oops! It looks like there's a typing mistake in your code. Check your spelling and symbols!";
  if (msg.includes("NameError")) return "Hmm, you used a word or variable that Python doesn't recognize. Did you define it first?";
  if (msg.includes("TypeError")) return "You might be trying to mix text and numbers incorrectly. Check your operations!";
  if (msg.includes("IndentationError")) return "Python is picky about spaces. Check the spacing at the start of lines.";
  return msg;
}

window.PythonRunner = {
  async runCode(code) {
    return new Promise((resolve) => {
      pendingResolve = resolve;
      initializeWorker().postMessage({ code });
    });
  },

  checkLessonOutput(output, expected) {
    if (!output || output.length === 0) return false;
    const combined = output.map(line => line.text.trim()).join("\n");
    return combined.includes(expected.trim());
  }
};