# codeKidsIDE

CodeKids IDE
A simple Python IDE built for kids aged 8 to 14. I made this because standard IDEs like PyCharm or VS Code are way too cluttered for a beginner. The goal was to make something colorful, easy to understand, and forgiving when you make a mistake.

Features
Custom interface built with CustomTkinter.
Python syntax highlighting and line numbers.
Beginner Mode: Translates scary Python errors into simple hints (like telling you that you forgot a colon).
Built-in lessons tab with small exercises to teach the basics.
Achievement system with badges to keep kids motivated.
Project templates included (Calculator, Snake Game, Quiz Game).
File explorer to open and save your projects.
Search and replace functionality.
Autosave every 30 seconds so you don't lose your work.
Dark and light mode toggle.
Requirements
Python 3.8 or higher
customtkinter

You can install the dependency using pip:
pip install customtkinter

      
How to run
Just execute the main file:

bash

python main.py
Project Structure
main.py - Entry point.
app.py - Sets up the main window and loads settings.
ui/ - All the visual components (editor, file explorer, toolbar, panels).
core/ - Background logic (code runner, syntax highlighter, error helper, lessons data).
utils/ - Settings and progress storage managers.
templates/ - Pre-written code for the templates menu.
Known Issues
The input() function doesn't work in the console because the code runs in a background thread. The lessons and templates are designed to avoid needing user input for now.
The syntax highlighter uses regex, so it might get a bit slow if you paste a massive 1000-line file into it. It's meant for small beginner scripts.



# MIT License

Copyright (c) 2026 Na1os

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
