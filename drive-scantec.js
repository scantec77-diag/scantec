/* Scantec Drive: lectura de metadatos dentro de la carpeta autorizada.
   Token temporal en memoria/sessionStorage. Nunca se transmite a Firebase ni GitHub. */
(function(){
"use strict";
const SCOPE="https://www.googleapis.com/auth/drive.metadata.readonly";
const STORAGE_KEY="scantec_drive_preferencias_v1";
// Persistencia temporal en esta pestaña (nunca un permiso permanente de Google).
const SESSION_KEY="scantec_drive_token_sesion_v1";
const INDEX_KEY="scantec_drive_indice_sesion_v1";
const LOCAL_INDEX_PREFIX="scantec_drive_indice_local_v2:";
const INDEX_TTL=12*60*60*1000;
const MAX_INDEX_FILES=5000;
const MAX_INDEX_FOLDERS=2000;
const MAX_FOLDER_DEPTH=18;
const DEFAULT_FOLDER="1MKX6ueCTknpmrPp3oryXAE5lck0HTrAv";
const $=id=>document.getElementById(id);
const box=(tag,text,className)=>{const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=String(text);if(className)x.className=className;return x};
const clean=s=>String(s||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const folderId=s=>{
 const t=String(s||"").trim();
 const m=t.match(/\/folders\/([A-Za-z0-9_-]{10,})/);
 if(m)return m[1];
 return /^[A-Za-z0-9_-]{10,}$/.test(t)?t:"";
};
const clientValid=s=>/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(String(s||"").trim());
function settings(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}}catch{return{}}}
let editingRememberAccount=false;
function saveSettings(){
 const clientId=$("clientId").value.trim(),folder=folderId($("folderId").value);
 const previous=settings();
 // Con el formulario oculto, la configuración general no debe borrar el correo guardado.
 const formHidden=$("rememberDriveForm").hidden;
 const remember=formHidden?!!(previous.rememberAccount??previous.loginHint):$("rememberDriveAccount").checked;
 const loginHint=formHidden?(previous.loginHint||""):(remember?$("driveRememberEmail").value.trim().toLowerCase():"");
 if(!clientValid(clientId)){show("Pegá un ID de cliente OAuth de aplicación web válido (termina en .apps.googleusercontent.com).",true);return false}
 if(!folder){show("Pegá el enlace de la carpeta raíz ScanTec 77 o su ID.",true);return false}
 if(remember&&!loginHint){show("Ingresá el correo de Google Drive que querés recordar.",true);$("driveRememberEmail").focus();return false}
 if(loginHint&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginHint)){
  show("Revisá el correo de la cuenta preferida.",true);return false
 }
 const changed=previous.clientId!==clientId||previous.folder!==folder||(previous.loginHint||"")!==loginHint;
 localStorage.setItem(STORAGE_KEY,JSON.stringify({clientId,folder,loginHint,rememberAccount:remember}));
 $("folderId").value=folder;
 if(changed){token="";expiresAt=0;tokenClient=null;forgetSession();clearFiles();setAuth(false)}
 // No dejar visible el correo, ni siquiera al volver desde otra pestaña.
 editingRememberAccount=false;
 $("driveRememberEmail").value="";
 updateRememberUI();
 show(remember?"Cuenta de Drive guardada. El correo queda oculto.":"Configuración guardada. Podés elegir tu cuenta al conectar.");
 return true;
}
let token="",expiresAt=0,tokenClient=null,items=[],lastRoot="",activeUid="",syncing=false,libraryLoaded=false;
function indexKey(){return INDEX_KEY+":"+activeUid}
function forgetSession(keepIndex=false){
 try{
  sessionStorage.removeItem(SESSION_KEY);
  if(!keepIndex && activeUid){sessionStorage.removeItem(indexKey());localStorage.removeItem(LOCAL_INDEX_PREFIX+activeUid)}
  sessionStorage.removeItem(INDEX_KEY); // limpiar formato antiguo sin identificación de usuario
 }catch{}
}
function rememberSession(){
 // Token OAuth de corta duración: solo en sessionStorage, nunca en localStorage.
 try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({
  token,expiresAt,clientId:$("clientId").value.trim(),folder:folderId($("folderId").value),uid:activeUid
 }))}catch{}
}
function restoreSession(){
 try{
  const data=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
  if(data&&activeUid&&data.uid===activeUid&&typeof data.token==="string"&&data.token&&Number.isFinite(data.expiresAt)
     &&data.expiresAt>Date.now()+30000
     &&data.clientId===$("clientId").value.trim()
     &&data.folder===folderId($("folderId").value)){
   token=data.token;expiresAt=data.expiresAt;return true;
  }
  forgetSession(true);
 }catch{forgetSession(true)}
 return false;
}
function rememberIndex(){
 if(!activeUid)return;
 const data=JSON.stringify({uid:activeUid,root:lastRoot,created:Date.now(),items});
 try{sessionStorage.setItem(indexKey(),data)}catch{}
 try{localStorage.setItem(LOCAL_INDEX_PREFIX+activeUid,data)}catch{}
}
function restoreIndex(){
 if(!activeUid)return false;
 for(const source of [sessionStorage,localStorage]){
  try{
   const key=source===sessionStorage?indexKey():LOCAL_INDEX_PREFIX+activeUid;
   const data=JSON.parse(source.getItem(key)||"null");
   if(data?.uid===activeUid&&data?.root===folderId($("folderId").value)
      &&typeof data.created==="number"&&data.created<=Date.now()
      &&Date.now()-data.created<INDEX_TTL&&Array.isArray(data.items)){
    items=data.items.filter(f=>f&&typeof f.id==="string"&&typeof f.name==="string"&&typeof f.path==="string");
    lastRoot=data.root;libraryLoaded=true;return true;
   }
  }catch{}
 }
 return false;
}
const signinURL="https://console.cloud.google.com/auth/clients";
const directRoot="https://drive.google.com/drive/folders/"+DEFAULT_FOLDER;
function show(t,err){
 const mensaje=String(t);
 const s=$("estado");s.textContent=mensaje;s.className=err?"error":"note status";
 // Los mensajes también deben verse sin abrir Configuración.
 const publico=$("drivePublicStatus");
 if(publico){publico.textContent=mensaje;publico.className=err?"error":"note status"}
}
function setAuth(on){$("connect").disabled=false;$("refresh").disabled=!on;$("disconnect").disabled=!on;$("authLabel").textContent=on?"Google Drive autorizado (lectura de metadatos)":"Drive sin conectar";const estadoPublico=$("drivePublicStatus");if(estadoPublico)estadoPublico.textContent=on?"Drive conectado. Buscá por marca, modelo, motor o código de falla.":"Drive sin conectar. Podés tocar Reconectar Mi Drive sin entrar a Configuración.";const reconectar=$("reconnectDrive");if(reconectar)reconectar.hidden=on||!clientValid($("clientId").value.trim());}
function linkButton(text,url){
 const a=box("a",text,"doc-link");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function clearFiles(){items=[];libraryLoaded=false;$("results").replaceChildren(box("p","Conectá Google Drive para consultar tu biblioteca.","note"));$("summary").textContent="";}
function validateFileUrl(u,id,mime){
 try{const p=new URL(u);if(p.protocol==="https:"&&(/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/).test(p.hostname))return p.href}catch{}
 const safeId=encodeURIComponent(id);
 return mime==="application/vnd.google-apps.folder"?"https://drive.google.com/drive/folders/"+safeId:"https://drive.google.com/open?id="+safeId;
}
function expire(){
 token="";expiresAt=0;forgetSession(true);setAuth(false);
 if(!items.length)restoreIndex();render();
 show(items.length?"Permiso vencido. Se conserva el índice; reconectá para actualizar.":"Permiso vencido. Tocá Reconectar Mi Drive para recuperar tus planos.",true);
}
function connect(){
 if(!saveSettings())return;
 if(!window.google?.accounts?.oauth2?.initTokenClient){show("Todavía no cargó el sistema de autorización de Google. Esperá unos segundos y reintentá.",true);return}
 const conf=settings();
 tokenClient=window.google.accounts.oauth2.initTokenClient({
  client_id:conf.clientId,scope:SCOPE,prompt:"",...(conf.loginHint?{login_hint:conf.loginHint}:{}),
  callback:async response=>{
   if(response.error||!response.access_token){$("connect").disabled=false;show("Google no autorizó el acceso: "+(response.error||"intento cancelado"),true);return}
   token=response.access_token;
   expiresAt=Date.now()+Math.max(0,Number(response.expires_in||3500)-90)*1000;
   rememberSession();
   setAuth(true);show("¡Conectado! Leyendo la biblioteca privada ScanTec 77…");
   await refresh();
  },
  error_callback:e=>{$("connect").disabled=false;show("No se completó la autorización de Google: "+(e.type||"ventana cerrada"),true)}
 });
 $("connect").disabled=true;
 try{tokenClient.requestAccessToken({prompt:""})}catch(e){show("No se pudo abrir Google: "+e.message,true);$("connect").disabled=false}
}
function requestOK(){
 if(!token||Date.now()>=expiresAt){expire();throw Error("Tenés que volver a autorizar Drive.")}
}
async function apiList(folder){
 requestOK();
 const all=[];let next="",pageCount=0;
 do{
  const q="'"+folder.replace(/'/g,"\\'")+"' in parents and trashed = false";
  const params=new URLSearchParams({q,fields:"nextPageToken,files(id,name,mimeType,webViewLink)",pageSize:"500",supportsAllDrives:"true",includeItemsFromAllDrives:"true"});
  if(next)params.set("pageToken",next);
  const r=await fetch("https://www.googleapis.com/drive/v3/files?"+params.toString(),{headers:{Authorization:"Bearer "+token},cache:"no-store"});
  if(r.status===401){expire();throw Error("Se venció la autorización.")}
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw Error("Google Drive respondió "+r.status+": "+String(body.error?.message||"Verificá que Drive API esté habilitada."));
  all.push(...(body.files||[]));next=body.nextPageToken||"";pageCount++;
 }while(next&&pageCount<50);
 if(next)throw Error("La carpeta contiene demasiadas páginas; se interrumpió la lectura para no dejar archivos afuera.");
 return all;
}
async function refresh(){
 if(!token)return show("Primero tenés que conectar tu cuenta con Google.",true);
 const root=folderId($("folderId").value);
 if(!root)return show("La carpeta raíz indicada no tiene un ID válido.",true);
 $("refresh").disabled=true;$("connect").disabled=true;
 syncing=true;restoreIndex();lastRoot=root;
 const previousItems=items.slice();items=[];libraryLoaded=false;render();
 const queue=[{id:root,path:"ScanTec 77",depth:0}],seen=new Set();
 let folderCount=0,fileCount=0,limitFiles=false,depthLimited=false;
 try{
  while(queue.length&&fileCount<MAX_INDEX_FILES&&folderCount<MAX_INDEX_FOLDERS){
   const at=queue.shift();
   if(seen.has(at.id))continue;seen.add(at.id);folderCount++;
   show("Sincronizando Drive: "+fileCount.toLocaleString("es-AR")+" archivos · "+folderCount.toLocaleString("es-AR")+" carpetas revisadas.");
   const files=await apiList(at.id);
   for(const file of files){
    if(!file?.id||!file.name)continue;
    const isFolder=file.mimeType==="application/vnd.google-apps.folder";
    if(!isFolder&&fileCount>=MAX_INDEX_FILES){limitFiles=true;break}
    const path=at.path+"/"+file.name;
    // Guardamos solo metadatos necesarios para no agotar la memoria del celular.
    items.push({id:file.id,name:file.name,mimeType:file.mimeType||"",webViewLink:file.webViewLink||"",isFolder,path});
    if(isFolder){
     if(at.depth<MAX_FOLDER_DEPTH&&!seen.has(file.id))queue.push({id:file.id,path,depth:at.depth+1});
     else if(at.depth>=MAX_FOLDER_DEPTH)depthLimited=true;
    }else fileCount++;
    if(fileCount>=MAX_INDEX_FILES){limitFiles=true;break}
   }
   if(limitFiles)break;
  }
  libraryLoaded=true;rememberIndex();
  const maxFoldersReached=queue.length>0&&folderCount>=MAX_INDEX_FOLDERS;
  const parcial=limitFiles||maxFoldersReached||depthLimited;
  const aviso=parcial?" · Lectura parcial: "+(limitFiles?"límite de 5.000 archivos":maxFoldersReached?"límite de 2.000 carpetas":"profundidad máxima de carpetas")+".":"";
  show("Biblioteca sincronizada: "+fileCount.toLocaleString("es-AR")+" archivos en "+folderCount.toLocaleString("es-AR")+" carpetas. Ya podés buscar tus planos y manuales."+aviso);
  // Al completar la conexión, volvemos a la búsqueda principal, no al menú.
  const menu=$("driveSettings");if(menu)menu.open=false;
  $("buscar").focus({preventScroll:true});
  $("buscar").scrollIntoView({behavior:"smooth",block:"center"});
 }catch(e){
  items=previousItems;libraryLoaded=!!previousItems.length;
  if(!items.length)restoreIndex();
  show("Error al consultar Drive: "+e.message+(items.length?" · Conservé tu índice anterior.":" · Revisá la conexión y la carpeta configurada."),true);
 }
 finally{syncing=false;render();$("refresh").disabled=!token;$("connect").disabled=false}
}
function score(obj,query){
 const full=clean(obj.path),name=clean(obj.name);
 const terms=clean(query).split(/\s+/).filter(z=>z.length>=2&&z!=="de"&&z!=="un");
 return terms.reduce((n,t)=>n+(name.includes(t)?4:full.includes(t)?2:0),0);
}
function render(){
 const host=$("results");host.replaceChildren();
 const search=$("buscar").value.trim();
 if(syncing){$("summary").textContent="Sincronizando biblioteca…";host.appendChild(box("p","Leyendo carpetas y manuales. La búsqueda se habilita al terminar.","note"));return}
 if(!items.length&&!libraryLoaded){$("summary").textContent="Biblioteca todavía no disponible";host.appendChild(box("p","Tocá «Reconectar Mi Drive» y esperá que termine la sincronización antes de buscar.","note"));return}
 if(!search){$("summary").textContent="";host.appendChild(box("p","Escribí una marca, modelo, motor o código de falla para ver los documentos que coincidan.","note"));return}
 const docs=items.filter(f=>!f.isFolder);
 const visible=docs.map(x=>({x,score:score(x,search)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.x.path.localeCompare(b.x.path)).map(x=>x.x).slice(0,150);
 $("summary").textContent=(token?"":"Índice guardado de esta sesión (sin conexión actual) · ")+"Coincidencias para «"+search+"»: "+visible.length+(visible.length===150?" (primeras 150)":"");
 if(!visible.length){host.appendChild(box("p",docs.length?"No encontré coincidencias en los nombres de los archivos. Probá solo «Chevrolet» o «Peugeot».":"La carpeta vinculada no contiene archivos indexados. Revisá la carpeta raíz configurada.","note"));return}
 for(const file of visible){
  const el=box("article",null,"file-row");
  el.appendChild(box("strong",(file.mimeType==="application/pdf"?"📄 ":"📁 ")+file.name));
  el.appendChild(box("p",file.path,"path"));
  const url=validateFileUrl(file.webViewLink,file.id,file.mimeType);
  el.appendChild(linkButton("Abrir en Google Drive ↗",url));
  host.appendChild(el);
 }
}
function disconnect(){
 const t=token;token="";expiresAt=0;tokenClient=null;forgetSession();clearFiles();setAuth(false);
 if(t&&window.google?.accounts?.oauth2?.revoke)window.google.accounts.oauth2.revoke(t,()=>{});
 show("Drive desconectado de este navegador. La carpeta y el ID de cliente quedan guardados; los archivos no fueron modificados.");
}
function updateRememberUI(){
 const s=settings();
 const saved=!!s.loginHint&&!!(s.rememberAccount??s.loginHint);
 $("rememberDriveForm").hidden=saved&&!editingRememberAccount;
 $("rememberDriveSaved").hidden=!saved||editingRememberAccount;
 $("rememberDriveDetails").hidden=!$("rememberDriveAccount").checked;
}
function init(){
 const s=settings();
 $("clientId").value=s.clientId||"";
 $("folderId").value=s.folder||DEFAULT_FOLDER;
 $("rememberDriveAccount").checked=s.rememberAccount===undefined?!!s.loginHint:!!s.rememberAccount;
 $("driveRememberEmail").value=""; // El correo almacenado no se exhibe en pantalla.
 updateRememberUI();
 $("rootLink").href=directRoot;
 $("cloudLink").href=signinURL;
 const qs=new URLSearchParams(location.search);
 const v=qs.get("vehiculo")||"",m=qs.get("motor")||"";
 const query=[v,m].filter(Boolean).join(" ");
 $("buscar").value=query||"";
 $("connect").addEventListener("click",connect);
 $("reconnectDrive").addEventListener("click",connect);
 $("rememberDriveAccount").addEventListener("change",updateRememberUI);
 $("saveRememberAccount").addEventListener("click",saveSettings);
 $("changeDriveAccount").addEventListener("click",()=>{
  editingRememberAccount=true;
  $("rememberDriveAccount").checked=true;
  $("driveRememberEmail").value="";
  updateRememberUI();
  $("driveRememberEmail").focus();
 });
 $("save").addEventListener("click",saveSettings);
 $("refresh").addEventListener("click",refresh);
 $("disconnect").addEventListener("click",disconnect);
 $("buscar").addEventListener("input",render);
 setAuth(false);clearFiles();
 show("Verificando acceso privado a Mi Drive…");
}
let activated=false;
function activate(uid){
 const requestedUid=String(uid||"");
 if(!requestedUid)return;
 if(activated&&activeUid===requestedUid)return;
 if(activated&&activeUid!==requestedUid){
  // Una cuenta distinta de Scantec nunca puede reutilizar el acceso de Drive anterior.
  forgetSession();
  token="";expiresAt=0;tokenClient=null;items=[];lastRoot="";libraryLoaded=false;
  setAuth(false);clearFiles();
 }
 activeUid=requestedUid;
 activated=true;
 // Los documentos y el índice se cargan recién después del desbloqueo local.
 const s=settings();
 if(restoreSession()){
  setAuth(true);
  if(restoreIndex()){
   render();
   show("Drive conectado. Biblioteca disponible para buscar tus planos y manuales.");
  }else{
   show("Sesión de Google recuperada. Actualizando la biblioteca…");
   refresh();
  }
 }else if(!s.clientId){
  render();show("Falta configurar el ID de cliente OAuth. Abrí Configuración de Mi Drive.");
 }else if(restoreIndex()){
  render();
  show("Podés buscar en el último índice guardado de esta sesión. Para revisar archivos nuevos, tocá 🔄 Reconectar Mi Drive.");
 }else{
  render();show("Google Drive necesita autorización. Tocá 🔄 Reconectar Mi Drive para conectarlo.");
 }
}
window.ScantecDrive=Object.freeze({init,activate,folderId,score});
})();