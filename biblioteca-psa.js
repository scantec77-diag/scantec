/* SCANTEC | Biblioteca PSA Peugeot-Citroën v1.
   No representa ningún pinout externo como certificado para el auto ingresado. */
(function(){
'use strict';
const BASE='./biblioteca/psa/catalogo.json';
let loading=null,serial=0,panel=null;
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const tokens=s=>String(s||'').toUpperCase().match(/[A-Z][A-Z0-9.]{2,}/g)||[];
const sistemaNombres={map:'MAP',maf:'MAF',ect:'ECT',iat:'IAT',tps:'TPS/APP',ckp:'CKP',cmp:'CMP',oxygen:'sonda lambda',knock:'detonación',fuel:'presión de combustible',injectors:'inyectores',fuelpump:'bomba de combustible',ignition:'encendido',cooling:'refrigeración'};
function marca(s){
 const x=norm(s);
 if(/\bpeugeot\b/.test(x))return 'Peugeot';
 if(/\bcitroen\b|\bcitro[eë]n\b/.test(x))return 'Citroën';
 return '';
}
function modelo(s){
 const x=norm(s);
 if(/\bxsara[\s-]+picasso\b/.test(x))return 'xsara picasso';
 if(/\bberlingo\b/.test(x))return 'berlingo';
 if(/\bpartner\b/.test(x))return 'partner';
 if(/\bc3\b/.test(x))return 'c3';
 if(/\bc4\b/.test(x))return 'c4';
 for(const m of ['206','207','307','308','306','208','2008','3008','408'])if(new RegExp('\\b'+m+'\\b').test(x))return m;
 return '';
}
function year(s){const m=String(s||'').match(/\b(?:19[89]\d|20[0-3]\d)\b/);return m?Number(m[0]):null}
function tipoDtc(c){
 c=String(c||'').toUpperCase().replace(/\s/g,'');
 let t=window.ScantecSensores?.tipo(c)||'';
 if(t)return t;
 if(/^P020[0-9]$/.test(c))return 'injectors';
 if(/^P023[0-4]$/.test(c))return 'fuelpump';
 if(/^P03[0-5][0-9]$/.test(c))return 'ignition';
 if(/^P0128$/.test(c)||/^P048[0-9]$/.test(c))return 'cooling';
 if(/^P019[0-4]$/.test(c))return 'fuel';
 return '';
}
function getCatalogo(){
 if(!loading)loading=fetch(BASE,{cache:'no-cache'}).then(r=>{
  if(!r.ok)throw Error('Sin catálogo PSA: HTTP '+r.status);
  return r.json();
 }).then(x=>{
  if(!Array.isArray(x.planos)||x.familia!=='PSA')throw Error('Catálogo PSA incorrecto');
  return x;
 }).catch(e=>{loading=null;throw e});
 return loading;
}
function node(t,v,c){const x=document.createElement(t);if(v!==undefined&&v!==null)x.textContent=String(v);if(c)x.className=c;return x}
function valid(u){try{const url=new URL(u);return url.protocol==='https:'&&['es.scribd.com','www.scribd.com','pepopolis.blogspot.com','es.slideshare.net'].includes(url.hostname)}catch{return false}}
function safeLink(label,url){
 const a=node('a',label,'bib-link');
 if(valid(url)){a.href=url;a.target='_blank';a.rel='noopener noreferrer'}
 else{a.setAttribute('aria-disabled','true');a.textContent='Referencia sin enlace validado'}
 return a;
}
function kind(d){return d.tipo==='manual'?'📖 ABRIR MANUAL ↗':d.tipo==='indice'||d.tipo==='coleccion'?'📚 EXPLORAR DIAGRAMAS ↗':'📄 ABRIR PLANO / PINADO ↗'}
function ficha(d,etiqueta){
 const article=node('article',null,'bib-doc');
 const h=node('div',null,'bib-doc-head');
 h.appendChild(node('strong',d.titulo));
 h.appendChild(node('span',etiqueta,'bib-status'));
 article.appendChild(h);
 article.appendChild(node('p',(d.marca+' '+d.modelo.toUpperCase())+(d.motores?.length?' · motor '+d.motores.join(' / '):'')+(d.ecu?.length?' · ECU '+d.ecu.join(' / '):''),'result-caption'));
 if(d.acceso)article.appendChild(node('p',d.acceso,'result-caption'));
 if(d.nota)article.appendChild(node('p',d.nota,'result-caption'));
 article.appendChild(safeLink(kind(d),d.url));
 return article;
}
function autoBrand(vehicle,brand){
 return brand||marca(vehicle);
}
function compatible(d,x){
 if(d.marca!==x.brand||d.modelo!==x.model)return null;
 if(x.year&&d.anios&&(x.year<d.anios[0]||x.year>d.anios[1]))return null;
 // No confundir diagramas de motores/ECU diferentes.
 const engineTokens=tokens(x.motor);
 const motorConIdentificacion=engineTokens.some(t=>/^[A-Z]{2,}[0-9]|^[A-Z]{3}$|^ME[0-9]|^EDC[0-9]|^SID[0-9]|^[0-9][A-Z]{2}$/.test(t));
 const motorList=[...(d.motores||[]),...(d.ecu||[])].map(z=>z.toUpperCase().replace(/[^A-Z0-9]/g,''));
 const matches=engineTokens.some(t=>motorList.includes(t.replace(/[^A-Z0-9]/g,'')));
 const isCollection=['indice','coleccion','manual'].includes(d.tipo);
 const relevant=x.system?Array.isArray(d.sistemas)&&d.sistemas.includes(x.system):true;
 if(!relevant&&!isCollection)return null;
 if(x.motor&&motorConIdentificacion&&motorList.length&&!matches){
  // Documentos no validados del propio modelo como referencia general, excepto un motor explícitamente contradictorio.
  if(!isCollection)return null;
 }
 if(x.motor&&matches)return {d,rank:0,status:'Coincide motor o ECU declarados · verificar versión'};
 if(isCollection)return {d,rank:2,status:'Colección / manual orientativo'};
 if((!x.motor||!motorConIdentificacion)&&motorList.length)return {d,rank:1,status:'Motor NO identificado con código · no usar pinado'};
 return {d,rank:3,status:'Documento de referencia · validar VIN/OPR'};
}
function buscar(planos,query){
 const x={
  brand:autoBrand(query.vehiculo,query.marca),
  model:modelo(query.vehiculo),
  year:year(query.vehiculo),
  motor:String(query.motor||'').trim(),
  system:tipoDtc(query.codigo)
 };
 if(!x.brand||!x.model)return {error:'Completá marca (Peugeot o Citroën), modelo y, si lo conocés, año y motor/ECU.',x,items:[]};
 const items=planos.map(d=>compatible(d,x)).filter(Boolean).sort((a,b)=>a.rank-b.rank||a.d.titulo.localeCompare(b.d.titulo,'es'));
 return {x,items};
}
function renderInto(host,catalog,query,small){
 host.replaceChildren();
 const result=buscar(catalog.planos,query);
 if(!small)host.appendChild(node('h3','📚 Planos y manuales · '+(result.x.brand||'PSA')));
 const note=node('p','Los enlaces abren documentos originales. Scribd puede pedir inicio de sesión o pago; Scantec no descarga ni distribuye esos archivos.','result-caption');
 host.appendChild(note);
 if(result.error){host.appendChild(node('p',result.error,'result-caption'));return}
 host.appendChild(node('p',[result.x.brand,result.x.model,result.x.year||'',query.motor||'',query.codigo||''].filter(Boolean).join(' · '),'result-caption'));
 host.appendChild(node('p','⚠️ Antes de usar números de terminales verificá motor, ECU, BSI/BSM, OPR/DAM y mercado. Las referencias no sustituyen el plano por VIN.','bib-warning'));
 if(!result.items.length){
  host.appendChild(node('p','No hay un plano enlazado para esa combinación. Probá sin motor/ECU para ver referencias del modelo (NO equivalencias confirmadas), o revisá si la identificación es correcta.','result-caption'));
  return;
 }
 result.items.slice(0,15).forEach(item=>host.appendChild(ficha(item.d,item.status)));
}
function ensure(){
 if(panel)return panel;
 const card=$('resultCard');if(!card)return null;
 panel=node('section',null,'bib-psa');
 panel.id='bibliotecaPSA';
 panel.setAttribute('aria-label','Biblioteca de esquemas Peugeot y Citroën');
 const ref=$('causesBox')||$('resultCaution');
 if(ref)card.insertBefore(panel,ref);else card.appendChild(panel);
 return panel;
}
async function mostrar(code,vehiculo,kind,motor){
 const seq=++serial,el=ensure();
 if(!el)return;
 const brand=marca(vehiculo);
 if(kind==='invalid'||!brand){el.hidden=true;el.replaceChildren();return}
 el.hidden=false;
 el.replaceChildren(node('p','Consultando biblioteca PSA…','result-caption'));
 try{
  const cat=await getCatalogo();if(seq!==serial)return;
  renderInto(el,cat,{marca:brand,vehiculo,motor,codigo:code},false);
  const shortcut=safeLink('📚 Abrir biblioteca PSA completa ↗','./biblioteca-psa.html');
  // Enlace interno de Scantec (el validador externo solo acepta destinos autorizados).
  shortcut.href='./biblioteca-psa.html?'+new URLSearchParams({marca:brand,vehiculo,motor,codigo:code}).toString();
  shortcut.removeAttribute('aria-disabled');
  shortcut.textContent='📚 ABRIR BUSCADOR PSA ↗';
  el.appendChild(shortcut);
 }catch(e){
  if(seq!==serial)return;
  el.replaceChildren(node('p','La biblioteca PSA no se pudo cargar. Podés abrir el buscador independiente.','result-caption'));
  const a=node('a','📚 ABRIR BIBLIOTECA PSA','bib-link');a.href='./biblioteca-psa.html';el.appendChild(a);
 }
}
async function initPage(){
 const form=$('formPsa'),host=$('psaResultados'),status=$('psaEstado');
 if(!form||!host)return;
 const params=new URLSearchParams(location.search);
 if(params.get('marca'))$('psaMarca').value=params.get('marca');
 if(params.get('vehiculo'))$('psaVehiculo').value=params.get('vehiculo');
 if(params.get('motor'))$('psaMotor').value=params.get('motor');
 if(params.get('codigo'))$('psaDtc').value=params.get('codigo');
 const search=async()=>{
  const q={marca:$('psaMarca').value,vehiculo:$('psaVehiculo').value.trim(),motor:$('psaMotor').value.trim(),codigo:$('psaDtc').value.trim()};
  status.textContent='Buscando referencias Peugeot / Citroën…';
  try{const c=await getCatalogo();renderInto(host,c,q,false);status.textContent='Catálogo PSA: '+c.planos.length+' documentos enlazados; las referencias se filtran por tu búsqueda.'}
  catch{host.replaceChildren(node('p','No se pudo cargar el catálogo. Probá actualizando o verificando la conexión.'));status.textContent='Catálogo PSA no disponible.'}
 };
 form.addEventListener('submit',e=>{e.preventDefault();search()});
 search();
}
window.ScantecPSA=Object.freeze({mostrar,initPage,buscar,tipoDtc,marca,modelo});
})();