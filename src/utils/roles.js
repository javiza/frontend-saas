// Única fuente de verdad de "qué rol va a qué área". Antes esta decisión
// (a dónde redirigir tras login, qué rutas puede ver cada quien) no
// existía en ningún lado: todos caían al mismo dashboard.
export const ADMIN_ROLES = ['ADMIN'];
export const CLIENT_ROLES = ['MANAGER', 'USER'];

export function homePathForRole(role) {
  return ADMIN_ROLES.includes(role) ? '/admin' : '/portal';
}
