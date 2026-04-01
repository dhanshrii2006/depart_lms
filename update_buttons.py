#!/usr/bin/env python
import os

file_path = r'e:\copymicro\acadify-final\backend\public\student-dashboard.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Resume Session buttons
content = content.replace(
    'class="btn btn-primary btn-block">Resume Session</button>',
    'class="btn btn-primary btn-block" onclick="window.location.href=\'lesson.html\'">Resume Session</button>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Updated Resume Session buttons to link to lesson.html")
