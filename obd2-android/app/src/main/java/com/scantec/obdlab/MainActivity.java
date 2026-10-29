package com.scantec.obdlab;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
    private static final int REQ_BT_CONNECT = 201;
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private WebView web;
    private BluetoothAdapter adapter;
    private BluetoothSocket socket;
    private InputStream input;
    private OutputStream output;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final ExecutorService poller = Executors.newSingleThreadExecutor();
    private volatile boolean streaming = false;
    private volatile boolean connecting = false;
    private String adapterName = "";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(8,17,26));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(8,17,26));
        web = new WebView(this);
        web.setBackgroundColor(android.graphics.Color.rgb(8,17,26));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new NativeBridge(), "AndroidBridge");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
        adapter = BluetoothAdapter.getDefaultAdapter();
    }

    private void js(String script) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(script, null); });
    }
    private void state(String status, String detail) {
        try { js("window.onNativeState && window.onNativeState(" + JSONObject.quote(status) + "," + JSONObject.quote(detail) + ")"); }
        catch (Exception ignored) { }
    }
    private void toast(String message) { runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_SHORT).show()); }

    private boolean hasConnectPermission() {
        return Build.VERSION.SDK_INT < 31 || checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }
    private void ensurePermissionAndSelect() {
        if (adapter == null) { state("error", "Este teléfono no informa un adaptador Bluetooth."); return; }
        if (Build.VERSION.SDK_INT >= 31 && !hasConnectPermission()) {
            requestPermissions(new String[]{Manifest.permission.BLUETOOTH_CONNECT}, REQ_BT_CONNECT);
            return;
        }
        if (!adapter.isEnabled()) {
            new AlertDialog.Builder(this).setTitle("Bluetooth apagado")
                .setMessage("Activá Bluetooth para buscar el ELM327 emparejado.")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Abrir ajustes", (d,w) -> startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS))).show();
            return;
        }
        showPairedDevices();
    }
    private void showPairedDevices() {
        try {
            Set<BluetoothDevice> bonded = adapter.getBondedDevices();
            List<BluetoothDevice> devices = new ArrayList<>();
            List<String> labels = new ArrayList<>();
            for (BluetoothDevice device : bonded) {
                devices.add(device);
                String name = device.getName() == null ? "Dispositivo Bluetooth" : device.getName();
                labels.add(name + "\n" + device.getAddress());
            }
            if (devices.isEmpty()) {
                new AlertDialog.Builder(this).setTitle("No hay adaptadores emparejados")
                    .setMessage("Emparejá el ELM327 desde Ajustes > Bluetooth y volvé a esta pantalla. Muchos adaptadores usan PIN 1234 o 0000.")
                    .setNegativeButton("Cerrar", null)
                    .setPositiveButton("Abrir Bluetooth", (d,w) -> startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS))).show();
                state("idle", "Emparejá el ELM327 desde Ajustes de Bluetooth.");
                return;
            }
            String[] options = labels.toArray(new String[0]);
            BluetoothDevice[] choices = devices.toArray(new BluetoothDevice[0]);
            new AlertDialog.Builder(this).setTitle("Elegí tu ELM327")
                .setItems(options, (d,which) -> connect(choices[which])).setNegativeButton("Cancelar", null).show();
        } catch (SecurityException e) {
            state("error", "Falta permiso para ver dispositivos Bluetooth emparejados.");
        }
    }
    private void connect(BluetoothDevice device) {
        if (connecting) return;
        connecting = true;
        streaming = false;
        closeSocket();
        String name;
        try { name = device.getName(); } catch (SecurityException e) { name = "ELM327"; }
        adapterName = name == null ? "ELM327" : name;
        state("connecting", "Conectando con " + adapterName + " por Bluetooth Classic SPP…");
        io.execute(() -> {
            try {
                BluetoothSocket candidate = device.createRfcommSocketToServiceRecord(SPP_UUID);
                candidate.connect();
                socket = candidate;
                input = candidate.getInputStream();
                output = candidate.getOutputStream();
                String id = command("ATI", 1800);
                command("ATZ", 3000);
                command("ATE0", 1200);
                command("ATL0", 1200);
                command("ATS0", 1200);
                command("ATH0", 1200);
                command("ATSP0", 1200);
                String supported = command("0100", 2500);
                String protocol = command("ATDP", 1200).trim();
                String firmware = clean(id);
                if (firmware.isEmpty()) firmware = adapterName;
                state("connected", "ELM conectado · " + firmware + " · protocolo " + clean(protocol) + " · mapa PID consultado");
                JSONObject info = new JSONObject();
                info.put("connected", true); info.put("adapter", adapterName); info.put("firmware", firmware);
                info.put("protocol", clean(protocol)); info.put("supportedPids", clean(supported));
                js("window.onNativeConnected && window.onNativeConnected(" + info.toString() + ")");
            } catch (Exception e) {
                closeSocket();
                state("error", "No se pudo conectar: " + shortError(e));
            } finally { connecting = false; }
        });
    }

    private synchronized String command(String text, long timeoutMs) throws Exception {
        if (socket == null || !socket.isConnected() || input == null || output == null) throw new IllegalStateException("ELM desconectado");
        while (input.available() > 0) input.read();
        output.write((text + "\r").getBytes(StandardCharsets.US_ASCII)); output.flush();
        long until = System.currentTimeMillis() + timeoutMs;
        StringBuilder response = new StringBuilder();
        while (System.currentTimeMillis() < until) {
            int available = input.available();
            if (available > 0) {
                for (int i=0;i<available;i++) {
                    int ch = input.read();
                    if (ch < 0) break;
                    if (ch == '>') return response.toString().trim();
                    response.append((char)ch);
                }
            } else {
                if (response.length() > 0 && System.currentTimeMillis() + 250 >= until) break;
                Thread.sleep(15);
            }
        }
        return response.toString().trim();
    }

    private void pollLoop() {
        while (streaming && socket != null && socket.isConnected()) {
            try {
                JSONObject v = new JSONObject();
                put(v,"rpm",pid(0x0C,2,(a,b)->((a*256+b)/4.0)));
                put(v,"speed",pid(0x0D,1,(a,b)->a));
                put(v,"ect",pid(0x05,1,(a,b)->a-40));
                put(v,"load",pid(0x04,1,(a,b)->a*100.0/255.0));
                put(v,"trim",pid(0x06,1,(a,b)->a*100.0/128.0-100));
                put(v,"ltft",pid(0x07,1,(a,b)->a*100.0/128.0-100));
                put(v,"map",pid(0x0B,1,(a,b)->a));
                put(v,"maf",pid(0x10,2,(a,b)->((a*256+b)/100.0)));
                put(v,"iat",pid(0x0F,1,(a,b)->a-40));
                put(v,"throttle",pid(0x11,1,(a,b)->a*100.0/255.0));
                put(v,"timing",pid(0x0E,1,(a,b)->a/2.0-64));
                put(v,"voltage",pid(0x42,2,(a,b)->((a*256+b)/1000.0)));
                v.put("source","ELM327"); v.put("ts",System.currentTimeMillis());
                js("window.onNativeData && window.onNativeData(" + v.toString() + ")");
            } catch (Exception e) {
                state("error", "Se interrumpió la lectura: " + shortError(e));
                streaming = false; break;
            }
            try { Thread.sleep(700); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); break; }
        }
    }
    private interface Decode { double apply(int a,int b); }
    private Double pid(int id, int bytes, Decode decode) throws Exception {
        String response = command(String.format(Locale.US,"01%02X",id), 1800);
        List<Integer> tokens = hexTokens(response);
        for (int i=0;i+2<tokens.size();i++) {
            if (tokens.get(i)==0x41 && tokens.get(i+1)==id && i+2+bytes<=tokens.size()) {
                int a=tokens.get(i+2), b=bytes>1?tokens.get(i+3):0;
                return decode.apply(a,b);
            }
        }
        return null;
    }
    private void put(JSONObject obj,String key,Double value) throws Exception { if(value==null) obj.put(key,JSONObject.NULL); else obj.put(key,Math.round(value*100.0)/100.0); }
    private List<Integer> hexTokens(String text) {
        List<Integer> out = new ArrayList<>();
        Matcher m=Pattern.compile("(?i)(?<![0-9A-F])[0-9A-F]{2}(?![0-9A-F])").matcher(text.replace("SEARCHING...",""));
        while(m.find()) { try { out.add(Integer.parseInt(m.group(),16)); } catch(Exception ignored){} }
        return out;
    }

    private void readDtcs() {
        if (!connected()) { state("error","Conectá el ELM327 antes de consultar DTC."); return; }
        io.execute(() -> {
            try {
                JSONArray list = new JSONArray();
                addDtcs(list,command("03",2500),"Confirmado");
                addDtcs(list,command("07",2500),"Pendiente");
                addDtcs(list,command("0A",2500),"Permanente");
                js("window.onNativeDtcs && window.onNativeDtcs("+list.toString()+")");
                state("connected", "Consulta DTC finalizada · "+list.length()+" código(s)");
            } catch(Exception e) { state("error","No se pudieron leer los DTC: "+shortError(e)); }
        });
    }
    private void addDtcs(JSONArray target,String response,String status) throws Exception {
        List<Integer> b=hexTokens(response);
        int service=status.equals("Confirmado")?0x43:status.equals("Pendiente")?0x47:0x4A;
        for(int i=0;i+2<b.size();i++) if(b.get(i)==service) {
            int j=i+1;
            while(j+1<b.size()) {
                int a=b.get(j), c=b.get(j+1); j+=2;
                if(a==0 && c==0) continue;
                int type=(a>>6)&3; char prefix="PCBU".charAt(type);
                int digit=(a>>4)&3, d1=a&15, d2=(c>>4)&15, d3=c&15;
                String code=String.format(Locale.US,"%c%d%X%X%X",prefix,digit,d1,d2,d3);
                JSONObject item=new JSONObject();item.put("code",code);item.put("status",status);target.put(item);
            }
            break;
        }
    }

    private void readIdentity() {
        if (!connected()) { state("error","Conectá el ELM327 antes de consultar Mode 09."); return; }
        io.execute(() -> {
            try {
                JSONObject data=new JSONObject();
                data.put("vin",asciiInfo(command("0902",3000),0x02));
                data.put("calId",asciiInfo(command("0904",3000),0x04));
                data.put("cvn",hexInfo(command("0906",3000),0x06));
                data.put("ecuName",asciiInfo(command("090A",3000),0x0A));
                data.put("protocol",clean(command("ATDP",1200)));
                js("window.onNativeIdentity && window.onNativeIdentity("+data.toString()+")");
                state("connected","Mode 09 consultado · respuesta del vehículo");
            } catch(Exception e) { state("error","No se pudo completar Mode 09: "+shortError(e)); }
        });
    }
    private String asciiInfo(String response,int pid) {
        StringBuilder bytes=new StringBuilder();
        String[] lines=response.split("\\r?\\n");
        for(String line:lines) {
            line=line.trim(); if(line.isEmpty() || line.matches("(?i)^[0-9A-F]{3,4}$")) continue;
            line=line.replaceFirst("^\\d+\\s*:\\s*","");
            List<Integer> ts=hexTokens(line);
            if(ts.size()>=2 && ts.get(0)==0x49 && ts.get(1)==pid) {
                ts=new ArrayList<>(ts.subList(2,ts.size()));
                if(!ts.isEmpty() && (ts.get(0)==1 || ts.get(0)==0)) ts.remove(0);
            }
            for(Integer x:ts) if(x>=0x20 && x<=0x7e) bytes.append((char)x);
        }
        String result=bytes.toString().replaceAll("[^A-Za-z0-9]","").trim();
        return result.isEmpty()?"":result;
    }
    private String hexInfo(String response,int pid) {
        List<Integer> ts=hexTokens(response); StringBuilder out=new StringBuilder();
        for(int i=0;i+1<ts.size();i++) if(ts.get(i)==0x49&&ts.get(i+1)==pid) {
            for(int j=i+2;j<ts.size()&&j<i+10;j++) out.append(String.format(Locale.US,"%02X",ts.get(j)));
            break;
        }
        return out.toString();
    }
    private boolean connected(){return socket!=null&&socket.isConnected();}
    private String clean(String s){return s==null?"":s.replaceAll("[\\r\\n]+"," ").trim();}
    private String shortError(Exception e){String m=e.getMessage();return m==null?e.getClass().getSimpleName():m;}
    private synchronized void closeSocket(){try{if(socket!=null)socket.close();}catch(Exception ignored){} socket=null;input=null;output=null;}
    private void stopStream(){streaming=false;state(connected()?"connected":"idle",connected()?"ELM conectado · lectura pausada":"Sin conexión");}

    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==REQ_BT_CONNECT){ if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED) showPairedDevices(); else state("error","Permiso Bluetooth denegado. Habilitalo para conectar el ELM327."); }
    }
    @Override protected void onDestroy(){streaming=false;closeSocket();io.shutdownNow();poller.shutdownNow();if(web!=null)web.destroy();super.onDestroy();}

    private class NativeBridge {
        @JavascriptInterface public void selectAdapter(){runOnUiThread(()->ensurePermissionAndSelect());}
        @JavascriptInterface public void startStream(){if(!connected()){state("error","Primero conectá el ELM327.");return;}if(streaming)return;streaming=true;state("connected","Lectura OBD en vivo · Bluetooth SPP");poller.execute(()->pollLoop());}
        @JavascriptInterface public void stopStream(){MainActivity.this.stopStream();}
        @JavascriptInterface public void scanDtcs(){readDtcs();}
        @JavascriptInterface public void readVehicleInfo(){readIdentity();}
        @JavascriptInterface public void openBluetoothSettings(){runOnUiThread(()->startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)));}
    }
}
