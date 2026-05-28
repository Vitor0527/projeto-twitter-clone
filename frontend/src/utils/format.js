export function formatDateTime(value) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatRelativeTime(value) {
  const date = new Date(value);
  const diffSeconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) return 'Agora';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} d`;

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function compactNumber(value) {
  return new Intl.NumberFormat('pt-PT', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function plural(value, singular, pluralLabel) {
  return `${value} ${value === 1 ? singular : pluralLabel}`;
}
