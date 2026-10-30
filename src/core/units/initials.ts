/** Iniciales para el avatar: primeras letras de las dos primeras palabras, o dos letras del nombre. */
export function getInitials(name: string, fallback = 'U'): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const [first, second] = trimmed.split(' ');
  if (first?.[0] && second?.[0]) return (first[0] + second[0]).toUpperCase();
  return trimmed.substring(0, 2).toUpperCase();
}
