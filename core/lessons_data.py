"""Built-in lessons and badge definitions"""


LESSONS = [
    {
        "id": "hello_world",
        "title": "1. Hello, World!",
        "description": "Write your very first Python program!",
        "code": (
            "# Welcome to your first Python program!\n"
            "# The print() function shows text on the screen.\n\n"
            '# Write your code below:\n'
            'print("Hello, World!")\n'
        ),
        "hint": "Use print() with your message inside quotes.",
        "expected": "Hello, World!",
        "badge": "first_steps",
    },
    {
        "id": "variables",
        "title": "2. Variables",
        "description": "Variables are like boxes that store information.",
        "code": (
            "# Variables store information!\n"
            "# Think of them as labeled boxes.\n\n"
            '# Create a variable called "name"\n'
            'name = "Alex"\n\n'
            "# Now print it!\n"
            "print(name)\n"
        ),
        "hint": 'Use = to store a value. Like: name = "Your Name"',
        "expected": "Alex",
        "badge": "variable_master",
    },
    {
        "id": "math_magic",
        "title": "3. Math Magic",
        "description": "Python can do math! Try some calculations.",
        "code": (
            "# Python is a great calculator!\n"
            "# +  -  *  /  are the basic operations\n\n"
            "print(5 + 3)\n"
            "print(10 * 4)\n"
            "print(20 - 7)\n"
            "print(100 / 5)\n"
        ),
        "hint": "Just use numbers and math symbols inside print().",
        "expected": "20",
        "badge": "math_wizard",
    },
    {
        "id": "decisions",
        "title": "4. Making Decisions",
        "description": "Use if/else to make your program think!",
        "code": (
            "# if/else lets your program make choices\n\n"
            "age = 10\n\n"
            "if age >= 13:\n"
            '    print("You are a teenager!")\n'
            "else:\n"
            '    print("You are still a kid!")\n'
        ),
        "hint": "Don't forget the colon (:) after if and else!",
        "expected": "You are still a kid!",
        "badge": "decision_maker",
    },
    {
        "id": "loops",
        "title": "5. Loops",
        "description": "Loops let you repeat things without typing them again.",
        "code": (
            "# for loops repeat code multiple times\n\n"
            'for i in range(5):\n'
            '    print("Loop number:", i)\n'
        ),
        "hint": "range(5) counts from 0 to 4. Don't forget the colon!",
        "expected": "Loop number: 4",
        "badge": "loop_champion",
    },
    {
        "id": "functions",
        "title": "6. Functions",
        "description": "Functions are reusable blocks of code.",
        "code": (
            "# Functions let you reuse code!\n"
            "# def creates a function\n\n"
            "def greet(name):\n"
            '    print("Hello, " + name + "!")\n\n'
            'greet("Python")\n'
            'greet("CodeKids")\n'
        ),
        "hint": "Use def function_name(parameters): to define a function.",
        "expected": "Hello, CodeKids!",
        "badge": "function_builder",
    },
    {
        "id": "lists",
        "title": "7. Lists",
        "description": "Lists store multiple values in one variable.",
        "code": (
            "# Lists hold multiple items\n\n"
            "fruits = [\"apple\", \"banana\", \"cherry\"]\n\n"
            "print(fruits[0])  # first item\n"
            "print(fruits[1])  # second item\n"
            "print(len(fruits))  # how many items?\n"
        ),
        "hint": "List indexes start at 0, not 1!",
        "expected": "3",
        "badge": "list_master",
    },
    {
        "id": "string_fun",
        "title": "8. String Fun",
        "description": "Strings are text - let's do fun things with them!",
        "code": (
            "# Strings are text in Python\n\n"
            "word = \"CodeKids\"\n\n"
            "print(word.upper())      # ALL CAPS\n"
            "print(word.lower())      # all lowercase\n"
            "print(len(word))         # how long?\n"
            "print(word + \" is fun!\")  # join text\n"
        ),
        "hint": "Strings have methods like .upper() and .lower()",
        "expected": "CodeKids is fun!",
        "badge": "text_wizard",
    },
]


BADGES = {
    "first_steps": {
        "name": "First Steps",
        "icon": "🌱",
        "description": "Complete your first Python program",
    },
    "variable_master": {
        "name": "Variable Master",
        "icon": "📦",
        "description": "Learn to use variables",
    },
    "math_wizard": {
        "name": "Math Wizard",
        "icon": "🔢",
        "description": "Master math operations",
    },
    "decision_maker": {
        "name": "Decision Maker",
        "icon": "🤔",
        "description": "Learn if statements",
    },
    "loop_champion": {
        "name": "Loop Champion",
        "icon": "🔄",
        "description": "Master loops",
    },
    "function_builder": {
        "name": "Function Builder",
        "icon": "🛠️",
        "description": "Create your own functions",
    },
    "list_master": {
        "name": "List Master",
        "icon": "📚",
        "description": "Work with lists",
    },
    "text_wizard": {
        "name": "Text Wizard",
        "icon": "✨",
        "description": "Master strings",
    },
    "code_champion": {
        "name": "Code Champion",
        "icon": "🏆",
        "description": "Complete ALL lessons",
    },
}