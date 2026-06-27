"""Pre-made project templates kids can start from"""

CALCULATOR = """# Simple Calculator
# Let's do some math!

def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        return "Can't divide by zero!"
    return a / b

# Try it out!
print("=" * 25)
print("  CodeKids Calculator")
print("=" * 25)
print()
print("5 + 3 =", add(5, 3))
print("10 - 4 =", subtract(10, 4))
print("6 x 7 =", multiply(6, 7))
print("20 / 4 =", divide(20, 4))
print("7 / 0 =", divide(7, 0))

print()
print("Try changing the numbers and run again!")
"""

SNAKE_GAME = """# Snake Game
# Use arrow keys to move!
# Eat the red food to grow. Don't hit walls or yourself!

import turtle
import time
import random

screen = turtle.Screen()
screen.title("Snake Game - CodeKids")
screen.bgcolor("black")
screen.setup(width=600, height=600)
screen.tracer(0)

head = turtle.Turtle()
head.speed(0)
head.shape("square")
head.color("green")
head.penup()
head.goto(0, 0)
head.direction = "stop"

food = turtle.Turtle()
food.speed(0)
food.shape("circle")
food.color("red")
food.penup()
food.goto(0, 100)

segments = []
score = 0

pen = turtle.Turtle()
pen.speed(0)
pen.color("white")
pen.penup()
pen.hideturtle()
pen.goto(0, 260)
pen.write("Score: 0", align="center", font=("Courier", 24, "normal"))


def go_up():
    if head.direction != "down":
        head.direction = "up"

def go_down():
    if head.direction != "up":
        head.direction = "down"

def go_left():
    if head.direction != "right":
        head.direction = "left"

def go_right():
    if head.direction != "left":
        head.direction = "right"

def move():
    if head.direction == "up":
        head.sety(head.ycor() + 20)
    if head.direction == "down":
        head.sety(head.ycor() - 20)
    if head.direction == "left":
        head.setx(head.xcor() - 20)
    if head.direction == "right":
        head.setx(head.xcor() + 20)


screen.listen()
screen.onkey(go_up, "Up")
screen.onkey(go_down, "Down")
screen.onkey(go_left, "Left")
screen.onkey(go_right, "Right")

# Main game loop - press the Run button to start!
try:
    while True:
        screen.update()
        time.sleep(0.1)

        # wall collision
        if (head.xcor() > 290 or head.xcor() < -290 or
                head.ycor() > 290 or head.ycor() < -290):
            time.sleep(1)
            head.goto(0, 0)
            head.direction = "stop"
            for seg in segments:
                seg.goto(1000, 1000)
            segments.clear()
            score = 0
            pen.clear()
            pen.write("Score: 0", align="center", font=("Courier", 24, "normal"))

        # food collision
        if head.distance(food) < 20:
            x = random.randint(-270, 270)
            y = random.randint(-270, 270)
            food.goto(x, y)

            new_seg = turtle.Turtle()
            new_seg.speed(0)
            new_seg.shape("square")
            new_seg.color("lightgreen")
            new_seg.penup()
            segments.append(new_seg)

            score += 10
            pen.clear()
            pen.write(f"Score: {score}", align="center", font=("Courier", 24, "normal"))

        # move segments
        for i in range(len(segments) - 1, 0, -1):
            x = segments[i - 1].xcor()
            y = segments[i - 1].ycor()
            segments[i].goto(x, y)

        if segments:
            segments[0].goto(head.xcor(), head.ycor())

        move()

        # self collision
        for seg in segments:
            if seg.distance(head) < 20:
                time.sleep(1)
                head.goto(0, 0)
                head.direction = "stop"
                for s in segments:
                    s.goto(1000, 1000)
                segments.clear()
                score = 0
                pen.clear()
                pen.write("Score: 0", align="center", font=("Courier", 24, "normal"))
except:
    pass

screen.bye()
"""

QUIZ_GAME = """# Quiz Game
# Test your knowledge!

score = 0

print("Welcome to the Animal Quiz!")
print()

# Question 1
# Note: The IDE doesn't support input() well, so we pretend the user answered "lion"
answer1 = "lion" 

if answer1 == "lion":
    print("Correct! The lion is the king of the jungle.")
    score += 1
else:
    print("Wrong! The answer was lion.")

print()
print(f"Your final score is {score}/1")
"""

TEMPLATES = {
    "Calculator": CALCULATOR,
    "Snake_Game": SNAKE_GAME,
    "Quiz_Game": QUIZ_GAME
}