#!/usr/bin/env python
import re

file_path = r'e:\copymicro\acadify-final\backend\public\course-creation.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the old addLesson function reference with addLessonTitle
if 'function addLesson()' in content:
    content = content.replace('function addLesson()', 'function addLessonTitle()')

# Replace onclick handlers
content = content.replace('onclick="addLesson()"', 'onclick="addLessonTitle()"')

# Add new functions before saveCourse
old_save = 'function saveCourse() {'
new_functions = '''function switchVideoSource(source) {
      currentVideoSource = source;
      document.getElementById('youtubeSection').style.display = source === 'youtube' ? 'block' : 'none';
      document.getElementById('driveSection').style.display = source === 'drive' ? 'block' : 'none';
    }

    function extractYoutubeId(url) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
      ];
      for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    function extractDriveId(url) {
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)\//,
        /^([a-zA-Z0-9_-]+)$/
      ];
      for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    function addVideoToLesson(source) {
      const lessonSelect = document.getElementById('lessonVideoSelect');
      const selectedLessonIdx = lessonSelect.value;
      
      if (!selectedLessonIdx) {
        alert('Please select a lesson');
        return;
      }

      let videoId = '';
      let videoUrl = '';
      let videoName = '';

      if (source === 'youtube') {
        videoUrl = document.getElementById('youtubeUrl').value.trim();
        videoId = extractYoutubeId(videoUrl);
        if (!videoId) {
          alert('Invalid YouTube URL or Video ID');
          return;
        }
        videoName = 'YouTube Video';
        videoUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (source === 'drive') {
        videoUrl = document.getElementById('driveUrl').value.trim();
        videoId = extractDriveId(videoUrl);
        if (!videoId) {
          alert('Invalid Google Drive URL or File ID');
          return;
        }
        videoName = 'Google Drive Video';
        videoUrl = `https://drive.google.com/file/d/${videoId}/preview`;
      }

      const videoKey = `${currentEditingModuleIndex}-${selectedLessonIdx}`;
      lessonVideos[videoKey] = {
        id: videoId,
        url: videoUrl,
        name: videoName,
        source: source,
        addedAt: new Date().toLocaleString()
      };

      document.getElementById('youtubeUrl').value = '';
      document.getElementById('driveUrl').value = '';
      
      renderLessons(currentEditingModuleIndex);
      renderUploadedVideos();
      showSuccess(`${videoName} added successfully!`);
    }

    '''

content = content.replace('function saveCourse() {', new_functions + 'function saveCourse() {')

# Add currentVideoSource to globals
if "let currentVideoSource = 'youtube'" not in content:
    content = content.replace(
        "let lessonVideos = {}; // Store lesson videos",
        "let lessonVideos = {}; // Store lesson videos\n    let currentVideoSource = 'youtube'; // Track selected source"
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Course creation updated with YouTube + Google Drive support")
