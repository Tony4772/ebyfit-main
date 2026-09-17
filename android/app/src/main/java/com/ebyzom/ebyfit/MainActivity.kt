package com.ebyzom.ebyfit

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ebyzom.ebyfit.auth.FirebaseAuthManager
import com.ebyzom.ebyfit.data.FitnessRepository
import com.ebyzom.ebyfit.data.SettingsRepository
import com.ebyzom.ebyfit.data.ThemeMode
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.ui.EbyfitApp
import com.ebyzom.ebyfit.ui.theme.EbyfitTheme
import com.google.android.gms.ads.MobileAds

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        MobileAds.initialize(this)

        val settings = SettingsRepository(applicationContext)
        val fitness = FitnessRepository(applicationContext)
        val feedback = FeedbackManager(applicationContext, settings)
        val auth = FirebaseAuthManager(applicationContext)

        setContent {
            val themeMode by settings.themeMode.collectAsStateWithLifecycle(initialValue = ThemeMode.SYSTEM)
            EbyfitTheme(darkTheme = when (themeMode) {
                ThemeMode.SYSTEM -> null
                ThemeMode.LIGHT -> false
                ThemeMode.DARK -> true
            }) {
                EbyfitApp(
                    fitness = fitness,
                    settings = settings,
                    feedback = feedback,
                    auth = auth,
                )
            }
        }
    }
}
