import subprocess
import sys
import os
import tempfile
import threading
import shutil


class CodeRunner:
    def __init__(self):
        self.timeout = 30

    def _get_interpreter(self):
        # Cand faci .exe cu PyInstaller, sys.executable pointeaza catre CodeKids.exe
        # Trebuie sa cautam python.exe real pe sistem
        if getattr(sys, 'frozen', False):
            python_exe = shutil.which("python") or shutil.which("python3")
            if python_exe:
                return python_exe
            # Daca nu il gaseste in PATH, returnam default (va da eroare, dar macar nu deschide o fereastra noua)
            return sys.executable
        return sys.executable

    def run(self, code, filepath, callback):
        """Run code in a background thread, call callback(stdout, stderr, error_type) when done"""
        thread = threading.Thread(
            target=self._run_thread, args=(code, filepath, callback), daemon=True
        )
        thread.start()

    def _run_thread(self, code, filepath, callback):
        # figure out where to run from
        temp_file = None

        # give more time for turtle/tkinter games
        uses_gui = any(x in code for x in ["import turtle", "import tkinter",
                                            "from turtle", "from tkinter"])
        timeout = 300 if uses_gui else self.timeout

        if filepath and os.path.exists(filepath):
            run_path = filepath
            cwd = os.path.dirname(filepath) or "."
        else:
            # save to a temp file
            temp_file = tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False, encoding="utf-8"
            )
            temp_file.write(code)
            temp_file.close()
            run_path = temp_file.name
            cwd = os.path.dirname(run_path)

        # Ascunde fereastra de consola neagra pe Windows cand ruleaza cod
        startupinfo = None
        if sys.platform == "win32":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

        interpreter = self._get_interpreter()

        try:
            result = subprocess.run(
                [interpreter, run_path],
                capture_output=True,
                text=True,
                timeout=timeout,
                input="",
                cwd=cwd,
                startupinfo=startupinfo
            )
            callback(result.stdout, result.stderr, None)
        except subprocess.TimeoutExpired:
            callback(
                "",
                f"Your program ran for too long! If it's a game, "
                f"close the game window when you're done. "
                f"(Timeout was {timeout} seconds)",
                "timeout",
            )
        except Exception as e:
            callback("", str(e), "error")
        finally:
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except OSError:
                    pass
