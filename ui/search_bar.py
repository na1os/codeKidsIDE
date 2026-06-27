"""Search and replace bar"""
import customtkinter as ctk
from tkinter import messagebox


class SearchBar(ctk.CTkFrame):
    def __init__(self, parent, main_app):
        super().__init__(parent, corner_radius=10, fg_color="#3a3a3a")
        self.app = main_app
        
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure(4, weight=1)
        
        self.find_label = ctk.CTkLabel(self, text="Find:", text_color="white")
        self.find_label.grid(row=0, column=0, padx=5, pady=5)
        
        self.find_entry = ctk.CTkEntry(self)
        self.find_entry.grid(row=0, column=1, sticky="ew", padx=5, pady=5)
        
        self.btn_next = ctk.CTkButton(self, text="Next", width=60, command=self.find_next)
        self.btn_next.grid(row=0, column=2, padx=5, pady=5)
        
        self.replace_label = ctk.CTkLabel(self, text="Replace:", text_color="white")
        self.replace_label.grid(row=0, column=3, padx=5, pady=5)
        
        self.replace_entry = ctk.CTkEntry(self)
        self.replace_entry.grid(row=0, column=4, sticky="ew", padx=5, pady=5)
        
        self.btn_replace = ctk.CTkButton(self, text="Replace", width=80, command=self.replace_text)
        self.btn_replace.grid(row=0, column=5, padx=5, pady=5)
        
        self.btn_close = ctk.CTkButton(self, text="✖", width=30, fg_color="#ff5555", command=self.toggle)
        self.btn_close.grid(row=0, column=6, padx=5, pady=5)
        
    def toggle(self):
        if self.winfo_ismapped():
            self.grid_remove()
        else:
            self.grid()
            self.find_entry.focus()
            
    def find_next(self):
        target = self.find_entry.get()
        if not target:
            return
            
        text_widget = self.app.editor.text
        current_pos = text_widget.index("insert")
        
        pos = text_widget.search(target, current_pos, stopindex="end", nocase=1)
        if not pos:
            pos = text_widget.search(target, "1.0", stopindex="end", nocase=1)
            
        if pos:
            end_pos = f"{pos}+{len(target)}c"
            text_widget.tag_remove("sel", "1.0", "end")
            text_widget.tag_add("sel", pos, end_pos)
            text_widget.mark_set("insert", end_pos)
            text_widget.see(pos)
        else:
            messagebox.showinfo("Not Found", f"Cannot find '{target}'", parent=self)
            
    def replace_text(self):
        target = self.find_entry.get()
        replace_with = self.replace_entry.get()
        if not target:
            return
            
        text_widget = self.app.editor.text
        if text_widget.tag_ranges("sel"):
            start = text_widget.index("sel.first")
            end = text_widget.index("sel.last")
            text_widget.delete(start, end)
            text_widget.insert(start, replace_with)
            self.app.editor.highlighter.highlight()
            self.find_next()
        else:
            self.find_next()