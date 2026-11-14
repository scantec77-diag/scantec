# Mis Gigas 0.25

Corrige la lectura de la tarjeta de inicio de Mi Claro que presenta únicamente «Internet disponible 16.63GB». El lector anterior exigía saldo restante y total explícitos dentro de la misma tarjeta, por lo que mantenía un saldo antiguo.

Para este formato concreto se lee el saldo disponible y se conserva como denominador el total configurado por el usuario. No se infiere el total desde el disponible, no se cambia el plan y no se acepta un saldo superior al total configurado. Se admiten coma o punto decimal. Se mantienen la verificación de línea, dominio oficial y rechazo de ofertas, consumidos y múltiples saldos diferentes. La misma lectura se utiliza en la consulta manual y en segundo plano.

Validación: 29 pruebas del lector, incluyendo el formato de la captura (16.63GB y total configurado de 16.8), cero, coma decimal, falta de total, saldo excesivo, línea desconocida, texto de factura y duplicados/conflictos de tarjetas. Pruebas de planificación de consultas aprobadas. Compilación completa API 35, versión 0.25 (code 25), paquete ar.ari.gigas y firma contrastada con 0.24. Falta validar contra el DOM real y la sesión del teléfono; la captura permite reproducir el texto, no ejecutar el portal autenticado.

Después de instalar, abrir Mi Claro desde Mis Gigas y tocar Consultar para renovar el valor almacenado. No se carga un saldo fijo desde la captura. Se conserva la limpieza del tablero de 0.24 y la escala de potencia 0–45 W.

APK y manifiesto publicados juntos en misgigas-updates. Fuentes excluyen clave privada y carpetas de compilación.
