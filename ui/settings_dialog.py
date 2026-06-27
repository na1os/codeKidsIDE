"""Settings popup window"""
import customtkinter as ctk


class SettingsDialog(ctk.CTkToplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.app = parent
        self.settings = parent.settings
        
        self.title("Settings")
        self.geometry("400x450")
        self.resizable(False, False)
        
        self.grid_columnconfigure(0, weight=1)
        
        self.header = ctk.CTkLabel(self, text="⚙️ Settings", font=ctk.CTkFont(size=24, weight="bold"))
        self.header.grid(row=0, column=0, pady=20)

        self.theme_var = ctk.StringVar(value=self.settings.get("theme"))
        theme_menu = ctk.CTkOptionMenu(self, values=["dark", "light"], variable=self.theme_var, 
                                       command=self.change_theme)
        theme_menu.grid(row=1, column=0, pady=10)

        self.beg_var = ctk.BooleanVar(value=self.settings.get("beginner_mode"))
        beg_switch = ctk.CTkSwitch(self, text="Beginner Mode (Explain errors)", variable=self.beg_var,
                                   command=self.toggle_beginner)
        beg_switch.grid(row=2, column=0, pady=10)

        self.auto_var = ctk.BooleanVar(value=self.settings.get("autosave"))
        auto_switch = ctk.CTkSwitch(self, text="Autosave (every 30s)", variable=self.auto_var,
                                    command=self.toggle_autosave)
        auto_switch.grid(row=3, column=0, pady=10)

        self.size_var = ctk.IntVar(value=self.settings.get("font_size"))
        size_slider = ctk.CTkSlider(self, from_=10, to=24, variable=self.size_var, command=self.change_font_size)
        size_slider.grid(row=4, column=0, pady=20, padx=50, sticky="ew")
        
        self.size_label = ctk.CTkLabel(self, text=f"Font Size: {self.size_var.get()}")
        self.size_label.grid(row=5, column=0)

    def change_theme(self, val):
        self.settings.set("theme", val)
        self.app.apply_theme()

    def toggle_beginner(self):
        self.settings.set("beginner_mode", self.beg_var.get())

    def toggle_autosave(self):
        self.settings.set("autosave", self.auto_var.get())

    def change_font_size(self, val):
        val = int(val)
        self.size_label.configure(text=f"Font Size: {val}")
        self.settings.set("font_size", val)
        self.app.editor._apply_theme()