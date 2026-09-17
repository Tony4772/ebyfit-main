package com.ebyzom.ebyfit.ui.theme

import androidx.compose.ui.graphics.Color

fun color(rgb: Long): Color = Color(0xFF000000L or rgb)

fun luminanceOf(c: Color): Float = 0.2126f * c.red + 0.7152f * c.green + 0.0722f * c.blue
