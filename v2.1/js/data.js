const LESSONS = [
  {
    id: "hello_world", 
    title: "1. Hello World", 
    description: "Your first program",
    theory: "In Python, we use the `print()` function to display text on the screen. The text must be put inside quotes \"\" or ''.",
    code: `print("Hello, World!")`, 
    hint: "Use print() with your message inside quotes.",
    hints: ["The print() function displays things on the screen.", "Text must be put inside quotes."],
    solution: 'print("Hello, World!")', 
    question: "What do you think this program will display if you replace 'Hello, World!' with your name?",
    expected: "Hello, World!", 
    badge: "first_steps", 
    xp: 20,
  },
  {
    id: "variables", 
    title: "2. Variables", 
    description: "Keep information",
    theory: "Variables are boxes where we save data. We use the equals sign `=` to put a value into a variable. Ex: `age = 10`.",
    code: `name = "Alex"\nprint(name)`, 
    hint: "Use = to assign a value.",
    hints: ["The variable saves data.", "Use print(variable_name) without quotes."],
    solution: `name = "Alex"\nprint(name)`, 
    question: "How do you think you can change 'Alex' to your age?",
    expected: "Alex", 
    badge: "variable_master", 
    xp: 50,
  },
  {
    id: "math_magic", 
    title: "3. Mathematical Operations", 
    description: "Python knows how to calculate",
    theory: "Python can be used as a calculator. It can add (+), subtract (-), multiply (*), and divide (/).",
    code: `print(5 + 3)\nprint(10 * 4)`, 
    hint: "Use +, -, *, /.",
    hints: ["The symbol for multiplication is *", "You can put mathematical operations directly inside print()"],
    solution: `print(5 + 3)\nprint(10 * 4)`, 
    question: "Can you solve 10 * 4 using only addition (10+10+10+10)?",
    expected: "8\n40", 
    badge: "math_wizard", 
    xp: 50,
  },
  {
    id: "if_else", 
    title: "4. If / Else", 
    description: "Making decisions",
    theory: "We can make the program take decisions. If a condition is true, it does something. If not, it does something else. Pay attention to indentation (spaces at the beginning)!",
    code: `age = 12\nif age > 10:\n    print("Older than 10")\nelse:\n    print("10 or younger")`, 
    hint: "Use ':' after if and else, and put 4 spaces for the code below.",
    hints: ["The condition is checked with >, <, ==.", "The code under if/else must be moved with 4 spaces (Tab)."],
    solution: `age = 12\nif age > 10:\n    print("Older than 10")\nelse:\n    print("10 or younger")`, 
    question: "What is displayed if you change 12 to 8?",
    expected: "Older than 10", 
    badge: "logic_pro", 
    xp: 100,
  },
  {
    id: "for_loops", 
    title: "5. For Loops", 
    description: "Repeat an action",
    theory: "The `for` loops repeat code a certain number of times. `for i in range(5):` will repeat the code 5 times (i will be 0, 1, 2, 3, 4).",
    code: `for i in range(5):\n    print(i)`, 
    hint: "range(5) means it repeats 5 times.",
    hints: ["range(5) generates the numbers 0, 1, 2, 3, 4.", "Don't forget ':' and the spaces!"],
    solution: `for i in range(5):\n    print(i)`, 
    question: "How do you display numbers from 0 to 9?",
    expected: "0\n1\n2\n3\n4", 
    badge: "loop_master", 
    xp: 100,
  },
  {
    id: "lists", 
    title: "6. Lists", 
    description: "Hold multiple values",
    theory: "Lists store multiple values in a single variable. Ex: `fruits = ['apple', 'pear']`. You access an element by its position: `fruits[0]`.",
    code: `colors = ["red", "green", "blue"]\nprint(colors[1])`, 
    hint: "Lists use square brackets [].",
    hints: ["The first position in a list is 0, the second is 1.", "colors[1] is the second element."],
    solution: `colors = ["red", "green", "blue"]\nprint(colors[1])`, 
    question: "How do you display 'red'?",
    expected: "green", 
    badge: "data_boss", 
    xp: 100,
  },
  {
    id: "functions", 
    title: "7. Functions", 
    description: "Reusable code",
    theory: "Functions are blocks of code that we can reuse. They are defined with `def function_name():`",
    code: `def greet():\n    print("Hello!")\n\ngreet()`, 
    hint: "Define the function, then call it.",
    hints: ["The function is created with def name():", "To run the function, write name() without def."],
    solution: `def greet():\n    print("Hello!")\n\ngreet()`, 
    question: "What happens if you call greet() twice?",
    expected: "Hello!", 
    badge: "code_champion", 
    xp: 120,
  }
];

const CHALLENGES = [
  { id: "c1", title: "Square Area", description: "Display the area of a square with side 7.", code: `\n`, hint: "Area = side * side", expected: "49", xp: 50 },
  { id: "c2", title: "Big Multiplication", description: "Display the result of multiplying 123 by 456.", code: `\n`, hint: "Use the * operator", expected: "56088", xp: 50 }
];

const BADGES = {
  first_steps: { name: "First Steps", description: "You wrote your first code" },
  variable_master: { name: "Variable Master", description: "You stored data" },
  math_wizard: { name: "Math Wizard", description: "You calculated something" },
  logic_pro: { name: "Logic Pro", description: "You mastered boolean logic" },
  loop_master: { name: "Loop Master", description: "You repeated code" },
  data_boss: { name: "Data Boss", description: "You managed lists" },
  code_champion: { name: "Code Champion", description: "You created a function" }
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