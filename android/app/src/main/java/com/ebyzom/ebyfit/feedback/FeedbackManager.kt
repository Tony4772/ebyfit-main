package com.ebyzom.ebyfit.feedback

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.view.HapticFeedbackConstants
import android.view.View
import com.ebyzom.ebyfit.R
import com.ebyzom.ebyfit.data.SettingsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class Sfx { TAP, SELECT, TOGGLE, SUCCESS, STREAK, WHOOSH, COUNTER }

/**
 * Motor de feedback: sonidos sintetizados del proyecto + haptics del sistema.
 * Los volúmenes están calibrados igual que en lib/feedback/sounds.tsx.
 */
class FeedbackManager(private val context: Context, private val settings: SettingsRepository) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val soundPool: SoundPool = SoundPool.Builder()
        .setMaxStreams(4)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build(),
        )
        .build()

    private val sounds: Map<Sfx, Int>
    private val volumes: Map<Sfx, Float> = mapOf(
        Sfx.TAP to 0.45f,
        Sfx.SELECT to 0.5f,
        Sfx.TOGGLE to 0.55f,
        Sfx.SUCCESS to 0.6f,
        Sfx.STREAK to 0.7f,
        Sfx.WHOOSH to 0.35f,
        Sfx.COUNTER to 0.4f,
    )

    private val _soundOn = MutableStateFlow(true)
    val soundOn: StateFlow<Boolean> = _soundOn.asStateFlow()

    private val _hapticsOn = MutableStateFlow(true)
    val hapticsOn: StateFlow<Boolean> = _hapticsOn.asStateFlow()

    init {
        val loaded = mutableMapOf<Sfx, Int>()
        loaded[Sfx.TAP] = soundPool.load(context, R.raw.sfx_tap, 1)
        loaded[Sfx.SELECT] = soundPool.load(context, R.raw.sfx_select, 1)
        loaded[Sfx.TOGGLE] = soundPool.load(context, R.raw.sfx_toggle, 1)
        loaded[Sfx.SUCCESS] = soundPool.load(context, R.raw.sfx_success, 1)
        loaded[Sfx.STREAK] = soundPool.load(context, R.raw.sfx_streak, 1)
        loaded[Sfx.WHOOSH] = soundPool.load(context, R.raw.sfx_whoosh, 1)
        loaded[Sfx.COUNTER] = soundPool.load(context, R.raw.sfx_counter, 1)
        sounds = loaded

        scope.launch {
            settings.soundOn.collect { _soundOn.value = it }
        }
        scope.launch {
            settings.hapticsOn.collect { _hapticsOn.value = it }
        }
    }

    fun play(sfx: Sfx) {
        if (!_soundOn.value) return
        val id = sounds[sfx] ?: return
        val volume = volumes[sfx] ?: 0.5f
        soundPool.play(id, volume, volume, 1, 0, 1f)
    }

    /** Vibración ligera. [view] es cualquier vista de la jerarquía actual. */
    fun haptic(view: View?, strong: Boolean = false) {
        if (!_hapticsOn.value || view == null) return
        val constant = if (strong) {
            HapticFeedbackConstants.LONG_PRESS
        } else {
            HapticFeedbackConstants.VIRTUAL_KEY
        }
        view.performHapticFeedback(constant)
    }

    /** Sonido + vibración doble: para completar entrenamientos y guardar check-ins. */
    fun celebrate(view: View?) {
        play(Sfx.SUCCESS)
        haptic(view, strong = true)
        view?.postDelayed({ play(Sfx.STREAK) }, 160)
    }

    fun release() {
        soundPool.release()
    }
}
