"""Main window logic - ties everything together"""
import customtkinter as ctk
from tkinter import filedialog, messagebox
import os

from ui.toolbar import Toolbar
from ui.file_explorer import FileExplorer
from ui.code_editor import CodeEditor
from ui.console_panel import ConsolePanel
from ui.lessons_panel import LessonsPanel
from ui.achievements_panel import AchievementsPanel
from ui.settings_dialog import SettingsDialog
from ui.search_bar import SearchBar

from core.runner import CodeRunner
from core.autosave import AutosaveManager
from core.lessons_data import LESSONS


class MainWindow(ctk.CTk):
    def __init__(self, settings, progress):
        super().__init__()
        self.settings = settings
        self.progress = progress
        self.runner = CodeRunner()
        self.autosave = AutosaveManager(self._do_autosave)
        self.current_file = None

        self.title("CodeKids IDE")
        self.geometry("1200x800")
        self.minsize(900, 600)

        ctk.set_appearance_mode(self.settings.get("theme"))
        ctk.set_default_color_theme("blue")

        # layout setup
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self.toolbar = Toolbar(self, self)
        self.toolbar.grid(row=0, column=0, columnspan=3, sticky="ew", padx=10, pady=5)

        self.file_explorer = FileExplorer(self, self)
        self.file_explorer.grid(row=1, column=0, sticky="nsew", padx=(10, 5), pady=5)

        # tabs for editor, lessons, achievements
        self.tabview = ctk.CTkTabview(self)
        self.tabview.grid(row=1, column=1, sticky="nsew", padx=5, pady=5)
        
        self.editor_tab = self.tabview.add("Editor")
        self.lessons_tab = self.tabview.add("Lessons")
        self.achieve_tab = self.tabview.add("Achievements")

        # editor tab layout
        self.editor_tab.grid_rowconfigure(1, weight=1)
        self.editor_tab.grid_columnconfigure(0, weight=1)

        self.search_bar = SearchBar(self.editor_tab, self)
        self.search_bar.grid(row=0, column=0, sticky="ew", padx=10, pady=(5,0))
        self.search_bar.grid_remove() # hide by default

        self.editor = CodeEditor(self.editor_tab, self)
        self.editor.grid(row=1, column=0, sticky="nsew", padx=10, pady=5)

        self.console = ConsolePanel(self, self)
        self.console.grid(row=2, column=0, columnspan=3, sticky="nsew", padx=10, pady=(5, 10))

        self.lessons_panel = LessonsPanel(self.lessons_tab, self)
        self.lessons_panel.pack(fill="both", expand=True)

        self.achieve_panel = AchievementsPanel(self.achieve_tab, self)
        self.achieve_panel.pack(fill="both", expand=True)

        self.autosave.start(self)

        # keyboard shortcuts
        self.bind("<Control-s>", lambda e: self.save_file())
        self.bind("<Control-r>", lambda e: self.run_code())
        self.bind("<Control-f>", lambda e: self.toggle_search())

        self.new_file()
        
        # load last opened project directory if it exists
        pdir = self.settings.get("project_dir")
        if pdir and os.path.exists(pdir):
            self.file_explorer.current_dir = pdir
            self.file_explorer.load_files(pdir)

    def new_file(self):
        self.current_file = None
        self.title("CodeKids IDE - Untitled.py")
        self.editor.set_content("# Welcome to CodeKids IDE!\n# Let's write some Python.\n\nprint(\"Hello, World!\")\n")
        self.console.clear()

    def open_file(self):
        f = filedialog.askopenfilename(filetypes=[("Python Files", "*.py"), ("All Files", "*.*")])
        if f:
            self.open_file_from_path(f, os.path.basename(f))

    def open_file_from_path(self, filepath, name):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self.current_file = filepath
            self.title(f"CodeKids IDE - {name}")
            self.editor.set_content(content)
            self.console.clear()
        except Exception as e:
            messagebox.showerror("Error", f"Could not open file:\n{e}")

    def save_file(self):
        if not self.current_file:
            f = filedialog.asksaveasfilename(defaultextension=".py", filetypes=[("Python Files", "*.py")])
            if not f:
                return
            self.current_file = f
            
        try:
            with open(self.current_file, "w", encoding="utf-8") as f:
                f.write(self.editor.get_content())
            self.title(f"CodeKids IDE - {os.path.basename(self.current_file)}")
            self.console.write_output("💾 File saved successfully!", "info")
        except Exception as e:
            messagebox.showerror("Error", f"Could not save file:\n{e}")

    def _do_autosave(self):
        if self.settings.get("autosave") and self.current_file:
            try:
                with open(self.current_file, "w", encoding="utf-8") as f:
                    f.write(self.editor.get_content())
            except:
                pass # silent fail for autosave so we don't crash the app

    def run_code(self):
        code = self.editor.get_content()
        self.console.clear()
        self.console.write_output("⏳ Running your code...", "info")
        self.toolbar.btn_run.configure(state="disabled", text="⏳ Running...")
        
        def callback(stdout, stderr, error_type):
            self.after(0, lambda: self._handle_run_result(stdout, stderr, error_type))

        self.runner.run(code, self.current_file, callback)

    def _handle_run_result(self, stdout, stderr, error_type):
        self.toolbar.btn_run.configure(state="normal", text="▶️ Run")
        
        if stdout:
            self.console.write_output(stdout, "normal")
            
        if stderr:
            self.console.write_output("❌ Error found:", "error")
            self.console.write_output(stderr, "error")
            
            if self.settings.get("beginner_mode"):
                from core.error_helper import explain_error
                explanation = explain_error(stderr)
                self.console.write_output("\n💡 BEGINNER MODE EXPLANATION:", "info")
                self.console.write_output(explanation, "beginner")
                
        elif error_type == "timeout":
             self.console.write_output("⏰ Program timed out.", "error")
        elif not stdout and not stderr:
             self.console.write_output("✅ Program finished with no output.", "success")

    def toggle_search(self):
        self.search_bar.toggle()

    def open_template_menu(self):
        from templates.templates import TEMPLATES
        dialog = ctk.CTkToplevel(self)
        dialog.title("Choose a Template")
        dialog.geometry("300x300")
        dialog.resizable(False, False)
        
        ctk.CTkLabel(dialog, text="Pick a template to start:", font=ctk.CTkFont(size=16)).pack(pady=20)
        
        for name, code in TEMPLATES.items():
            btn = ctk.CTkButton(dialog, text=name.replace("_", " "), 
                                command=lambda c=code: self.load_template(c, dialog))
            btn.pack(pady=10, fill="x", padx=30)

    def load_template(self, code, dialog):
        self.current_file = None
        self.title("CodeKids IDE - Untitled.py")
        self.editor.set_content(code)
        dialog.destroy()

    def open_settings(self):
        SettingsDialog(self)

    def toggle_theme(self):
        new_theme = "dark" if self.settings.get("theme") == "light" else "light"
        self.settings.set("theme", new_theme)
        self.apply_theme()

    def apply_theme(self):
        ctk.set_appearance_mode(self.settings.get("theme"))
        self.editor.refresh_theme()
        self.console.refresh_theme()
        
        # refresh side panels to update their colors
        for w in self.lessons_tab.winfo_children(): w.destroy()
        for w in self.achieve_tab.winfo_children(): w.destroy()
        self.lessons_panel = LessonsPanel(self.lessons_tab, self)
        self.lessons_panel.pack(fill="both", expand=True)
        self.achieve_panel = AchievementsPanel(self.achieve_tab, self)
        self.achieve_panel.pack(fill="both", expand=True)

    def load_lesson(self, lesson):
        self.tabview.set("Editor")
        self.current_file = None
        self.title(f"CodeKids IDE - {lesson['title']}.py")
        self.editor.set_content(lesson["code"])
        
        def check_lesson(stdout, stderr, error_type):
            if not stderr and lesson["expected"] in stdout:
                self.progress.complete_lesson(lesson["id"], lesson.get("badge"))
                messagebox.showinfo("Lesson Complete!", f"🎉 Awesome job! You completed: {lesson['title']}")
                self.apply_theme() # refresh badges
                
                if self.progress.get_completed_count() == len(LESSONS):
                    self.progress.add_badge("code_champion")
                    messagebox.showinfo("Big Achievement!", "🏆 You finished ALL lessons! You are a Code Champion!")
                    self.apply_theme()

        code = self.editor.get_content()
        self.console.clear()
        self.console.write_output("⏳ Running lesson...", "info")
        self.runner.run(code, None, lambda s, e, et: self.after(0, lambda: self._lesson_result(s, e, et, check_lesson)))

    def _lesson_result(self, stdout, stderr, error_type, custom_callback):
        self._handle_run_result(stdout, stderr, error_type)
        custom_callback(stdout, stderr, error_type)