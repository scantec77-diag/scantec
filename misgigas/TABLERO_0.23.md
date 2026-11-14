# Mis Gigas 0.23

El indicador junto al porcentaje de batería muestra POTENCIA DE CARGA en lugar del semicírculo de salud, tanto en la app como en el widget Mi Tablero. El arco conserva el gradiente rojo, naranja, amarillo y verde y usa una escala fija 0–45 W. 22,5 W ocupa la mitad del arco y 45 W lo completa. Si una lectura supera el máximo, el arco se satura pero el número conserva el valor recibido.

La lectura representa potencia neta estimada en batería: corriente instantánea en µA multiplicada por voltaje de batería en mV y dividida por 10^9. No representa la potencia nominal ni la salida total del cargador. Desconectado: 0 W. Corriente negativa: 0 W de carga neta. Sin lectura disponible: guion y arco gris. El límite máximo reportado por Android permanece separado en los detalles.

Se conservan los botones de actualización y el aviso rojo de 0.22. Paquete ar.ari.gigas, versionCode 23, versionName 0.23. Firma v3 verificada y certificado SHA-256 idéntico al de 0.22. No desinstalar para actualizar.

Validación: compilación completa con API 35; apksigner; identidad, versión y certificado; pruebas de unidades µA/mV, 0/22,5/45 W, saturación sin truncar lectura, desconexión, descarga y valores ausentes. Pruebas previas de escalas y transiciones de cuatro colores aprobadas. Pendiente probar aspecto y lecturas en el Samsung SM-S938B de Ari; no se ejecutó en un emulador ni en el teléfono.

App: batería cada 3 s y al recibir eventos; widget mantiene la frecuencia de 0.22, no es un monitor continuo en segundo plano. El canal se consulta periódicamente (unos 15 minutos sujetos a Android) o desde Buscar actualización. Android pide confirmar la instalación.

Referencia de unidades y signo: https://developer.android.com/reference/android/os/BatteryManager#BATTERY_PROPERTY_CURRENT_NOW

La clave de firma se recuperó del respaldo privado 0.18 y se excluye del ZIP público y del repositorio. Conservar ese respaldo para nuevas versiones.
