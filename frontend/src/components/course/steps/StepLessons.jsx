import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '../../ui.jsx';

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function StepLessons({ modules, setModules }) {
  const addLesson = (moduleTempId) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.tempId !== moduleTempId) return m;
        const nextIndex = (m.lessons || []).length + 1;
        return {
          ...m,
          lessons: [
            ...(m.lessons || []),
            {
              tempId: newId(),
              title: `Lesson ${nextIndex}`,
              videoUrl: '',
            },
          ],
        };
      })
    );
  };

  const removeLesson = (moduleTempId, lessonTempId) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.tempId !== moduleTempId) return m;
        return { ...m, lessons: (m.lessons || []).filter((l) => l.tempId !== lessonTempId) };
      })
    );
  };

  const updateLesson = (moduleTempId, lessonTempId, patch) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.tempId !== moduleTempId) return m;
        return {
          ...m,
          lessons: (m.lessons || []).map((l) => (l.tempId === lessonTempId ? { ...l, ...patch } : l)),
        };
      })
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Lessons & videos</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Add lessons for each module and attach a video URL.
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((m, moduleIdx) => (
          <Card key={m.tempId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Module {moduleIdx + 1}: {m.title || 'Untitled'}
                </div>
                {m.description ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.description}</div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => addLesson(m.tempId)}
                icon={<Plus size={18} strokeWidth={2} />}
              >
                Add lesson
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {(m.lessons || []).length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No lessons yet. Add at least one lesson.
                </div>
              ) : (
                (m.lessons || []).map((l, lessonIdx) => (
                  <div
                    key={l.tempId}
                    className="rounded-md border border-gray-200 dark:border-gray-800 p-3"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Lesson {lessonIdx + 1}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeLesson(m.tempId, l.tempId)}
                        icon={<Trash2 size={18} strokeWidth={2} />}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Lesson title"
                        value={l.title}
                        onChange={(e) => updateLesson(m.tempId, l.tempId, { title: e.target.value })}
                        placeholder="Lesson title"
                      />
                      <Input
                        label="Video URL"
                        value={l.videoUrl}
                        onChange={(e) => updateLesson(m.tempId, l.tempId, { videoUrl: e.target.value })}
                        placeholder="YouTube or Google Drive link"
                      />
                    </div>

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Video URL is optional. If provided, supported: YouTube and Google Drive links.
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
