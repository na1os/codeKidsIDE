"""Code editor with line numbers and syntax highlighting"""
import customtkinter as ctk
import tkinter as tk
from core.highlighter import SyntaxHighlighter


class CodeEditor(ctk.CTkFrame):
    def __init__(self, parent, main_app):
        super().__init__(parent, corner_radius=15)
        self.app = main_app
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)

        # using standard tk.Text for better control over text indexing and tags
        self.line_numbers = tk.Text(self, width=4, padx=5, pady=10, borderwidth=0, 
                                    highlightthickness=0, state="disabled", undo=True)
        self.line_numbers.grid(row=0, column=0, sticky="nsew")

        self.text = tk.Text(self, wrap="none", undo=True, padx=10, pady=10, 
                            borderwidth=0, highlightthickness=0, font=("Consolas", 14))
        self.text.grid(row=0, column=1, sticky="nsew")
        
        self.scroll_y = ctk.CTkScrollbar(self, command=self.text.yview)
        self.scroll_y.grid(row=0, column=2, sticky="ns")
        
        self.text.configure(yscrollcommand=self._on_text_scroll)

        self.highlighter = SyntaxHighlighter(self.text, self.app.settings.get("theme"))

        self.text.bind("<KeyRelease>", self._on_key_release)
        self.text.bind("<Configure>", self._update_line_numbers)

        self._apply_theme()

    def _scroll_both(self, *args):
        self.text.yview(*args)
        self.line_numbers.yview(*args)

    def _on_text_scroll(self, *args):
        self.scroll_y.set(*args)
        self.line_numbers.yview_moveto(args[0])

    def _on_key_release(self, event):
        self.highlighter.highlight()
        self._update_line_numbers()

    def _update_line_numbers(self, event=None):
        text = self.text
        line_count = int(text.index("end-1c").split(".")[0])
        
        self.line_numbers.config(state="normal")
        self.line_numbers.delete("1.0", "end")
        
        for i in range(1, line_count + 1):
            self.line_numbers.insert("end", f"{i}\n")
            
        self.line_numbers.config(state="disabled")

    def _apply_theme(self):
        theme = self.app.settings.get("theme")
        if theme == "dark":
            bg = "#2b2b2b"
            fg = "#d4d4d4"
            ln_bg = "#252526"
            ln_fg = "#858585"
        else:
            bg = "#ffffff"
            fg = "#333333"
            ln_bg = "#f0f0f0"
            ln_fg = "#999999"

        self.text.configure(bg=bg, fg=fg, insertbackground=fg, font=(self.app.settings.get("font_family"), self.app.settings.get("font_size")))
        self.line_numbers.configure(bg=ln_bg, fg=ln_fg)
        self.highlighter.set_theme(theme)
        self.highlighter.highlight()

    def get_content(self):
        return self.text.get("1.0", "end-1c")

    def set_content(self, content):
        self.text.delete("1.0", "end")
        self.text.insert("1.0", content)
        self.highlighter.highlight()
        self._update_line_numbers()

    def refresh_theme(self):
        self._apply_theme()