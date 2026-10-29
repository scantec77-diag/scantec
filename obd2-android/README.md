# Scantec OBD-II Lab (Android proof of concept)

Primera app nativa independiente para probar un adaptador ELM327 Bluetooth clásico con el tablero de Scantec.

## Funciones de esta iteración

- Lista adaptadores Bluetooth ya emparejados y permite elegir uno.
- Conecta mediante Bluetooth Classic SPP y ejecuta inicialización AT (`ATZ`, `ATE0`, `ATL0`, `ATS0`, `ATH0`, `ATSP0`).
- Consulta datos genéricos OBD-II disponibles (RPM, velocidad, ECT, carga, STFT/LTFT B1, MAP, MAF, IAT, mariposa, avance y voltaje ECU).
- Lee DTC confirmados, pendientes y permanentes cuando la ECU los responde.
- Consulta VIN, Calibration ID, CVN y nombre ECU por Mode 09 cuando están soportados.
- Integra el tablero HTML mediante una interfaz JavaScript local. La demo conserva simulación para usarla sin adaptador.

## Alcance y limitaciones

- Este prototipo no lee ni escribe el BIN/flash de la ECU. Para eso hace falta una interfaz de programación compatible con ECU, protocolo y modo de acceso.
- La primera iteración usa Bluetooth clásico SPP. Los ELM327 BLE y Wi-Fi se agregarán luego si el adaptador requiere esos transportes.
- Las lecturas que no responden se muestran como no disponibles; no se reemplazan por cero.
- No se borra ningún DTC automáticamente.
- Se recomienda probar primero con contacto puesto y motor apagado. No manipular el teléfono mientras se conduce.

## Compilación

Abrir la carpeta raíz en Android Studio (JDK 17) y compilar `app > assembleDebug`. Android Studio instalará/seleccionará el Android Gradle Plugin y SDK 35 si no están disponibles. El APK de depuración queda en `app/build/outputs/apk/debug/app-debug.apk`.

En el teléfono, emparejar primero el ELM327 desde Ajustes > Bluetooth (PIN típico 1234 o 0000; depende del adaptador), abrir Scantec OBD Lab, conceder permiso de dispositivos cercanos y elegir el adaptador.
