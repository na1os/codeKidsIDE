importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodideInstance = null;

async function initialize() {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
    });
  }
}

self.onmessage = async (event) => {
  const { code } = event.data;
  const output = [];
  const errors = [];

  try {
    await initialize();
    pyodideInstance.setStdout({
      batched: (text) => output.push({ type: "stdout", text })
    });
    pyodideInstance.setStderr({
      batched: (text) => errors.push({ type: "stderr", text })
    });

    await pyodideInstance.runPythonAsync(code);
    self.postMessage({ success: true, output, errors });
  } catch (error) {
    self.postMessage({ success: false, output, errors, errorMsg: error.message });
  }
};