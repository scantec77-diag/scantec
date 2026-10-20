package ar.com.scantec.diagnostico;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

/**
 * Scantec launcher: Google OAuth in Android WebView is unreliable and
 * Google blocks embedded user agents. Use the system browser so Firebase
 * Auth can retain its own cookies and session storage safely.
 */
public final class MainActivity extends Activity {
    private static final Uri SCANTEC_URL =
        Uri.parse("https://scantec77-diag.github.io/scantec/");

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, SCANTEC_URL);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this,
                "No se pudo abrir Scantec. Instalá o habilitá Chrome.",
                Toast.LENGTH_LONG).show();
        }
        finish();
    }
}
