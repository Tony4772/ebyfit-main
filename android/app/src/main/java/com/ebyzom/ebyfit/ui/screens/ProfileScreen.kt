package com.ebyzom.ebyfit.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ebyzom.ebyfit.auth.FirebaseAuthManager
import com.ebyzom.ebyfit.data.GymCatalog
import com.ebyzom.ebyfit.data.SettingsRepository
import com.ebyzom.ebyfit.data.ThemeMode
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.EbyfitButton
import com.ebyzom.ebyfit.ui.components.ScreenHeader
import com.ebyzom.ebyfit.ui.components.SectionCard
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors

@Composable
fun ProfileScreen(
    settings: SettingsRepository,
    feedback: FeedbackManager,
    auth: FirebaseAuthManager,
    onGoLogin: () -> Unit,
) {
    val themeMode by settings.themeMode.collectAsStateWithLifecycle(initialValue = ThemeMode.SYSTEM)
    val soundOn by settings.soundOn.collectAsStateWithLifecycle(initialValue = true)
    val hapticsOn by settings.hapticsOn.collectAsStateWithLifecycle(initialValue = true)
    val user by auth.user.collectAsStateWithLifecycle()
    val c = LocalEbyfitColors.current
    val view = LocalView.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ScreenHeader(title = "Perfil", subtitle = "Tu cuenta y preferencias")

        // Cuenta
        SectionCard {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(
                    imageVector = Icons.Filled.AccountCircle,
                    contentDescription = null,
                    tint = c.primary,
                    modifier = Modifier.size(44.dp),
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user?.displayName?.takeIf { it.isNotBlank() } ?: user?.email ?: "Invitado",
                        color = c.foreground,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = if (user != null) {
                            "${user!!.email} · Membresía Pro · ${GymCatalog.branchName}"
                        } else {
                            "Inicia sesión para sincronizar con Firebase"
                        },
                        color = c.muted,
                        fontSize = 12.sp,
                        maxLines = 2,
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
            if (user != null) {
                EbyfitButton(
                    label = "Cerrar sesión",
                    onClick = {
                        feedback.play(Sfx.TOGGLE)
                        auth.signOut()
                    },
                    feedback = feedback,
                    container = c.border,
                    content = c.foreground,
                )
            } else if (auth.isConfigured) {
                EbyfitButton(
                    label = "Conectar cuenta Firebase",
                    onClick = onGoLogin,
                    feedback = feedback,
                    sfx = Sfx.WHOOSH,
                )
            } else {
                Text(
                    text = "Firebase no está disponible. Revisa google-services.json.",
                    color = c.muted,
                    fontSize = 12.sp,
                )
            }
        }

        SectionCard {
            Text("Membresías", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            GymCatalog.memberships.forEach { plan ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (plan.highlighted) c.primary.copy(alpha = 0.18f) else c.background)
                        .border(1.dp, if (plan.highlighted) c.primary else c.border, RoundedCornerShape(14.dp))
                        .padding(12.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(plan.name, color = c.foreground, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text(plan.priceLabel, color = c.primary, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(6.dp))
                    plan.perks.forEach { perk ->
                        Text("· $perk", color = c.muted, fontSize = 12.sp)
                    }
                }
            }
        }

        // Tema
        SectionCard {
            Text(text = "Tema", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ThemeMode.entries.forEach { mode ->
                    val selected = themeMode == mode
                    val label = when (mode) {
                        ThemeMode.SYSTEM -> "Auto"
                        ThemeMode.LIGHT -> "Claro"
                        ThemeMode.DARK -> "Oscuro"
                    }
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (selected) c.primary else c.surface)
                            .border(1.dp, if (selected) c.primary else c.border, RoundedCornerShape(12.dp))
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                            ) {
                                feedback.play(Sfx.TOGGLE)
                                feedback.haptic(view)
                                settings.setThemeMode(mode)
                            }
                            .padding(vertical = 10.dp),
                    ) {
                        Text(
                            text = label,
                            color = if (selected) Color(0xFF0B0F0D) else c.muted,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        }

        // Sonido y vibración
        SectionCard {
            Text(text = "Sonido y vibración", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            LabeledToggle(
                label = "Efectos de sonido",
                checked = soundOn,
                onChecked = {
                    feedback.play(Sfx.TOGGLE)
                    settings.setSoundOn(it)
                },
            )
            LabeledToggle(
                label = "Vibración",
                checked = hapticsOn,
                onChecked = {
                    feedback.play(Sfx.TOGGLE)
                    feedback.haptic(view)
                    settings.setHapticsOn(it)
                },
            )
        }

        Text(
            text = "EBYFIT · juntos por la vida · v1.0",
            color = c.muted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun LabeledToggle(label: String, checked: Boolean, onChecked: (Boolean) -> Unit) {
    val c = LocalEbyfitColors.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(text = label, color = c.foreground, fontSize = 14.sp, modifier = Modifier.weight(1f))
        Box(
            contentAlignment = if (checked) Alignment.CenterEnd else Alignment.CenterStart,
            modifier = Modifier
                .size(width = 52.dp, height = 30.dp)
                .clip(CircleShape)
                .background(if (checked) c.primary else c.border)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                ) { onChecked(!checked) },
        ) {
            Box(
                modifier = Modifier
                    .padding(3.dp)
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(Color.White),
            )
        }
    }
}
