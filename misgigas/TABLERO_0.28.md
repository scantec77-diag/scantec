# Mis Gigas 0.28

Tablero con barras horizontales de gradiente: batería restante, potencia de carga de 0–45 W, Claro, Personal, Wi-Fi y Wi-Fi compartido. Orden: batería y carga, Claro, Personal y consumos. Cada operador conserva su saldo, total y fecha. Los consumos siguen usando una escala automática visible, sin inventar un cupo.

Potencia y tiempo hasta el 100 % comparten un bloque oculto al desconectar, sin reservar espacio. Se usa la estimación de BatteryManager; si todavía no está disponible se indica «calculando…». Con carga completa se indica ese estado. La potencia es la estimación neta en batería, no una medición del enchufe.

En la app, Canvas dibuja directamente a la resolución física del dispositivo, con antialias y texto sensible al tamaño configurado. Interpolación de 450 ms al cambiar los valores y entrada de 220 ms al conectar el cargador. No hay animaciones continuas; se respetan las animaciones desactivadas por el sistema y se detienen al salir. El widget usa barras estáticas con bitmaps a resolución de pantalla, hasta 1920 px y con límite de memoria para las seis barras. También se convierten los indicadores de los widgets individuales de los operadores.

Validación: compilación completa de Java y recursos API 35; firma v3 e identidad ar.ari.gigas conservadas respecto a 0.27. Pruebas de tiempo de carga (desconectado, completo, estimación ausente y redondeos), potencia (0/45 W, saturación, descarga y datos ausentes) y saldos independientes aprobadas. Recursos y referencias del widget revisados. No se ha probado en un Samsung físico ni en emulador; quedan por confirmar apariencia, datos reales y comportamiento del launcher en el dispositivo de Ari.
