import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { Modal, Button } from '../ui.jsx';
import { coursesAPI, modulesAPI, lessonsAPI } from '../../api/client.js';

import StepCourseInfo from './steps/StepCourseInfo.jsx';
import StepCourseDetails from './steps/StepCourseDetails.jsx';
import StepModules from './steps/StepModules.jsx';
import StepLessons from './steps/StepLessons.jsx';
import StepReviewPublish from './steps/StepReviewPublish.jsx';

const COLORS = ['#4F46E5', '#06B6D4', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  section: z.string().optional().default(''),
  subject: z.string().optional().default(''),
  category: z.string().optional().default(''),
  description: z.string().optional().default(''),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Beginner'),
  duration: z
    .preprocess((v) => {
      if (v === '' || v == null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }, z.number().min(0.5, 'Duration must be at least 0.5 hours').optional()),
  maxStudents: z
    .preprocess((v) => {
      if (v === '' || v == null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }, z.number().int('Max students must be a whole number').min(1, 'Max students must be at least 1').optional()),
  outcomes: z.array(z.string().min(1, 'Outcome cannot be empty')).max(8, 'Up to 8 outcomes'),
  status: z.enum(['draft', 'published']).optional().default('published'),
  coverColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color').optional().default('#4F46E5'),
});

const STEPS = [
  { key: 'info', title: 'Course info' },
  { key: 'details', title: 'Details' },
  { key: 'modules', title: 'Modules' },
  { key: 'lessons', title: 'Lessons & videos' },
  { key: 'publish', title: 'Publish' },
];

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const clone = (value) => {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
};

export default function CreateCourseModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [stepIndex, setStepIndex] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [successCourseId, setSuccessCourseId] = useState(null);
  const [builderError, setBuilderError] = useState('');

  const [modules, setModules] = useState(() => [
    {
      tempId: newId(),
      title: 'Module 1',
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

  const {
    register,
    reset,
    trigger,
    getValues,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      section: '',
      subject: '',
      category: '',
      description: '',
      difficulty: 'Beginner',
      duration: '',
      maxStudents: '',
      outcomes: [],
      status: 'published',
      coverColor: '#4F46E5',
    },
    mode: 'onTouched',
  });

  const coverColor = watch('coverColor');

  const stepFields = useMemo(() => {
    return {
      info: ['title', 'section', 'subject', 'category', 'description', 'coverColor'],
      details: ['difficulty', 'duration', 'maxStudents', 'outcomes'],
      modules: [],
      lessons: [],
      publish: ['status'],
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
    setPublishing(false);
    setSuccessCourseId(null);
    setBuilderError('');
    reset({
      title: '',
      section: '',
      subject: '',
      category: '',
      description: '',
      difficulty: 'Beginner',
      duration: '',
      maxStudents: '',
      outcomes: [],
      status: 'published',
      coverColor: '#4F46E5',
    });
    setModules([
      {
        tempId: newId(),
        title: 'Module 1',
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
  }, [isOpen, reset]);

  const validateBuilder = () => {
    const errs = [];

    if (!modules.length) {
      errs.push('Add at least one module.');
    }

    modules.forEach((m, i) => {
      if (!m.title?.trim()) {
        errs.push(`Module ${i + 1} title is required.`);
      }

      if (!m.lessons?.length) {
        errs.push(`Add at least one lesson in “${m.title || `Module ${i + 1}` }”.`);
        return;
      }

      m.lessons.forEach((l, j) => {
        if (!l.title?.trim()) {
          errs.push(`Lesson ${j + 1} title is required in “${m.title || `Module ${i + 1}` }”.`);
        }
      });
    });

    setBuilderError(errs[0] || '');
    return errs.length === 0;
  };

  const goNext = async () => {
    setBuilderError('');
    const stepKey = STEPS[stepIndex].key;

    if (stepKey === 'modules' || stepKey === 'lessons') {
      if (!validateBuilder()) return;
      setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
      return;
    }

    const ok = await trigger(stepFields[stepKey] || []);
    if (!ok) return;

    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setBuilderError('');
    setStepIndex((s) => Math.max(s - 1, 0));
  };

  const publishCourse = async () => {
    setBuilderError('');

    const stepOk = await trigger(['status']);
    if (!stepOk) return;

    if (!validateBuilder()) return;

    setPublishing(true);

    try {
      const values = getValues();

      const normalizeOptionalNumber = (v) => {
        if (v === '' || v == null) return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const duration = normalizeOptionalNumber(values.duration);
      const maxStudents = normalizeOptionalNumber(values.maxStudents);
      const payload = {
        title: values.title,
        section: values.section,
        subject: values.subject,
        category: values.category,
        description: values.description,
        difficulty: values.difficulty,
        duration,
        maxStudents,
        outcomes: values.outcomes,
        status: values.status,
        coverColor: values.coverColor,
      };

      const { data: createdCourse } = await coursesAPI.create(payload);

      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
        const mod = modules[moduleIndex];

        const { data: createdModule } = await coursesAPI.createModule(createdCourse.id, {
          title: mod.title,
          description: mod.description || '',
          orderIndex: moduleIndex,
        });

        for (let lessonIndex = 0; lessonIndex < (mod.lessons || []).length; lessonIndex += 1) {
          const lesson = mod.lessons[lessonIndex];

          const { data: createdLesson } = await modulesAPI.createLesson(createdModule.id, {
            title: lesson.title,
            orderIndex: lessonIndex,
          });

          if (lesson.videoUrl?.trim()) {
            await lessonsAPI.attachVideo(createdLesson.id, {
              originalUrl: lesson.videoUrl,
              title: '',
              duration: '',
            });
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(values.status === 'draft' ? 'Course saved as draft.' : 'Course published successfully!');
      setSuccessCourseId(createdCourse.id);
    } catch (error) {
      const details = error?.response?.data?.details;
      const detailMsg = Array.isArray(details) && details.length ? details[0]?.message : '';
      const msg = detailMsg || error?.response?.data?.error || 'Failed to publish course';
      toast.error(msg);
      setBuilderError(msg);
    } finally {
      setPublishing(false);
    }
  };

  const footer = successCourseId
    ? (
        <>
          <Button
            variant="secondary"
            onClick={() => {
              onClose?.();
            }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              navigate(`/teacher/course/${successCourseId}`);
              onClose?.();
            }}
          >
            Go to course
          </Button>
        </>
      )
    : (
        <>
          <Button variant="secondary" onClick={stepIndex === 0 ? onClose : goBack} disabled={publishing}>
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button variant="primary" onClick={goNext} disabled={publishing}>
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={publishCourse} isLoading={publishing} disabled={publishing}>
              {watch('status') === 'draft' ? 'Save draft' : 'Publish'}
            </Button>
          )}
        </>
      );

  const stepKey = STEPS[stepIndex]?.key;

  return (
    <Modal
      isOpen={isOpen}
      onClose={publishing ? undefined : onClose}
      title={successCourseId ? 'All set' : 'Create course'}
      size="xl"
      position="topLeft"
      closeOnBackdropClick={!publishing}
      footer={footer}
    >
      {!successCourseId && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex].title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(((stepIndex + 1) / STEPS.length) * 100)}%
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <div
              className="h-full bg-accent-600 dark:bg-accent-500 transition-all"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {STEPS.map((s, idx) => {
              const active = idx === stepIndex;
              const done = idx < stepIndex;

              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={publishing}
                  onClick={async () => {
                    if (idx === stepIndex) return;
                    if (idx < stepIndex) {
                      setBuilderError('');
                      setStepIndex(idx);
                      return;
                    }

                    // Forward navigation: validate current step first
                    if (stepKey === 'modules' || stepKey === 'lessons') {
                      if (!validateBuilder()) return;
                      setStepIndex(idx);
                      return;
                    }

                    const ok = await trigger(stepFields[stepKey] || []);
                    if (!ok) return;
                    setStepIndex(idx);
                  }}
                  className="flex flex-col items-center gap-2 text-left"
                >
                  <div
                    className={
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ' +
                      (active
                        ? 'bg-accent-600 border-accent-600 text-white'
                        : done
                          ? 'bg-accent-50 border-accent-200 text-accent-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100'
                          : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300')
                    }
                  >
                    {idx + 1}
                  </div>
                  <div className={
                    'text-[11px] leading-tight ' +
                    (active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400')
                  }>
                    {s.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(builderError || Object.keys(errors || {}).length > 0) && !successCourseId && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {builderError || 'Please fix the errors in this step.'}
        </div>
      )}

      {successCourseId ? (
        <div className="py-8">
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Course created successfully
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your course is ready. You can start adding more content anytime.
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {stepKey === 'info' && (
              <StepCourseInfo
                register={register}
                errors={errors}
                colors={COLORS}
                selectedColor={coverColor}
                onSelectColor={(c) => setValue('coverColor', c, { shouldDirty: true, shouldTouch: true })}
              />
            )}

            {stepKey === 'details' && (
              <StepCourseDetails
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            )}

            {stepKey === 'modules' && (
              <StepModules
                modules={modules}
                setModules={(next) => {
                  setModules((prev) => (typeof next === 'function' ? next(prev) : next));
                }}
              />
            )}

            {stepKey === 'lessons' && (
              <StepLessons
                modules={modules}
                setModules={(next) => {
                  setModules((prev) => (typeof next === 'function' ? next(prev) : next));
                }}
              />
            )}

            {stepKey === 'publish' && (
              <StepReviewPublish
                register={register}
                errors={errors}
                courseValues={getValues()}
                modules={clone(modules)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </Modal>
  );
}
