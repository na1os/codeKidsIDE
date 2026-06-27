"""Achievements and badges tab UI"""
import customtkinter as ctk
from core.lessons_data import BADGES


class AchievementsPanel(ctk.CTkFrame):
    def __init__(self, parent, main_app):
        super().__init__(parent, corner_radius=15)
        self.app = main_app
        
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self.header = ctk.CTkLabel(self, text="🏆 Your Badges", font=ctk.CTkFont(size=24, weight="bold"))
        self.header.grid(row=0, column=0, padx=20, pady=20)

        self.scroll = ctk.CTkScrollableFrame(self)
        self.scroll.grid(row=1, column=0, sticky="nsew", padx=20, pady=(0, 20))

        self.refresh()

    def refresh(self):
        for w in self.scroll.winfo_children():
            w.destroy()
            
        earned = self.app.progress.get_badges()
        bg_color = "#2b2b2b" if self.app.settings.get("theme")=="dark" else "#e0e0e0"
        
        for bid, bdata in BADGES.items():
            has_it = bid in earned
            card = ctk.CTkFrame(self.scroll, corner_radius=15, fg_color=bg_color)
            card.pack(fill="x", pady=10, padx=10)

            icon = ctk.CTkLabel(card, text=bdata["icon"], font=ctk.CTkFont(size=48))
            icon.pack(side="left", padx=20, pady=15)

            info_frame = ctk.CTkFrame(card, fg_color="transparent")
            info_frame.pack(side="left", fill="x", expand=True, pady=15)

            name = ctk.CTkLabel(info_frame, text=bdata["name"], font=ctk.CTkFont(size=18, weight="bold"))
            name.pack(anchor="w")

            desc = ctk.CTkLabel(info_frame, text=bdata["description"], text_color="#888")
            desc.pack(anchor="w")

            if has_it:
                status = ctk.CTkLabel(info_frame, text="Earned! 🎉", text_color="#95E472", font=ctk.CTkFont(weight="bold"))
            else:
                status = ctk.CTkLabel(info_frame, text="Locked 🔒", text_color="#666")
            status.pack(anchor="w")