"""CodeKids IDE - A fun Python IDE for kids aged 8-14"""
import sys
import os

# so relative imports work no matter where you run from
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import CodeKidsApp


if __name__ == "__main__":
    app = CodeKidsApp()
    app.run()