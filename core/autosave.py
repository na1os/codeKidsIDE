"""Autosave timer - saves files every 30 seconds"""


class AutosaveManager:
    def __init__(self, callback, interval=30000):
        self.callback = callback
        self.interval = interval
        self.window = None
        self._running = False
        self._after_id = None

    def start(self, window):
        if self._running:
            return
        self.window = window
        self._running = True
        self._schedule()

    def _schedule(self):
        if self._running and self.window:
            self._after_id = self.window.after(self.interval, self._tick)

    def _tick(self):
        if not self._running:
            return
        self.callback()
        self._schedule()

    def stop(self):
        self._running = False
        if self._after_id and self.window:
            try:
                self.window.after_cancel(self._after_id)
            except Exception:
                pass
            self._after_id = None