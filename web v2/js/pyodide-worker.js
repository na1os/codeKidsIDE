importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodideInstance = null;

async function initialize() {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" });
    
    await pyodideInstance.runPythonAsync(`
import builtins
import sys

def _mock_input(prompt=""):
    sys.stderr.write("[ERROR] The input() function does not work in this online editor.\\n[HINT] Set the variable directly in the code (e.g., name = \\"Alex\\").\\n")
    raise EOFError("input() not supported in web worker")

builtins.input = _mock_input
    `);
  }
}

self.onmessage = async (event) => {
  const { code, files } = event.data;
  const output = [];
  const errors = [];

  try {
    await initialize();
    
    if (files && files.length > 0) {
      for (const file of files) {
        const path = file.path;
        const dir = path.substring(0, path.lastIndexOf('/'));
        if (dir && !pyodideInstance.FS.analyzePath(dir).exists) {
          pyodideInstance.FS.mkdirTree(dir);
        }
        pyodideInstance.FS.writeFile(path, file.code);
      }
    }

    pyodideInstance.setStdout({ batched: (text) => output.push({ type: "stdout", text }) });
    pyodideInstance.setStderr({ batched: (text) => errors.push({ type: "stderr", text }) });

    await pyodideInstance.runPythonAsync(code);
    self.postMessage({ success: true, output, errors });
  } catch (error) {
    self.postMessage({ success: false, output, errors, errorMsg: error.message });
  }
};