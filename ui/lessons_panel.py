"""Lessons tab UI"""
import customtkinter as ctk
from core.lessons_data import LESSONS


class LessonsPanel(ctk.CTkFrame):
    def __init__(self, parent, main_app):
        super().__init__(parent, corner_radius=15)
        self.app = main_app
        
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self.header = ctk.CTkLabel(self, text="🎓 CodeKids Lessons", font=ctk.CTkFont(size=24, weight="bold"))
        self.header.grid(row=0, column=0, padx=20, pady=20)

        self.scroll = ctk.CTkScrollableFrame(self)
        self.scroll.grid(row=1, column=0, sticky="nsew", padx=20, pady=(0, 20))

        for lesson in LESSONS:
            self._create_lesson_card(lesson)

    def _create_lesson_card(self, lesson):
        bg_color = "#2b2b2b" if self.app.settings.get("theme")=="dark" else "#e0e0e0"
        card = ctk.CTkFrame(self.scroll, corner_radius=15, fg_color=bg_color)
        card.pack(fill="x", pady=10, padx=10)

        title = ctk.CTkLabel(card, text=lesson["title"], font=ctk.CTkFont(size=18, weight="bold"))
        title.pack(anchor="w", padx=15, pady=(10, 0))

        desc = ctk.CTkLabel(card, text=lesson["description"], wraplength=600)
        desc.pack(anchor="w", padx=15, pady=5)

        is_done = self.app.progress.is_lesson_complete(lesson["id"])
        status_text = "✅ Completed!" if is_done else "Not done yet"
        status = ctk.CTkLabel(card, text=status_text, text_color="#95E472" if is_done else "#888")
        status.pack(anchor="w", padx=15)

        btn = ctk.CTkButton(card, text="Start Lesson", fg_color="#4ECDC4", text_color="black",
                            command=lambda l=lesson: self.app.load_lesson(l))
        btn.pack(anchor="e", padx=15, pady=10)