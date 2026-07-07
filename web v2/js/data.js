const LESSONS = [
  {
    id: "hello_world", title: "1. Hello World", description: "Your first program",
    code: `print("Hello, World!")`, hint: "Use print() with your message inside quotes.",
    hints: ["The print() function displays things on the screen.", "The text must be put inside quotes."],
    solution: 'print("Hello, World!")', question: "What do you think this program will output if you replace 'Hello, World!' with your name?",
    expected: "Hello, World!", badge: "first_steps", xp: 20,
  },
  {
    id: "variables", title: "2. Variables", description: "Store information",
    code: `name = "Alex"\nprint(name)`, hint: "Use = to assign a value.",
    hints: ["Variables save data.", "Use print(variable_name) without quotes."],
    solution: `name = "Alex"\nprint(name)`, question: "How do you think you can replace 'Alex' with your age?",
    expected: "Alex", badge: "variable_master", xp: 50,
  },
  {
    id: "math_magic", title: "3. Math Magic", description: "Python calculates",
    code: `print(5 + 3)\nprint(10 * 4)`, hint: "Use +, -, *, /.",
    hints: ["The symbol for multiplication is *", "You can put math operations directly inside print()"],
    solution: `print(5 + 3)\nprint(10 * 4)`, question: "Can you solve 10 * 4 using only addition (10+10+10+10)?",
    expected: "8\n40", badge: "math_wizard", xp: 50,
  },
  {
    id: "booleans", title: "4. True or False", description: "Logic in Python",
    code: `is_coding = True\nprint(is_coding)`, hint: "True and False must be capitalized.",
    hints: ["Boolean means True or False.", "The first letter must be capitalized: True."],
    solution: `is_coding = True\nprint(is_coding)`, question: "What will happen if you change True to False?",
    expected: "True", badge: "logic_pro", xp: 100,
  },
  {
    id: "dictionaries", title: "5. Dictionaries", description: "Key-value pairs",
    code: `player = {"name": "Alex", "score": 100}\nprint(player["score"])`, hint: "Use curly braces {} and a colon :",
    hints: ["Dictionaries use keys to access values.", "Use square brackets [] to access the value."],
    solution: `player = {"name": "Alex", "score": 100}\nprint(player["score"])`, question: "How do you display 'name' instead of 'score'?",
    expected: "100", badge: "data_boss", xp: 100,
  }
];

const CHALLENGES = [
  { id: "c1", title: "Area of a Square", description: "Display the area of a square with a side of 7.", code: `# Calculate the area here`, hint: "Area = side * side", expected: "49", xp: 50 },
  { id: "c2", title: "Big Multiplication", description: "Display the result of multiplying 123 by 456.", code: `# Perform the multiplication here`, hint: "Use the * operator", expected: "56088", xp: 50 }
];

const BADGES = {
  first_steps: { name: "First Steps", description: "You wrote your first code" },
  variable_master: { name: "Variable Master", description: "You stored data" },
  math_wizard: { name: "Math Wizard", description: "You calculated something" },
  logic_pro: { name: "Logic Pro", description: "You mastered boolean logic" },
  data_boss: { name: "Data Boss", description: "You managed key-value pairs" },
  code_champion: { name: "Code Champion", description: "You completed all challenges" }
};

const ACHIEVEMENTS = {
  first_program: { name: "First Program", desc: "You ran code for the first time!", xp: 10 },
  bugs_10: { name: "10 Bugs Fixed", desc: "You fixed 10 errors!", xp: 50 },
  lines_100: { name: "100 Lines Written", desc: "You wrote 100 lines of code!", xp: 50 },
  first_function: { name: "First Function", desc: "You created a function with def!", xp: 30 },
  streak_7: { name: "7 Day Streak", desc: "You coded 7 days in a row!", xp: 100 }
};

const DAILY_CHALLENGES = [
  { id: "d1", prompt: "Write a program that displays the sum of 15 and 27.", expected: "42", xp: 100 },
  { id: "d2", prompt: "Display the result of dividing 100 by 5.", expected: "20.0", xp: 100 },
  { id: "d3", prompt: "Create a variable named 'age' with the value 12 and display it.", expected: "12", xp: 100 }
];

const DEFAULT_CODE = `print("Welcome to CodeKids!")`;