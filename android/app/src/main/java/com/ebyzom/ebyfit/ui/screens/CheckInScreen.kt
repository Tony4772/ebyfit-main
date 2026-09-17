package com.ebyzom.ebyfit.ui.screens

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ebyzom.ebyfit.data.FitnessCalculations
import com.ebyzom.ebyfit.data.FitnessRepository
import com.ebyzom.ebyfit.data.Mood
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.EbyfitButton
import com.ebyzom.ebyfit.ui.components.MoodChip
import com.ebyzom.ebyfit.ui.components.ScreenHeader
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors

@Composable
fun CheckInScreen(
    fitness: FitnessRepository,
    feedback: FeedbackManager,
    onSaved: () -> Unit,
) {
    val state by fitness.state.collectAsStateWithLifecycle()
    val c = LocalEbyfitColors.current
    val view = LocalView.current
    val todayKey = remember { FitnessCalculations.todayKey() }
    val existing = state.checkIns[todayKey]

    var mood by remember { mutableStateOf(existing?.mood ?: Mood.BIEN) }
    var energy by remember { mutableStateOf(existing?.energy ?: 3) }
    var note by remember { mutableStateOf(existing?.note ?: "") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ScreenHeader(title = "Check-in diario", subtitle = "¿Cómo va todo hoy?")

        // Ánimo
        Column {
            Text(text = "¿Cómo te sientes?", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(10.dp))
            // 4 chips en 2 filas
            Mood.values().forEachIndexed { index, m ->
                if (index % 2 == 0) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        MoodChip(
                            label = m.label,
                            emoji = m.emoji,
                            selected = mood == m,
                            onClick = {
                                mood = m
                            },
                            feedback = feedback,
                        )
                        val next = Mood.values().getOrNull(index + 1)
                        if (next != null) {
                            MoodChip(
                                label = next.label,
                                emoji = next.emoji,
                                selected = mood == next,
                                onClick = {
                                    mood = next
                                },
                                feedback = feedback,
                            )
                        } else {
                            Spacer(Modifier.weight(1f))
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                }
            }
        }

        // Energía 1..5
        Column {
            Text(text = "Nivel de energía", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                (1..5).forEach { level ->
                    val selected = energy == level
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (selected) c.primary else c.surface)
                            .border(1.dp, if (selected) c.primary else c.border, RoundedCornerShape(14.dp))
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                            ) {
                                energy = level
                                feedback.play(Sfx.COUNTER)
                                feedback.haptic(view)
                                if (level == 5) {
                                    feedback.play(Sfx.STREAK)
                                    feedback.haptic(view, strong = true)
                                }
                            }
                            .padding(vertical = 14.dp),
                    ) {
                        Text(
                            text = "$level",
                            color = if (selected) Color(0xFF0B0F0D) else c.muted,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        }

        // Nota
        Column {
            Text(text = "Nota (opcional)", color = c.foreground, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            androidx.compose.material3.OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                placeholder = { Text("¿Algo que contar de hoy?", color = c.muted) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
            )
        }

        EbyfitButton(
            label = if (existing == null) "Guardar check-in" else "Actualizar check-in",
            onClick = {
                fitness.saveCheckIn(todayKey, mood, energy, note.trim())
                feedback.play(Sfx.SUCCESS)
                feedback.haptic(view, strong = true)
                onSaved()
            },
            feedback = feedback,
            sfx = Sfx.SUCCESS,
            strongHaptic = true,
        )
        Spacer(Modifier.height(8.dp))
    }
}

