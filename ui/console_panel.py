"""Output console at the bottom"""
import customtkinter as ctk
import tkinter as tk
from tkinter import font as tkfont


class ConsolePanel(ctk.CTkFrame):
    def __init__(self, parent, main_app):
        super().__init__(parent, height=250, corner_radius=15)
        self.app = main_app
        self.grid_propagate(False)
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self.header = ctk.CTkLabel(self, text="🖥️ Output Console", font=ctk.CTkFont(size=16, weight="bold"))
        self.header.grid(row=0, column=0, padx=10, pady=(10, 0), sticky="w")

        self.text = tk.Text(self, wrap="word", padx=10, pady=10, borderwidth=0, highlightthickness=0)
        self.text.grid(row=1, column=0, sticky="nsew", padx=10, pady=10)
        
        self.scroll = ctk.CTkScrollbar(self, command=self.text.yview)
        self.scroll.grid(row=1, column=1, sticky="ns", pady=10)
        self.text.configure(yscrollcommand=self.scroll.set)

        self.text.configure(state="disabled")
        self._setup_tags()
        self._apply_theme()

    def _setup_tags(self):
        self.text.tag_configure("error", foreground="#ff5555")
        self.text.tag_configure("success", foreground="#95E472")
        self.text.tag_configure("info", foreground="#4ECDC4")
        self.text.tag_configure("beginner", foreground="#FFB347", font=tkfont.Font(weight="bold"))

    def _apply_theme(self):
        if self.app.settings.get("theme") == "dark":
            self.text.configure(bg="#1e1e1e", fg="#cccccc")
        else:
            self.text.configure(bg="#f9f9f9", fg="#333333")

    def refresh_theme(self):
        self._apply_theme()

    def write_output(self, text, tag="normal"):
        self.text.configure(state="normal")
        self.text.insert("end", text + "\n", tag)
        self.text.see("end")
        self.text.configure(state="disabled")

    def clear(self):
        self.text.configure(state="normal")
        self.text.delete("1.0", "end")
        self.text.configure(state="disabled")