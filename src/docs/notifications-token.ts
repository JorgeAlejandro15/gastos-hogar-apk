// File: src/docs/notifications-token.ts
// Nota técnica (sin secrets) sobre por qué existe el "registro de token".

/**
 * ¿Para qué sirve registrar el token?
 *
 * - Un Push Token (Expo) identifica de forma única una instalación/dispositivo.
 * - El backend lo necesita para saber **a qué dispositivos** enviar una notificación.
 * - Sin registrar tokens, el backend no tiene una forma de enviar push a otros miembros del hogar.
 *
 * ¿Es necesario dejarlo o puedo eliminarlo?
 *
 * - Si SOLO quieres notificaciones locales (scheduleNotificationAsync), puedes eliminar el registro de token.
 *   Eso NO rompe la notificación local, porque se genera y se muestra en el mismo dispositivo.
 *
 * - Si quieres notificaciones push reales (usuario A hace algo y usuario B lo recibe),
 *   entonces SÍ es necesario mantener el registro de token (o un mecanismo equivalente).
 *   Sin tokens, el backend no puede hacer push a B.
 *
 * Alternativas válidas al registro de token (equivalentes):
 * - Guardar tokens en un "perfil de dispositivo" del usuario (misma idea, distinto nombre).
 * - Usar FCM/APNs directamente (sin Expo) y registrar tokens FCM/APNs.
 * - Usar OneSignal/Firestore/etc. (externo), pero igualmente registrarías algún identificador.
 */
export const notificationsTokenNotes = true;
