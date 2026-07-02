const LESSONS = [
  {
    id: "hello_world",
    title: "1. Hello World",
    description: "Your first program",
    code: `print("Hello, World!")`,
    hint: "Use print() with your message inside quotes.",
    expected: "Hello, World!",
    badge: "first_steps",
    xp: 50,
  },
  {
    id: "variables",
    title: "2. Variables",
    description: "Store information",
    code: `name = "Alex"\nprint(name)`,
    hint: "Use = to assign a value.",
    expected: "Alex",
    badge: "variable_master",
    xp: 60,
  },
  {
    id: "math_magic",
    title: "3. Math Magic",
    description: "Python can calculate",
    code: `print(5 + 3)\nprint(10 * 4)\nprint(20 - 7)\nprint(100 / 5)`,
    hint: "Use numbers and math symbols.",
    expected: "20",
    badge: "math_wizard",
    xp: 60,
  },
  {
    id: "booleans",
    title: "9. True or False",
    description: "Logic in Python",
    code: `is_coding = True\nprint(is_coding)`,
    hint: "True and False must be capitalized.",
    expected: "True",
    badge: "logic_pro",
    xp: 100,
  },
  {
    id: "dictionaries",
    title: "10. Dictionaries",
    description: "Key-value pairs",
    code: `player = {"name": "Alex", "score": 100}\nprint(player["score"])`,
    hint: "Use curly braces {} and colons :",
    expected: "100",
    badge: "data_boss",
    xp: 110,
  }
];

const BADGES = {
  first_steps: { name: "First Steps", description: "Wrote first code" },
  variable_master: { name: "Variable Master", description: "Stored data" },
  math_wizard: { name: "Math Wizard", description: "Calculated stuff" },
  logic_pro: { name: "Logic Pro", description: "Mastered boolean logic" },
  data_boss: { name: "Data Boss", description: "Handled key-value pairs" },
  code_champion: { name: "Code Champion", description: "Completed all challenges" }
};

const DEFAULT_CODE = `print("Welcome to CodeKids!")`;