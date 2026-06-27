"""Color themes and font stuff"""
import platform


def get_default_font():
    system = platform.system()
    if system == "Windows":
        return "Consolas"
    elif system == "Darwin":
        return "Menlo"
    return "DejaVu Sans Mono"


# friendly colors for kids
BUTTON_COLORS = {
    "run": "#4ECDC4",
    "save": "#95E472",
    "new": "#FFB347",
    "open": "#A78BFA",
    "template": "#FF6B9D",
}


def darken(hex_color, amount=0.15):
    """make a hex color a bit darker for hover effects"""
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    r = max(0, int(r * (1 - amount)))
    g = max(0, int(g * (1 - amount)))
    b = max(0, int(b * (1 - amount)))
    return f"#{r:02x}{g:02x}{b:02x}"