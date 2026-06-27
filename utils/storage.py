"""Handles saving/loading settings and progress to disk"""
import json
import os


class SettingsManager:
    """Stores user preferences in ~/.codekids/settings.json"""

    DEFAULTS = {
        "theme": "dark",
        "font_family": "Consolas",
        "font_size": 14,
        "beginner_mode": True,
        "autosave": True,
        "project_dir": os.path.join(os.path.expanduser("~"), "CodeKidsProjects"),
    }

    def __init__(self):
        self._data = {}
        config_dir = os.path.join(os.path.expanduser("~"), ".codekids")
        self.filepath = os.path.join(config_dir, "settings.json")
        self._load()

    def _load(self):
        try:
            with open(self.filepath, "r") as f:
                self._data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self._data = dict(self.DEFAULTS)

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w") as f:
            json.dump(self._data, f, indent=2)

    def get(self, key, default=None):
        return self._data.get(key, self.DEFAULTS.get(key, default))

    def set(self, key, value):
        self._data[key] = value
        self._save()


class ProgressManager:
    """Tracks which lessons are done and what badges the kid earned"""

    def __init__(self):
        self.data = {"completed_lessons": [], "badges": []}
        config_dir = os.path.join(os.path.expanduser("~"), ".codekids")
        self.filepath = os.path.join(config_dir, "progress.json")
        self._load()

    def _load(self):
        try:
            with open(self.filepath, "r") as f:
                self.data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass  # just use defaults

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w") as f:
            json.dump(self.data, f, indent=2)

    def complete_lesson(self, lesson_id, badge_id=None):
        if lesson_id not in self.data["completed_lessons"]:
            self.data["completed_lessons"].append(lesson_id)
        if badge_id and badge_id not in self.data["badges"]:
            self.data["badges"].append(badge_id)
        self._save()

    def is_lesson_complete(self, lesson_id):
        return lesson_id in self.data["completed_lessons"]

    def has_badge(self, badge_id):
        return badge_id in self.data["badges"]

    def get_completed_count(self):
        return len(self.data["completed_lessons"])

    def get_badges(self):
        return list(self.data["badges"])

    def add_badge(self, badge_id):
        if badge_id not in self.data["badges"]:
            self.data["badges"].append(badge_id)
            self._save()