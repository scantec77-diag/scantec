// Entrada privada a Mi Drive. Reutiliza WebAuthn del mismo navegador de Mi Taller.
// Es un bloqueo de interfaz local; los permisos reales de archivos siguen en Google.
import {initializeApp} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {disponible,enrolar,verificar} from "./biometria.js";

const config={apiKey:"AIzaSyBdnsyW2len_vQesuPY9tyjjxrCvl7zVow",authDomain:"scantec-7e3e9.firebaseapp.com",projectId:"scantec-7e3e9",storageBucket:"scantec-7e3e9.firebasestorage.app",messagingSenderId:"293382540",appId:"1:293382540:web:39a3dcbc70e3e921b38ea9"};
const $=id=>document.getElementById(id);
const auth=getAuth(initializeApp(config));
let cuenta=null,ocupado=false,automatico=false;
const clave=uid=>"scantec_bio_v1_"+uid;
function credencial(){
 if(!cuenta)return null;
 try{return JSON.parse(localStorage.getItem(clave(cuenta.uid))||"null")}catch{return null}
}
function estadoBio(){
 const rec=credencial(),ok=disponible();
 $("activateDriveBiometric").disabled=!cuenta||!ok||!!rec;
 $("deactivateDriveBiometric").disabled=!cuenta||!rec;
 $("driveBioStatus").textContent=!ok?"Este navegador no admite desbloqueo WebAuthn; probá Chrome actualizado.":rec?"Desbloqueo del teléfono activado en este navegador para Mi Drive y Mi Taller.":"Desbloqueo local sin activar. Podés activarlo aquí o desde Mi Taller.";
}
function cerrar(mensaje){
 $("driveApp").hidden=true;
 $("driveLock").hidden=false;
 $("lockDriveMessage").textContent=mensaje;
 $("unlockDrive").disabled=!cuenta;
}
function abrir(){
 $("driveLock").hidden=true;
 $("driveApp").hidden=false;
 estadoBio();
 window.ScantecDrive?.activate(cuenta?.uid);
}
async function desbloquear(intentoAutomatico=false){
 if(ocupado||!cuenta)return;
 const rec=credencial();
 if(!rec){abrir();return}
 ocupado=true;
 $("unlockDrive").disabled=true;
 $("lockDriveMessage").textContent="Confirmá el desbloqueo en tu teléfono…";
 const uid=cuenta.uid;
 try{
  // Solicitar WebAuthn directamente al tocar el botón o al cargar la pantalla.
  await verificar(rec);
  if(auth.currentUser?.uid!==uid)throw Error("Cambió la cuenta de Scantec.");
  abrir();
 }catch(e){
  cerrar(e.name==="NotAllowedError"?"Si no apareció la huella automáticamente, tocá «Desbloquear con mi teléfono».":"No se pudo desbloquear: "+(e.message||e.name)+". Probá de nuevo.");
 }finally{
  ocupado=false;
  $("unlockDrive").disabled=false;
 }
}
$("unlockDrive").addEventListener("click",()=>desbloquear(false));
$("activateDriveBiometric").addEventListener("click",async()=>{
 if(!cuenta||!disponible()||credencial())return;
 const uid=cuenta.uid;
 $("driveBioStatus").textContent="Confirmá el registro en tu dispositivo…";
 try{
  const nuevo=await enrolar(cuenta);
  if(auth.currentUser?.uid!==uid)throw Error("Cambió la cuenta de Scantec.");
  localStorage.setItem(clave(uid),JSON.stringify(nuevo));
  estadoBio();
 }catch(e){$("driveBioStatus").textContent="No se pudo activar: "+(e.message||e.name)}
});
$("deactivateDriveBiometric").addEventListener("click",()=>{
 if(!cuenta||!credencial())return;
 if(!confirm("¿Desactivar el desbloqueo local en este navegador? Esto también lo desactiva para Mi Taller."))return;
 localStorage.removeItem(clave(cuenta.uid));
 estadoBio();
});
onAuthStateChanged(auth,user=>{
 cuenta=user;automatico=false;estadoBio();
 if(!user){cerrar("Para ver Mi Drive, iniciá sesión en Scantec desde la pantalla principal.");return}
 if(!credencial()){abrir();return}
 const key="scantec_bio_drive_pase_"+user.uid;
 let pase=null;
 try{pase=JSON.parse(sessionStorage.getItem(key)||"null")}catch{}
 sessionStorage.removeItem(key);
 if(pase?.uid===user.uid&&pase.vence>Date.now()&&pase.vence<Date.now()+20000){abrir();return}
 cerrar("Usá la huella, PIN o patrón para entrar a tu biblioteca.");
 if(document.visibilityState==="visible"&&!automatico){automatico=true;desbloquear(true)}
},e=>cerrar("No se pudo comprobar la cuenta de Scantec: "+(e.code||e.message)));
window.addEventListener("pageshow",event=>{
 if(event.persisted&&cuenta&&credencial()){
  cerrar("La biblioteca se bloqueó al volver. Confirmá tu identidad para ingresar.");
  automatico=false;
 }
});
