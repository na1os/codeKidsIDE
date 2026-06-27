"""Main application class - boots up the whole IDE"""
import customtkinter as ctk
from ui.main_window import MainWindow
from utils.storage import SettingsManager, ProgressManager


class CodeKidsApp:
    def __init__(self):
        self.settings = SettingsManager()
        self.progress = ProgressManager()
        self.window = MainWindow(self.settings, self.progress)

    def run(self):
        self.window.mainloop()