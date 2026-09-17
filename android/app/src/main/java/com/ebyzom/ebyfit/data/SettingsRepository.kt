package com.ebyzom.ebyfit.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

enum class ThemeMode { SYSTEM, LIGHT, DARK }

private val Context.settingsStore by preferencesDataStore(name = "ebyfit_settings")

class SettingsRepository(context: Context) {

    private val store = context.applicationContext.settingsStore
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _themeMode = MutableStateFlow(ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    private val _soundOn = MutableStateFlow(true)
    val soundOn: StateFlow<Boolean> = _soundOn.asStateFlow()

    private val _hapticsOn = MutableStateFlow(true)
    val hapticsOn: StateFlow<Boolean> = _hapticsOn.asStateFlow()

    init {
        scope.launch {
            val prefs = store.data.first()
            _themeMode.value = when (prefs[KEY_THEME]) {
                "light" -> ThemeMode.LIGHT
                "dark" -> ThemeMode.DARK
                else -> ThemeMode.SYSTEM
            }
            _soundOn.value = prefs[KEY_SOUND] ?: true
            _hapticsOn.value = prefs[KEY_HAPTICS] ?: true
        }
    }

    fun setThemeMode(mode: ThemeMode) {
        _themeMode.value = mode
        scope.launch { store.edit { it[KEY_THEME] = mode.name.lowercase() } }
    }

    fun setSoundOn(on: Boolean) {
        _soundOn.value = on
        scope.launch { store.edit { it[KEY_SOUND] = on } }
    }

    fun setHapticsOn(on: Boolean) {
        _hapticsOn.value = on
        scope.launch { store.edit { it[KEY_HAPTICS] = on } }
    }

    private companion object {
        val KEY_THEME = stringPreferencesKey("theme_mode")
        val KEY_SOUND = booleanPreferencesKey("sound_on")
        val KEY_HAPTICS = booleanPreferencesKey("haptics_on")
    }
}
