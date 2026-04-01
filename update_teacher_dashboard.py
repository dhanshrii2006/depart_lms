#!/usr/bin/env python
import re

file_path = r'e:\copymicro\acadify-final\backend\public\teacher-dashboard.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Course Catalog with Create Course link
content = re.sub(
    r'<li><a href="my-courses\.html"><i class="fas fa-folder-open\s+mr-2"></i> Course Catalog</a></li>',
    '<li><a href="course-creation.html"><i class="fas fa-plus-circle mr-2"></i> Create Course</a></li>\n          <li><a href="my-courses.html"><i class="fas fa-folder-open mr-2"></i> My Courses</a></li>',
    content
)

# Remove Live Cohorts section
content = re.sub(
    r'<div class="card">\s*<h3 class="mb-3">Live Cohorts</h3>.*?</div>\s*</div>\s*</main>',
    '</div>\n    </main>',
    content,
    flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Teacher dashboard updated - Course Catalog link changed to Create Course")
print("✓ Live Cohorts section removed")
