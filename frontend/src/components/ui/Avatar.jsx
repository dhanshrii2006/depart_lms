import clsx from 'clsx';

/**
 * Course color palette for avatar backgrounds
 * Using muted, premium SaaS-style colors
 */
const COURSE_COLORS = [
  'bg-course-1',  // Indigo
  'bg-course-2',  // Cyan
  'bg-course-3',  // Pink
  'bg-course-4',  // Amber
  'bg-course-5',  // Teal
  'bg-course-6',  // Violet
];

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorForName(name) {
  const hash = name.charCodeAt(0);
  return COURSE_COLORS[hash % COURSE_COLORS.length];
}

/**
 * Avatar component - displays user initials or image
 * Premium SaaS design with course color palette
 */
const Avatar = ({
  src,
  alt = '',
  name = 'User',
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={clsx('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-medium text-white',
        sizes[size],
        getColorForName(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};

Avatar.displayName = 'Avatar';

export default Avatar;
export { Avatar };
