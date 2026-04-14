import { Card, Select } from '../../ui.jsx';

export default function StepReviewPublish({ register, errors, courseValues, modules }) {
  const moduleCount = modules?.length || 0;
  const lessonCount = (modules || []).reduce((acc, m) => acc + ((m.lessons || []).length || 0), 0);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Review</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Title</div>
            <div className="text-gray-900 dark:text-gray-100 font-medium">{courseValues.title || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Section</div>
            <div className="text-gray-900 dark:text-gray-100 font-medium">{courseValues.section || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Subject</div>
            <div className="text-gray-900 dark:text-gray-100 font-medium">{courseValues.subject || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Difficulty</div>
            <div className="text-gray-900 dark:text-gray-100 font-medium">{courseValues.difficulty || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Modules</div>
            <div className="text-gray-900 dark:text-gray-100 font-medium">{moduleCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Lessons</div>
            <div className="text-gray-900 dark:text-gray-100 font-medium">{lessonCount}</div>
          </div>
        </div>

        {courseValues.outcomes?.length ? (
          <div className="mt-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Outcomes</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 dark:text-gray-200">
              {courseValues.outcomes.map((o, idx) => (
                <li key={`${o}-${idx}`}>{o}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card className="p-4">
        <Select
          label="Publish status"
          options={[
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
          {...register('status')}
          error={errors.status?.message}
        />
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Draft courses can be edited before publishing.
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Content outline</div>
        <div className="space-y-3">
          {(modules || []).map((m, i) => (
            <div key={m.tempId} className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Module {i + 1}: {m.title || 'Untitled'}</div>
              {(m.lessons || []).length ? (
                <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {m.lessons.map((l) => (
                    <li key={l.tempId}>
                      {l.title || 'Untitled lesson'}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">No lessons</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
