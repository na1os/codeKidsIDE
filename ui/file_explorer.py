"""File explorer panel on the left"""
import customtkinter as ctk
import os
from tkinter import filedialog


class FileExplorer(ctk.CTkFrame):
    def __init__(self, parent, main_app):
        super().__init__(parent, corner_radius=15, width=250)
        self.app = main_app
        self.grid_propagate(False)
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self.header = ctk.CTkLabel(self, text="📁 Files", font=ctk.CTkFont(size=20, weight="bold"))
        self.header.grid(row=0, column=0, padx=10, pady=10, sticky="w")

        self.scroll_frame = ctk.CTkScrollableFrame(self, label_text="")
        self.scroll_frame.grid(row=1, column=0, sticky="nsew", padx=5, pady=5)

        self.btn_open_dir = ctk.CTkButton(self, text="Open Folder", command=self.open_dir)
        self.btn_open_dir.grid(row=2, column=0, padx=10, pady=10, sticky="ew")

        self.current_dir = None

    def open_dir(self):
        d = filedialog.askdirectory(title="Select Project Folder")
        if d:
            self.current_dir = d
            self.app.settings.set("project_dir", d)
            self.load_files(d)

    def load_files(self, directory):
        for w in self.scroll_frame.winfo_children():
            w.destroy()
        
        try:
            items = os.listdir(directory)
        except PermissionError:
            return

        for item in items:
            full_path = os.path.join(directory, item)
            if os.path.isfile(full_path) and item.endswith(".py"):
                btn = ctk.CTkButton(self.scroll_frame, text=f"🐍 {item}", anchor="w",
                                    fg_color="transparent", hover_color="#3a3a3a",
                                    command=lambda p=full_path, n=item: self.app.open_file_from_path(p, n))
                btn.pack(fill="x", pady=2)
            elif os.path.isdir(full_path):
                btn = ctk.CTkButton(self.scroll_frame, text=f"📁 {item}", anchor="w",
                                    fg_color="transparent", hover_color="#3a3a3a",
                                    command=lambda p=full_path, n=item: self.load_files(p))
                btn.pack(fill="x", pady=2)