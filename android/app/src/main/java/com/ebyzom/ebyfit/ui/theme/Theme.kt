package com.ebyzom.ebyfit.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf

@Immutable
data class EbyfitColors(
    val primary: androidx.compose.ui.graphics.Color,
    val background: androidx.compose.ui.graphics.Color,
    val surface: androidx.compose.ui.graphics.Color,
    val foreground: androidx.compose.ui.graphics.Color,
    val muted: androidx.compose.ui.graphics.Color,
    val border: androidx.compose.ui.graphics.Color,
    val success: androidx.compose.ui.graphics.Color,
    val warning: androidx.compose.ui.graphics.Color,
    val error: androidx.compose.ui.graphics.Color,
    val aqua: androidx.compose.ui.graphics.Color,
    val orange: androidx.compose.ui.graphics.Color,
    val lilac: androidx.compose.ui.graphics.Color,
)

private val LightColors = EbyfitColors(
    primary = color(0x8BE600),
    background = color(0xF7F9F5),
    surface = color(0xFFFFFF),
    foreground = color(0x132018),
    muted = color(0x66736B),
    border = color(0xDDE5DE),
    success = color(0x26B86C),
    warning = color(0xF29A3D),
    error = color(0xD95151),
    aqua = color(0xD9F3EA),
    orange = color(0xFFE1C3),
    lilac = color(0xE9E1FF),
)

private val DarkColors = EbyfitColors(
    primary = color(0x9CFE00),
    background = color(0x0B0F0D),
    surface = color(0x141B16),
    foreground = color(0xF5F7F4),
    muted = color(0x9AA69B),
    border = color(0x29332B),
    success = color(0x4DDF8C),
    warning = color(0xFFB15C),
    error = color(0xFF7777),
    aqua = color(0x214A3B),
    orange = color(0x5A351C),
    lilac = color(0x362A56),
)

/** Igual que theme.config.js: primary/subtle tienen variantes por esquema. */
private val LightPrimarySubtle = color(0xE9FBCB)
private val DarkPrimarySubtle = color(0x233D10)
private val LightPrimaryDeep = color(0x4C7A00)
private val DarkPrimaryDeep = color(0x86C200)

val EbyfitColors.primarySubtle: androidx.compose.ui.graphics.Color
    get() = if (luminanceOf(background) > 0.5f) LightPrimarySubtle else DarkPrimarySubtle

val EbyfitColors.primaryDeep: androidx.compose.ui.graphics.Color
    get() = if (luminanceOf(background) > 0.5f) LightPrimaryDeep else DarkPrimaryDeep

val LocalEbyfitColors = staticCompositionLocalOf { DarkColors }

@Composable
fun EbyfitTheme(
    darkTheme: Boolean?,
    content: @Composable () -> Unit,
) {
    val resolved = darkTheme ?: isSystemInDarkTheme()
    val colors = if (resolved) DarkColors else LightColors
    CompositionLocalProvider(LocalEbyfitColors provides colors) {
        androidx.compose.material3.MaterialTheme(content = content)
    }
}
