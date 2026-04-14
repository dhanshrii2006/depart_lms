import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, Input, Textarea } from '../../ui.jsx';

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function StepModules({ modules, setModules }) {
  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        tempId: newId(),
        title: `Module ${prev.length + 1}`,
        description: '',
        lessons: [
          {
            tempId: newId(),
            title: 'Lesson 1',
            videoUrl: '',
          },
        ],
      },
    ]);
  };

  const removeModule = (tempId) => {
    setModules((prev) => prev.filter((m) => m.tempId !== tempId));
  };

  const updateModule = (tempId, patch) => {
    setModules((prev) =>
      prev.map((m) => (m.tempId === tempId ? { ...m, ...patch } : m))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Modules</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Add modules, then add lessons in the next step.</div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={addModule}
          icon={<Plus size={18} strokeWidth={2} />}
        >
          Add module
        </Button>
      </div>

      <div className="space-y-3">
        {modules.map((m, idx) => (
          <Card key={m.tempId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Module {idx + 1}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeModule(m.tempId)}
                disabled={modules.length === 1}
                icon={<Trash2 size={18} strokeWidth={2} />}
              >
                Remove
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title"
                value={m.title}
                onChange={(e) => updateModule(m.tempId, { title: e.target.value })}
                placeholder="Module title"
              />
              <Textarea
                label="Description"
                value={m.description || ''}
                onChange={(e) => updateModule(m.tempId, { description: e.target.value })}
                placeholder="Optional"
                rows={2}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Tip: Keep module titles short and action-oriented.
      </div>
    </div>
  );
}
