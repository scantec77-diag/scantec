# Scantec — Acceso y planes (decisiones 2026-10-20)

## Alcance aprobado
- Registro abierto: cualquier persona con cuenta de Google o dirección de correo electrónico.
- Google: inicio de sesión mediante proveedor Google. Otro correo: correo y contraseña o enlace de acceso verificado; no confundir correo arbitrario con inicio de sesión Google.
- Al abrir la app: solicitar autenticación local mediante biometría **o credencial del dispositivo** cuando esté disponible. En dispositivos sin biometría, permitir credencial segura del dispositivo; si no existe, ofrecer acceso seguro mediante sesión y credenciales, sin prometer un bloqueo nativo inexistente.
- Para abrir **Mi Taller Privado**: nueva autenticación local, independiente del desbloqueo inicial.
- Cada cuenta tiene sus propios diagnósticos, fotos, notas y reparaciones. No se mezclan datos entre cuentas ni con el catálogo público.
- Administrador: permisos editoriales sobre la biblioteca técnica, nunca acceso implícito a los baúles de otros usuarios.
- Por ahora, todas las funciones habilitadas en fase de pruebas. Scantec Pro se desarrollará después; no activar cobros ahora.

## Arquitectura y seguridad pendientes de implementación
1. Firebase Authentication: proveedores Google y email, persistencia de sesión y manejo de cierre de sesión.
2. Base de datos privada: datos bajo `users/{uid}/...`; reglas que exijan `request.auth.uid == uid`. Aplicar reglas equivalentes al almacenamiento de fotos y archivos. Probar accesos cruzados.
3. Android: app nativa o contenedor Android con BiometricPrompt y opción DEVICE_CREDENTIAL según API y hardware. Requerir autenticación al iniciar y al entrar a Mi Taller Privado; definir protección en segundo plano y tiempo de revalidación. La web/PWA por sí sola no garantiza bloqueo nativo de inicio.
4. Cifrado de datos sensibles en reposo, gestión segura de sesiones, borrado de datos al cerrar sesión en dispositivos compartidos, copias privadas y política de recuperación.
5. Conservar identificador de paquete, verificar firma de APK original y clave de firma antes de prometer actualización in-place. Nunca subir keystores, contraseñas ni datos personales a GitHub público.
6. Preparar roles `admin` / `user` y capacidad futura `free` / `pro`, validada en backend, sin restricciones de pago activas ahora. Una suscripción no permite ver datos ajenos.
7. Publicar documentación con derechos/licencias apropiados; no asumir permiso para redistribuir manuales de terceros.

## Criterios de aceptación
- Usuario A y B pueden iniciar sesión por separado y cada uno ve solo sus fichas.
- El acceso al baúl de A con credenciales de B se deniega también a nivel de servidor.
- Reapertura de app y entrada al baúl solicitan autenticación según capacidades del teléfono.
- Usuario sin huella puede utilizar credencial compatible.
- Cuenta administradora puede gestionar biblioteca compartida sin leer talleres privados.
- Ningún pago ni suscripción se exige durante esta fase.

Estado: **especificación guardada, NO implementada aún**.
