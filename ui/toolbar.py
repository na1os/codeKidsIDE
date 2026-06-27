"""Top toolbar with big friendly buttons"""
import customtkinter as ctk
from utils.theme import BUTTON_COLORS, darken


class Toolbar(ctk.CTkFrame):
    def __init__(self, parent, main_app):
        super().__init__(parent, corner_radius=15)
        self.app = main_app
        self.settings = main_app.settings
        
        self.grid_columnconfigure((0,1,2,3,4,5,6,7), weight=0)
        self.grid_columnconfigure(8, weight=1)

        self.btn_new = self._make_btn("➕ New", BUTTON_COLORS["new"], self.app.new_file, 0)
        self.btn_open = self._make_btn("📂 Open", BUTTON_COLORS["open"], self.app.open_file, 1)
        self.btn_save = self._make_btn("💾 Save", BUTTON_COLORS["save"], self.app.save_file, 2)
        self.btn_run = self._make_btn("▶️ Run", BUTTON_COLORS["run"], self.app.run_code, 3)
        self.btn_search = self._make_btn("🔍 Search", "#6B7280", self.app.toggle_search, 4)
        self.btn_template = self._make_btn("📄 Template", BUTTON_COLORS["template"], self.app.open_template_menu, 5)
        self.btn_settings = self._make_btn("⚙️ Settings", "#6B7280", self.app.open_settings, 6)
        
        self.theme_switch = ctk.CTkSwitch(self, text="Dark Mode", command=self.app.toggle_theme)
        self.theme_switch.grid(row=0, column=7, padx=10, pady=10)
        if self.settings.get("theme") == "dark":
            self.theme_switch.select()

    def _make_btn(self, text, color, cmd, col):
        btn = ctk.CTkButton(self, text=text, fg_color=color, hover_color=darken(color), 
                            text_color="black", font=ctk.CTkFont(size=16, weight="bold"), 
                            corner_radius=20, command=cmd)
        btn.grid(row=0, column=col, padx=5, pady=10, sticky="w")
        return btn