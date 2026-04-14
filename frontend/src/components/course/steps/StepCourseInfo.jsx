import { Card, Input, Textarea } from '../../ui.jsx';

export default function StepCourseInfo({ register, errors, colors, selectedColor, onSelectColor }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Course title"
          placeholder="e.g., Web Development"
          {...register('title')}
          error={errors.title?.message}
        />
        <Input
          label="Section"
          placeholder="e.g., A"
          {...register('section')}
          error={errors.section?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Subject"
          placeholder="e.g., Computer Science"
          {...register('subject')}
          error={errors.subject?.message}
        />
        <Input
          label="Category"
          placeholder="Optional"
          {...register('category')}
          error={errors.category?.message}
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Describe your course..."
        rows={4}
        {...register('description')}
        error={errors.description?.message}
      />

      <Card className="p-4">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Cover color</div>
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              className={
                'w-full h-10 rounded-md transition-all border ' +
                (selectedColor === color
                  ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-950 border-transparent'
                  : 'border-gray-200 dark:border-gray-800')
              }
              style={{ backgroundColor: color }}
              aria-label={`Select ${color}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
