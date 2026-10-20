/* Scantec · guías de medición por familia de sensor (no reemplazan manual por ECU).
   Las referencias numéricas corresponden exclusivamente a la tecnología indicada. */
(function(){
'use strict';
const TECNICA={
  map:{
    nombre:"Sensor MAP / presión absoluta de admisión",
    funciones:["Referencia/alimentación del sensor (frecuentemente 5 V)","Masa de sensor","Señal de presión a la ECU","Algunos conjuntos suman señal IAT"],
    medidas:[
      ["Alimentación","≈ 5 V en sensores MAP analógicos de referencia 5 V","Contacto puesto; medir entre terminales verificados"],
      ["Señal","Variable con presión absoluta. Ejemplo Bosch PS-AA: 0,4–4,65 V para su rango","No aplicar estos extremos a otro MAP; consultar curva del repuesto"],
      ["Dato de escáner","kPa de presión absoluta, coherentes con presión atmosférica (contacto ON, motor parado)","Comparar con BARO y variación de vacío al arrancar"]
    ],
    pasos:["Leer datos congelados y comparar MAP con BARO con motor parado.","Identificar referencia, retorno y señal en el plano exacto; revisar alimentación y masa bajo carga.","Observar en escáner la variación de kPa al arrancar y acelerar; buscar fugas de vacío, obstrucciones o manguitos deteriorados.","Si la señal es anómala, revisar continuidad y cortos del ramal antes de condenar el sensor."],
    precaucion:"Un MAP turbo, digital o con IAT integrado puede tener distinta alimentación, escala y cantidad de terminales.",
    fuente:["Bosch Motorsport · PS-AA","https://www.bosch-motorsport.com/products/sensors/air-pressure/pressure-sensor-air-ps-aa/"]
  },
  maf:{
    nombre:"Medidor de masa de aire (MAF)",
    funciones:["Alimentación (puede ser tensión de batería o 5 V, según diseño)","Masa o retorno","Señal MAF (analógica, frecuencia o digital según equipo)","Puede incorporar IAT"],
    medidas:[
      ["Alimentación","No existe tensión universal","Verificar pinado y tensión nominal del MAF instalado"],
      ["Dato de escáner","g/s o unidad propia del fabricante; aumenta al aumentar el flujo real","Relacionar con cilindrada, rpm, carga y condiciones"],
      ["Señal","Tensión/frecuencia según referencia del sensor","No aplicar 5 V a ciegas"]
    ],
    pasos:["Verificar filtro, mangueras, abrazaderas, entradas de aire posteriores al MAF y admisión.","Leer caudal en ralentí y durante una aceleración gradual.","Comprobar alimentaciones, masas y conexión solo con el esquema del modelo.","Contrastar señal y datos con la curva del sensor; revisar conectores antes de reemplazar."],
    precaucion:"Nunca dar por hecho el orden ni la tensión de sus pines; algunas versiones tienen 4–6 terminales.",
    fuente:["HELLA · Medidor de masa de aire","https://www.hella.com/techworld/es/informacion-tecnica/sensores-y-actuadores/revision-del-medidor-de-la-masa-de-aire/"]
  },
  ect:{
    nombre:"Temperatura de refrigerante (ECT)",
    funciones:["Señal de temperatura a la ECU","Retorno o masa de sensor","Puede compartir carcasa con otro circuito independiente"],
    medidas:[
      ["Resistencia NTC (ejemplo orientativo)","25 °C: 2–6 kΩ; 80 °C: alrededor de 300 Ω, según fabricante","Conector del sensor desconectado; verificar curva específica"],
      ["Alimentación del circuito","Aproximadamente 5 V en numerosos circuitos ECT al desconectar el sensor","Contacto ON; configuración según ECU"],
      ["Dato de escáner","Motor completamente frío: cercano a temperatura ambiente","Comparar con IAT y temperatura real; debe aumentar sin saltos"]
    ],
    pasos:["Con motor frío, comparar ECT e IAT y comprobar coherencia con el ambiente.","Inspeccionar conector y buscar corrosión o falso contacto.","Identificar el tipo de sensor; medir su resistencia solo desconectado y comparar con la temperatura real.","Si la temperatura de motor no asciende normalmente, investigar termostato y refrigeración."],
    precaucion:"No destapar el circuito de refrigeración caliente. Los valores en ohmios no son universales.",
    fuente:["HELLA · Prueba de ECT","https://www.hella.com/techworld/us/technical/sensors-and-actuators/test-coolant-temperature-sensor/"]
  },
  iat:{
    nombre:"Temperatura de aire de admisión (IAT)",
    funciones:["Señal de temperatura de aire","Retorno/masa de sensor","Puede venir integrado al MAP o MAF"],
    medidas:[
      ["Resistencia","En un termistor NTC disminuye cuando aumenta la temperatura","Solo sensor desconectado y tras confirmar tecnología"],
      ["Dato de escáner","En frío, IAT similar a temperatura ambiente; puede subir por calor acumulado","Comparar con medición real y ECT tras estacionamiento prolongado"],
      ["Alimentación","En muchos sistemas NTC hay polarización desde la ECU","Valor exacto según circuito y ECU"]
    ],
    pasos:["Comparar IAT con temperatura ambiente con motor frío.","Comprobar conector, humedad, cables y posibles contaminaciones.","Si es NTC y está aislado del circuito, comprobar que la resistencia cambie de forma suave con temperatura.","En conjuntos MAP/IAT y MAF/IAT, separar la prueba de cada elemento según el plano."],
    precaucion:"No asumir que IAT tiene conector o pines separados.",
    fuente:["HELLA · Fundamento de sensores NTC","https://www.hella.com/techworld/us/technical/sensors-and-actuators/test-coolant-temperature-sensor/"]
  },
  tps:{
    nombre:"Posición de mariposa / pedal (TPS/APP)",
    funciones:["Referencia de tensión (habitualmente 5 V en pistas analógicas)","Masa/retorno de sensor","Señal A","Señal B complementaria o independiente, si existe"],
    medidas:[
      ["Referencia","En sistemas analógicos: alrededor de 5 V","Debe validarse circuito específico"],
      ["Señales","Deben variar progresivamente durante apertura; algunas pistas varían inversamente","No usar límites ni pendientes de otra ECU"],
      ["Datos de escáner","Ángulo de mariposa o posición de pedal (canales A/B)","Buscar saltos, desajustes o incoherencia entre canales"]
    ],
    pasos:["Leer por separado TPS, APP y los dos canales si los hay; identificar cuál menciona el DTC.","Con contacto y sin arrancar, observar evolución suave durante movimiento lento.","Verificar referencia y masa con plano antes de medir señales con osciloscopio o voltímetro de alta impedancia.","Comprobar estado de ficha, articulación y adaptación/calibración según procedimiento de fabricante."],
    precaucion:"Mariposa electrónica y pedal pueden usar sensores redundantes con escalas distintas; no aplicar corriente externa ni forzar motor de mariposa.",
    fuente:["HELLA · Recursos técnicos de sensores","https://www.hella.com/techworld/es/informacion-tecnica/sensores-y-actuadores/"]
  },
  oxygen:{
    nombre:"Sonda lambda / oxígeno",
    funciones:["Señal de medición","Referencia/retorno de señal, según sonda","Alimentación de calefactor (si equipa)","Control/retorno del calefactor"],
    medidas:[
      ["Sonda convencional de zirconia","Con motor caliente y control activo: suele oscilar aprox. 0,1–0,9 V","SOLO sondas estrechas de zirconia; no aplica a banda ancha"],
      ["Calefactor","Comprobar alimentación, comando y resistencia según pieza","Medir resistencia solo con sonda desconectada"],
      ["Banda ancha / AFR","No corresponde comparar con 0,1–0,9 V","Usar lectura de lambda/corriente y procedimiento específico"]
    ],
    pasos:["Confirmar banco/sensor 1 o 2 y si la sonda es estrecha, titanio o banda ancha.","Calentar hasta condiciones de lazo cerrado y revisar live data (lambda y correcciones).","Si el DTC es de calefactor, comprobar circuito de alimentación/comando por separado.","Antes de reemplazar, descartar fugas de escape, tomas de aire, presión de combustible y mezcla realmente incorrecta."],
    precaucion:"Escape muy caliente. Colores de cables y pines cambian según sonda. Nunca usar prueba de 0,1–0,9 V en AFR/banda ancha.",
    fuente:["HELLA · Diagnóstico de sonda lambda","https://www.hella.com/techworld/us/technical/sensors-and-actuators/test-lambda-sensor/"]
  },
  ckp:{
    nombre:"Posición de cigüeñal (CKP)",
    funciones:["Sensor inductivo: dos extremos de bobina, con posible blindaje","Sensor Hall/activo: alimentación, retorno y señal, según modelo"],
    medidas:[
      ["Inductivo","Señal alterna variable con giro; forma de onda sinusoidal, según rueda fónica","Osciloscopio durante arranque; comparación con referencia"],
      ["Hall/activo","Señal de pulsos; onda rectangular en sistemas Hall","Osciloscopio y medición de alimentación según plano"],
      ["Resistencia","No medir hasta identificar inequívocamente tecnología","El ohmímetro puede dañar un Hall"]
    ],
    pasos:["Comprobar si la ECU registra rpm durante el arranque.","Revisar captor, distancia a rueda fónica, limaduras, fichas y cable blindado.","Identificar con seguridad si es inductivo o Hall; no determinarlo solo por cantidad de pines.","Comparar forma de onda y sincronización CKP/CMP con datos técnicos de esa ECU."],
    precaucion:"La medición de resistencia en un Hall puede dañarlo; no alimentar sensores desde una fuente externa sin especificación.",
    fuente:["HELLA · Sensor de cigüeñal","https://www.hella.com/techworld/es/informacion-tecnica/sensores-y-actuadores/sensor-del-ciguee-ntilde-al/"]
  },
  cmp:{
    nombre:"Posición de árbol de levas (CMP)",
    funciones:["Alimentación del captor activo, según sistema","Masa/retorno","Señal de sincronización"],
    medidas:[
      ["Señal (Hall en modelos que lo emplean)","Pulsos rectangulares con giro","Revisar con osciloscopio; tensión de alimentación específica"],
      ["Sincronización","La correlación CKP/CMP debe ajustarse a la distribución","Comparar patrones exactos de motor/ECU"],
      ["Resistencia","No medir en captor activo sin identificar su tecnología","Riesgo de daño; consultar procedimiento"]
    ],
    pasos:["Revisar alimentación, masas, fichas y daños de ramal con el pinado confirmado.","Comprobar pulsos y sincronización CMP/CKP al dar arranque.","Considerar distribución corrida o rueda de referencia dañada si la señal eléctrica está correcta.","Confirmar si el código apunta al árbol A o B y al banco correcto."],
    precaucion:"No usar pinado ni forma de onda de otro motor aunque tenga la misma marca.",
    fuente:["HELLA · Sensor de árbol de levas","https://www.hella.com/techworld/es/informacion-tecnica/sensores-y-actuadores/sensor-de-arbol-de-levas/"]
  },
  knock:{
    nombre:"Sensor de detonación (KS)",
    funciones:["Señal piezoeléctrica","Retorno o blindaje, según montaje"],
    medidas:[
      ["Señal","Eventos de vibración; no existe un valor DC universal","Evaluar con equipo/procedimiento indicado por ECU"],
      ["Fijación","Par de apriete y contacto con bloque críticos","Consultar manual de motor"]
    ],
    pasos:["Inspeccionar integridad del conector, cable apantallado y fijación del sensor.","Comprobar correlación con avance, mezcla y condiciones de aparición del DTC.","Usar instrucciones del fabricante para señal y par de montaje."],
    precaucion:"No golpear el sensor ni medir ohmios indiscriminadamente; puede producirse un diagnóstico falso.",
    fuente:["HELLA · Información técnica de sensores","https://www.hella.com/techworld/es/informacion-tecnica/sensores-y-actuadores/"]
  },
  fuel:{
    nombre:"Sensor de presión de combustible",
    funciones:["Referencia/alimentación del sensor","Masa/retorno","Señal analógica o digital de presión, según versión"],
    medidas:[
      ["Alimentación (ejemplo Bosch)","5 V típicos en determinados modelos; algunos utilizan 3,3 V","Consultar número de parte exacto"],
      ["Señal","Curva dependiente del rango de presión específico","Comparar presión real, escáner y hoja técnica"],
      ["Dato de escáner","Presión objetivo y real deben analizarse en condiciones iguales","No confundir falla del sensor con falla de regulación"]
    ],
    pasos:["Identificar sensor, motor y tipo de inyección antes de intervenir.","Comparar presión objetivo y leída en escáner con condición de operación.","Verificar tensiones sin desconectar tuberías de alta presión.","Ante discrepancias, revisar ramal, alimentación, masa y regulación según manual."],
    precaucion:"PELIGRO: riel de combustible de alta presión. No aflojar conexiones, purgar ni desconectar tuberías con el sistema presurizado.",
    fuente:["Bosch Mobility · Sensor de alta presión","https://www.bosch-mobility.com/en/solutions/sensors/high-pressure-sensor/"]
  }
};
function tipo(code){
 if(/^P010[0-4]$/.test(code))return 'maf';
 if(/^P010[5-9]$/.test(code))return 'map';
 if(/^P011[0-4]$/.test(code))return 'iat';
 if(/^P011[5-9]$/.test(code))return 'ect';
 if(/^P012[0-4]$/.test(code)||/^P022[0-4]$/.test(code))return 'tps';
 if(/^P01(3[0-9]|4[0-1]|5[0-9]|6[0-1])$/.test(code))return 'oxygen';
 if(/^P033[5-9]$/.test(code))return 'ckp';
 if(/^P034[0-9]$/.test(code))return 'cmp';
 if(/^P032[5-9]$/.test(code))return 'knock';
 if(/^P019[0-4]$/.test(code))return 'fuel';
 return null;
}

/* Ficha visual: las fotos identifican una familia, nunca un repuesto exacto. */
const VISUALES={
 map:{cables:"Habitual: 3 cables; combinado MAP + IAT: 4",variantes:["MAP analógico: referencia, masa y señal","MAP + IAT: puede compartir masa y sumar señal de temperatura"],detalle:"Suele ir en colector de admisión o conectado por manguera al vacío.",forma:"map"},
 maf:{cables:"Habitual: 4 a 6 cables (también existen otras versiones)",variantes:["Alimentación y masa","Señal de masa de aire","En modelos integrados: sensor IAT y/o retornos adicionales"],detalle:"Suele instalarse en el conducto de admisión después del filtro de aire.",forma:"maf",foto:"Bosch_Mass_Air_Flow_Sensor_location_in_the_engine_bay_(Opel_Antara_2.0_CDTI).jpg",autor:"Antonín Ryska",licencia:"CC BY-SA 4.0"},
 ect:{cables:"Habitual: 2 cables; hay sensores combinados de más terminales",variantes:["ECT NTC simple: señal y retorno","ECT combinado: circuitos independientes para ECU y tablero"],detalle:"Frecuente en culata, termostato o conducto de refrigerante.",forma:"ect"},
 iat:{cables:"Habitual: 2 cables; integrado en MAP/MAF: conector compartido",variantes:["Termistor simple: señal y retorno","Integrado: no se puede contar sus cables por separado sin esquema"],detalle:"Suele estar en conducto de admisión o integrado en MAP/MAF.",forma:"iat"},
 tps:{cables:"TPS simple: 3 cables; pedal/mariposa redundante: 4 a 6 o más",variantes:["Potenciómetro simple: referencia, masa y señal","Doble pista: pueden existir dos señales y referencias/retornos compartidos o independientes"],detalle:"TPS en eje de mariposa; APP en pedal electrónico.",forma:"tps",foto:"Throttle_position_sensor.jpg",autor:"Ochandwadkar",licencia:"CC BY-SA 4.0"},
 ckp:{cables:"Inductivo: habitualmente 2; Hall: habitualmente 3 (existen activos de 2)",variantes:["Inductivo: dos extremos de bobina (blindaje puede ser adicional)","Hall: alimentación, retorno y señal","Activo de 2 hilos: tecnología distinta del inductivo"],detalle:"Suele estar cerca de polea, volante de motor o bloque.",forma:"ckp"},
 cmp:{cables:"Hall: habitualmente 3; inductivo: habitualmente 2",variantes:["Hall: alimentación, retorno y señal","Inductivo: dos extremos de bobina"],detalle:"Ubicado cerca del árbol de levas o tapa de distribución.",forma:"cmp"},
 oxygen:{cables:"Lambda clásica: 1 a 4 cables; banda ancha AFR: habitualmente 5 o 6",variantes:["1 cable: señal, masa por carcasa (según diseño)","4 cables: señal, retorno y 2 de calefactor (convencional)","AFR 5/6 cables: celdas de medición, control y calentador; otro procedimiento"],detalle:"Roscada en el escape; antes o después del catalizador.",forma:"oxygen",foto:"Oxygen_sensor_IMG_0488.JPG",autor:"Hans Haase",licencia:"CC BY-SA 3.0"},
 knock:{cables:"Habitual: 1 o 2 cables, según circuito y blindaje",variantes:["Piezoeléctrico de un terminal: retorno por carcasa, según diseño","Dos terminales: señal y retorno; cable blindado posible"],detalle:"Atornillado al bloque para captar vibraciones.",forma:"knock"},
 fuel:{cables:"Habitual: 3 cables en sensores analógicos; otros sistemas varían",variantes:["Analógico típico: alimentación/referencia, masa y señal","Digital: alimentación y comunicación según protocolo"],detalle:"Suele montarse en el riel de combustible; cuidado con alta presión.",forma:"fuel"}
};
const FOTO_BASE='https://commons.wikimedia.org/wiki/Special:Redirect/file/';
const FOTO_FICHA='https://commons.wikimedia.org/wiki/File:';
function silueta(tipo){
 const x={
 map:'<rect x="64" y="53" width="145" height="88" rx="20"/><rect x="108" y="22" width="42" height="49" rx="12"/><path d="M48 90h30M209 90h30"/><circle cx="49" cy="91" r="13"/><circle cx="241" cy="91" r="13"/><rect x="108" y="137" width="65" height="30" rx="6"/>',
 maf:'<rect x="50" y="55" width="196" height="95" rx="45"/><ellipse cx="60" cy="103" rx="24" ry="47"/><path d="M60 59v88M71 67v73M46 83h29M43 103h34M46 123h29"/><rect x="130" y="29" width="72" height="41" rx="8"/>',
 ect:'<rect x="110" y="41" width="70" height="36" rx="9"/><path d="M118 77h53l18 18-13 25h-65l-13-25z"/><rect x="125" y="118" width="36" height="62" rx="8"/><path d="M122 125h44M122 137h44M122 149h44"/>',
 iat:'<rect x="102" y="34" width="94" height="50" rx="10"/><path d="M112 83h72l-5 69h-61z"/><path d="M126 104v30M145 104v30M164 104v30"/><path d="M112 152h72"/>',
 tps:'<circle cx="148" cy="105" r="61"/><circle cx="148" cy="105" r="21"/><rect x="193" y="94" width="62" height="34" rx="7"/><circle cx="76" cy="50" r="17"/><circle cx="76" cy="160" r="17"/><path d="M89 63l28 14M89 146l28-15"/>',
 ckp:'<rect x="94" y="39" width="66" height="94" rx="17"/><path d="M94 111h66"/><rect x="100" y="132" width="54" height="41" rx="5"/><path d="M124 39C125 6 199 15 215 49"/><rect x="209" y="49" width="45" height="32" rx="8"/>',
 cmp:'<rect x="107" y="42" width="82" height="53" rx="9"/><path d="M120 95h56v67h-56z"/><path d="M120 129h56"/><circle cx="105" cy="90" r="16"/>',
 oxygen:'<path d="M109 41c-7-31 17-40 44-29M153 13c35 17 63 12 73 40"/><rect x="95" y="58" width="95" height="42" rx="13"/><path d="M111 100h61l15 17-14 17h-64l-15-17z"/><rect x="120" y="134" width="42" height="46" rx="7"/><path d="M117 142h48M117 153h48M117 165h48"/>',
 knock:'<circle cx="148" cy="110" r="72"/><circle cx="148" cy="110" r="28"/><rect x="191" y="94" width="65" height="35" rx="8"/>',
 fuel:'<rect x="111" y="26" width="71" height="49" rx="8"/><path d="M115 75h65l22 24-18 27h-70l-18-27z"/><rect x="126" y="126" width="44" height="53" rx="6"/><path d="M122 135h51M122 146h51M122 157h51"/>'
 }[tipo]||'';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 210"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#f0f7fd"/><stop offset="1" stop-color="#b6cad8"/></linearGradient></defs><rect width="300" height="210" rx="14" fill="#e9f2f9"/><ellipse cx="150" cy="185" rx="106" ry="13" fill="#b9cbd8" opacity=".5"/><g fill="url(#b)" stroke="#294763" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">'+x+'</g></svg>';
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function cuadroVisual(t){
 const v=VISUALES[t];if(!v)return nodo('div');
 const grid=nodo('div',null,'visual-sensor');
 const foto=nodo('div',null,'visual-sensor-foto');
 const img=nodo('img');
 img.alt='Referencia visual orientativa del sensor '+t.toUpperCase()+'; no identifica la pieza exacta del vehículo.';
 img.loading='lazy';
 img.decoding='async';
 img.src=v.foto?FOTO_BASE+encodeURIComponent(v.foto)+'?width=500':silueta(v.forma);
 if(v.foto)img.addEventListener('error',()=>{img.onerror=null;img.src=silueta(v.forma); const ley=foto.querySelector('small');if(ley)ley.textContent='Ilustración esquemática: no se pudo cargar la fotografía.';},{once:true});
 foto.appendChild(img);
 foto.appendChild(nodo('small',v.foto?'Foto de ejemplo · '+v.autor+' · '+v.licencia:'Ilustración esquemática orientativa (no es fotografía del repuesto).'));
 if(v.foto){
  const link=nodo('a','Crédito y licencia de la fotografía ↗');
  link.href=FOTO_FICHA+encodeURIComponent(v.foto);link.target='_blank';link.rel='noopener noreferrer';foto.appendChild(link);
 }
 const info=nodo('div',null,'visual-sensor-info');
 info.appendChild(nodo('strong','🔌 '+v.cables));
 info.appendChild(nodo('p',v.detalle,'result-caption'));
 const ul=nodo('ul');
 v.variantes.forEach(line=>ul.appendChild(nodo('li',line)));
 info.appendChild(ul);
 info.appendChild(nodo('p','Cables y funciones ORIENTATIVOS. No representan posiciones ni números de pin.','result-caption'));
 grid.append(foto,info);
 return grid;
}

const bajas=new Set(['P0102','P0107','P0112','P0117','P0122','P0222','P0131','P0151','P0337','P0342','P0192']);
const altas=new Set(['P0103','P0108','P0113','P0118','P0123','P0223','P0132','P0152','P0338','P0343','P0193']);
function interpretacion(code){
 if(bajas.has(code))return 'El código señala lectura/circuito bajo: comprobar referencia, masa, continuidad y señal frente al valor real. Una falla de cableado no implica necesariamente sensor roto.';
 if(altas.has(code))return 'El código señala lectura/circuito alto: revisar señal, masas, cortos a tensión y condiciones reales. No diagnosticar solo por el código.';
 if(/^(P0135|P0141|P0155|P0161)$/.test(code))return 'El código apunta especialmente al calefactor de la sonda. Separar la prueba del calefactor de la prueba de señal lambda.';
 return 'El DTC orienta la prueba, pero no identifica por sí solo una pieza defectuosa. Confirmar condición de aparición y datos en vivo.';
}
let panel=null;
function nodo(tag,txt,clase){
 const el=document.createElement(tag);
 if(clase)el.className=clase;
 if(txt!==undefined&&txt!==null)el.textContent=txt;
 return el;
}
function lista(titulo,items){
 const group=nodo('div',null,'result-box');
 group.appendChild(nodo('h4',titulo));
 const ul=nodo('ul');
 items.forEach(item=>ul.appendChild(nodo('li',item)));
 group.appendChild(ul);
 return group;
}
function asegurarPanel(){
 if(panel)return panel;
 const card=document.getElementById('resultCard');
 const caution=document.getElementById('resultCaution');
 if(!card||!caution)return null;
 panel=nodo('section',null,'result-box');
 panel.id='fichaSensores';
 panel.setAttribute('aria-label','Guía eléctrica por código de falla');
 card.insertBefore(panel,caution);
 return panel;
}
function mostrar(code,vehiculo,kind){
 const el=asegurarPanel();
 if(!el)return;
 const c=String(code||'').toUpperCase().trim();
 const t=tipo(c),g=t&&TECNICA[t];
 if(!g||kind==='invalid'){el.hidden=true;el.replaceChildren();return;}
 el.hidden=false;
 el.replaceChildren();
 el.appendChild(nodo('h4','🔌 Sensor relacionado · '+g.nombre));
 el.appendChild(cuadroVisual(t));
 el.appendChild(nodo('p',interpretacion(c),'result-caption'));
 el.appendChild(nodo('p','Pinado exacto: SIN VALIDAR para '+(String(vehiculo||'').trim()||'este vehículo')+'. Se muestran funciones posibles de terminales, NO su número, orden, color ni ubicación. Para indicarlos se necesita año, motor, identificación de ECU y esquema confiable.','result-caption'));
 el.appendChild(lista('Terminales: función posible (sin numeración)',g.funciones));
 const tabla=nodo('div',null,'result-box');
 tabla.appendChild(nodo('h4','📏 Valores y condiciones de medición'));
 g.medidas.forEach(([nombre,valor,condicion])=>{
  const renglon=nodo('div',null,'brand-row');
  renglon.appendChild(nodo('strong',nombre+': '+valor));
  renglon.appendChild(nodo('p',condicion,'result-caption'));
  tabla.appendChild(renglon);
 });
 el.appendChild(tabla);
 el.appendChild(lista('🔍 Pruebas paso a paso',g.pasos));
 el.appendChild(nodo('p','⚠️ '+g.precaucion,'result-caption'));
 el.appendChild(nodo('p','Nunca inyectar 12 V en líneas de 5 V ni medir resistencia con módulos energizados. Antes de medir, identificar el sistema y usar conexiones seguras.','result-caption'));
 const p=nodo('p',null,'result-caption');
 p.appendChild(nodo('span','Referencia técnica: '));
 const a=nodo('a',g.fuente[0]);a.href=g.fuente[1];a.target='_blank';a.rel='noopener noreferrer';
 p.appendChild(a);
 el.appendChild(p);
}
function texto(code,vehiculo){
 const t=tipo(String(code||'').toUpperCase()),g=t&&TECNICA[t];
 if(!g)return '';
 return [
  'GUÍA ELÉCTRICA · '+g.nombre,
  'Cableado orientativo: '+VISUALES[t].cables,
  'Variantes comunes:',...VISUALES[t].variantes.map(s=>'• '+s),
  'Identificación visual: '+VISUALES[t].detalle,
  interpretacion(String(code||'').toUpperCase()),
  'Pinado exacto: NO validado para '+(vehiculo||'vehículo no especificado')+'. Las siguientes son FUNCIONES, no números de pin.',
  'Funciones de terminales:',...g.funciones.map(s=>'• '+s),
  'Mediciones orientativas:',...g.medidas.map(m=>'• '+m[0]+': '+m[1]+' ('+m[2]+')'),
  'Pasos:',...g.pasos.map(s=>'• '+s),
  'Seguridad: '+g.precaucion,
  'Fuente: '+g.fuente[1]
 ].join('\n');
}
window.ScantecSensores=Object.freeze({mostrar,texto,tipo});
})();