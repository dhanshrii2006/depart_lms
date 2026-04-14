import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Card, Input, Select } from '../../ui.jsx';

export default function StepCourseDetails({ register, errors, watch, setValue }) {
  const outcomes = watch('outcomes') || [];
  const [nextOutcome, setNextOutcome] = useState('');

  const difficultyOptions = useMemo(
    () => [
      { value: 'Beginner', label: 'Beginner' },
      { value: 'Intermediate', label: 'Intermediate' },
      { value: 'Advanced', label: 'Advanced' },
    ],
    []
  );

  const addOutcome = () => {
    const trimmed = nextOutcome.trim();
    if (!trimmed) return;
    if (outcomes.length >= 8) return;

    setValue('outcomes', [...outcomes, trimmed], { shouldDirty: true, shouldTouch: true });
    setNextOutcome('');
  };

  const removeOutcome = (idx) => {
    const next = outcomes.filter((_, i) => i !== idx);
    setValue('outcomes', next, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Difficulty"
          options={difficultyOptions}
          {...register('difficulty')}
          error={errors.difficulty?.message}
        />
        <Input
          label="Duration (hours)"
          type="number"
          step="0.5"
          min="0"
          placeholder="e.g., 12"
          {...register('duration')}
          error={errors.duration?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Max students"
          type="number"
          min="1"
          step="1"
          placeholder="Optional"
          {...register('maxStudents')}
          error={errors.maxStudents?.message}
        />
        <div className="flex items-end">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            You can leave duration/max students blank.
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Learning outcomes</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Up to 8 outcomes</div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{outcomes.length} / 8</div>
        </div>

        <div className="flex gap-2">
          <Input
            label={null}
            placeholder="e.g., Build a full-stack app"
            value={nextOutcome}
            onChange={(e) => setNextOutcome(e.target.value)}
            error={Array.isArray(errors.outcomes) ? errors.outcomes?.[0]?.message : undefined}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addOutcome}
            disabled={!nextOutcome.trim() || outcomes.length >= 8}
            icon={<Plus size={18} strokeWidth={2} />}
          >
            Add
          </Button>
        </div>

        {errors.outcomes?.message && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.outcomes.message}</div>
        )}

        {outcomes.length > 0 && (
          <div className="mt-4 space-y-2">
            {outcomes.map((o, idx) => (
              <div
                key={`${o}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2"
              >
                <div className="text-sm text-gray-900 dark:text-gray-100">{o}</div>
                <button
                  type="button"
                  onClick={() => removeOutcome(idx)}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500"
                  aria-label="Remove outcome"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
