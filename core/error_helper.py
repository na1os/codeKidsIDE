"""Turns scary Python errors into kid-friendly explanations"""
import re


def explain_error(error_text):
    """Returns a simple explanation of a Python error"""

    line_match = re.search(r"line (\d+)", error_text)
    line_info = f"\n\nLook at line {line_match.group(1)}." if line_match else ""

    patterns = [
        (
            r"SyntaxError: invalid syntax",
            f"Oops! There's a small mistake in your code.{line_info} "
            "Check if you forgot a colon (:) at the end of a line, "
            "or maybe a parenthesis or quote mark is missing.",
        ),
        (
            r"NameError: name '(\w+)' is not defined",
            lambda m: (
                f"Hmm, you used '{m.group(1)}' but Python doesn't know what it is. "
                f"Did you forget to create it first, or maybe you spelled it wrong?"
                f"{line_info}"
            ),
        ),
        (
            r"IndentationError: (.+)",
            lambda m: (
                f"Watch your spaces! Python is very picky about indentation. "
                f"{m.group(1)} Make sure you use the same number of spaces "
                f"at the start of each line.{line_info}"
            ),
        ),
        (
            r"TypeError: (.+)",
            lambda m: (
                f"Type trouble! {m.group(1)} "
                "You might be trying to use a number where text is needed, "
                "or the other way around." + line_info
            ),
        ),
        (
            r"IndexError: list index out of range",
            "Whoa! You're trying to get an item from a list that doesn't exist. "
            "Remember, lists start at 0, so a list with 3 items has indexes 0, 1, and 2."
            + line_info,
        ),
        (
            r"ZeroDivisionError",
            "You can't divide by zero! It's like trying to share 10 cookies "
            "among 0 friends - it doesn't make sense!",
        ),
        (
            r"ValueError: (.+)",
            lambda m: f"Wrong value! {m.group(1)} Check if you're giving "
            f"the right kind of value to a function.{line_info}",
        ),
        (
            r"AttributeError: .*'(\w+)' object has no attribute '(\w+)'",
            lambda m: f"A '{m.group(1)}' doesn't have a feature called "
            f"'{m.group(2)}'. Check if you spelled it right!{line_info}",
        ),
        (
            r"ModuleNotFoundError: No module named '(\w+)'",
            lambda m: f"Python can't find the '{m.group(1)}' module. "
            f"You might need to install it first, or check the spelling.{line_info}",
        ),
        (
            r"EOFError",
            "Your program tried to read input but there was nothing to read. "
            "The input() function doesn't work well in this IDE - "
            "try using fixed values instead!",
        ),
        (
            r"KeyError: (.+)",
            lambda m: f"The key {m.group(1)} was not found in your dictionary. "
            f"Check if the key exists before using it!{line_info}",
        ),
        (
            r"RecursionError",
            "Your function is calling itself too many times! "
            "This is called infinite recursion. Make sure your function "
            "has a way to stop calling itself.",
        ),
    ]

    for pattern, explanation in patterns:
        match = re.search(pattern, error_text)
        if match:
            if callable(explanation):
                return explanation(match)
            return explanation

    return (
        f"Something went wrong in your code.{line_info}\n"
        "Don't worry, making mistakes is how we learn! "
        "Try to fix the error and run again."
    )