"""Python syntax highlighting using regex tokens"""
import re


class SyntaxHighlighter:
    """Highlights Python code in a tkinter Text widget"""

    KEYWORDS = {
        "def", "class", "if", "else", "elif", "for", "while", "return",
        "import", "from", "as", "try", "except", "finally", "with",
        "lambda", "yield", "pass", "break", "continue", "in", "not",
        "and", "or", "is", "global", "nonlocal", "assert", "del", "raise",
        "None", "True", "False",
    }

    BUILTINS = {
        "print", "len", "range", "str", "int", "float", "list", "dict",
        "set", "tuple", "bool", "input", "open", "type", "isinstance",
        "enumerate", "zip", "map", "filter", "sorted", "reversed",
        "sum", "min", "max", "abs", "round", "format", "super", "property",
        "append", "split", "join", "replace", "upper", "lower", "strip",
    }

    # the order here matters - strings/comments need to be matched first
    # so keywords inside them don't get highlighted
    TOKEN_RE = re.compile(
        r"""
        (?P<comment>\#[^\n]*)
      | (?P<triple_d>\"\"\"[\s\S]*?\"\"\")
      | (?P<triple_s>\'\'\'[\s\S]*?\'\'\')
      | (?P<d_string>\"[^\n]*?\")
      | (?P<s_string>\'[^\n]*?\')
      | (?P<number>\b\d+\.?\d*\b)
      | (?P<word>\b[A-Za-z_]\w*\b)
      | (?P<other>.)
        """,
        re.VERBOSE,
    )

    COLORS = {
        "dark": {
            "keyword": "#FF6B9D",
            "string": "#95E472",
            "comment": "#6B7280",
            "number": "#FFB347",
            "function": "#4ECDC4",
            "builtin": "#FFD93D",
            "class_name": "#A78BFA",
        },
        "light": {
            "keyword": "#D6336C",
            "string": "#2D8B3F",
            "comment": "#8B95A5",
            "number": "#E8590C",
            "function": "#0CA678",
            "builtin": "#C4410C",
            "class_name": "#7048E8",
        },
    }

    def __init__(self, text_widget, theme="dark"):
        self.text = text_widget
        self.theme = theme
        self._setup_tags()

    def _setup_tags(self):
        colors = self.COLORS.get(self.theme, self.COLORS["dark"])
        for tag, color in colors.items():
            self.text.tag_configure(tag, foreground=color)
        # make sure strings and comments show on top of other tags
        self.text.tag_raise("string")
        self.text.tag_raise("comment")

    def set_theme(self, theme):
        self.theme = theme
        self._setup_tags()

    def highlight(self):
        """Re-highlight the entire text content"""
        for tag in self.COLORS["dark"]:
            self.text.tag_remove(tag, "1.0", "end")

        content = self.text.get("1.0", "end-1c")
        if not content.strip():
            return

        for match in self.TOKEN_RE.finditer(content):
            group = match.lastgroup
            start = f"1.0 + {match.start()} chars"
            end = f"1.0 + {match.end()} chars"

            if group == "comment":
                self.text.tag_add("comment", start, end)
            elif group in ("triple_d", "triple_s", "d_string", "s_string"):
                self.text.tag_add("string", start, end)
            elif group == "number":
                self.text.tag_add("number", start, end)
            elif group == "word":
                word = match.group()
                if word in self.KEYWORDS:
                    self.text.tag_add("keyword", start, end)
                elif word in self.BUILTINS:
                    self.text.tag_add("builtin", start, end)
                elif word[0].isupper():
                    self.text.tag_add("class_name", start, end)
                else:
                    # check if it's a function call
                    rest = content[match.end():]
                    if rest.lstrip().startswith("("):
                        self.text.tag_add("function", start, end)