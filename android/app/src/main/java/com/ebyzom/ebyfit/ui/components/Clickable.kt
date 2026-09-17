package com.ebyzom.ebyfit.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier

/** Wrapper de clickable: los sonidos/vibración se disparan dentro del onClick de cada componente. */
fun Modifier.clickableWithSound(onClick: () -> Unit): Modifier =
    this.clickable(interactionSource = MutableInteractionSource(), indication = null, onClick = onClick)
