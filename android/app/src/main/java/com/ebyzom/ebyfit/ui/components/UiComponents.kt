package com.ebyzom.ebyfit.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ebyzom.ebyfit.R
import com.ebyzom.ebyfit.data.Accent
import com.ebyzom.ebyfit.data.Workout
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.theme.EbyfitColors
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors
import com.ebyzom.ebyfit.ui.theme.primarySubtle

/** Botón primario con feedback: escala al presionar, sonido y vibración. */
@Composable
fun EbyfitButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    feedback: FeedbackManager? = null,
    sfx: Sfx = Sfx.TAP,
    strongHaptic: Boolean = false,
    container: Color? = null,
    content: Color? = null,
) {
    val c = LocalEbyfitColors.current
    val view = LocalView.current
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.95f else 1f,
        animationSpec = spring(dampingRatio = 0.55f, stiffness = 700f),
        label = "pressScale",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .scale(scale)
            .clip(RoundedCornerShape(18.dp))
            .background(container ?: c.primary)
            .clickableWithSound {
                feedback?.play(sfx)
                feedback?.haptic(view, strongHaptic)
                onClick()
            }
            .padding(vertical = 16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = content ?: Color(0xFF0B0F0D),
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

/** Tarjeta del catálogo de entrenamientos con imagen y borde por acento. */
@Composable
fun WorkoutCard(
    workout: Workout,
    complete: Boolean,
    onToggle: () -> Unit,
    feedback: FeedbackManager?,
    modifier: Modifier = Modifier,
) {
    val c = LocalEbyfitColors.current
    val view = LocalView.current
    val accent = when (workout.accent) {
        Accent.PRIMARY -> c.primary
        Accent.AQUA -> Color(0xFF6FD8C0)
        Accent.ORANGE -> Color(0xFFF2A45C)
    }
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.97f else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 600f),
        label = "cardScale",
    )
    Column(
        modifier = modifier
            .fillMaxWidth()
            .scale(scale)
            .clip(RoundedCornerShape(22.dp))
            .background(c.surface)
            .border(1.dp, if (complete) accent else c.border, RoundedCornerShape(22.dp))
            .clickableWithSound {
                pressed = true
                feedback?.play(Sfx.SELECT)
                feedback?.haptic(view)
                onToggle()
            },
    ) {
        Box {
            Image(
                painter = painterResource(workout.image),
                contentDescription = workout.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, c.background.copy(alpha = 0.85f)),
                        ),
                    ),
            )
            if (complete) {
                Box(
                    modifier = Modifier
                        .padding(12.dp)
                        .clip(RoundedCornerShape(50))
                        .background(accent)
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Text("Hecho ✓", color = Color(0xFF0B0F0D), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "${workout.category} · ${workout.duration} · ${workout.level}",
                color = c.muted,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(4.dp))
            Text(text = workout.title, color = c.foreground, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            workout.exercises.forEach { exercise ->
                Text(text = "• $exercise", color = c.muted, fontSize = 13.sp)
            }
        }
    }
}

/** Barra de progreso que se anima hasta [fraction] al entrar en pantalla. */
@Composable
fun AnimatedProgressBar(fraction: Float, modifier: Modifier = Modifier, barColor: Color? = null) {
    val c = LocalEbyfitColors.current
    val progress = remember { Animatable(0f) }
    LaunchedEffect(fraction) {
        progress.animateTo(fraction, animationSpec = tween(900))
    }
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(10.dp)
            .clip(RoundedCornerShape(50))
            .background(c.border),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(fraction = progress.value.coerceIn(0f, 1f))
                .height(10.dp)
                .clip(RoundedCornerShape(50))
                .background(
                    Brush.horizontalGradient(
                        listOf(barColor ?: c.primary, (barColor ?: c.primary).copy(alpha = 0.75f)),
                    ),
                ),
        )
    }
}

/** Chip de ánimo seleccionable. */
@Composable
fun MoodChip(
    label: String,
    emoji: String,
    selected: Boolean,
    onClick: () -> Unit,
    feedback: FeedbackManager?,
) {
    val c = LocalEbyfitColors.current
    val view = LocalView.current
    val background = if (selected) c.primarySubtle else c.surface
    val borderColor = if (selected) c.primary else c.border
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(background)
            .border(1.dp, borderColor, RoundedCornerShape(14.dp))
            .clickableWithSound {
                feedback?.play(Sfx.TOGGLE)
                feedback?.haptic(view)
                onClick()
            }
            .padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
        Text(text = emoji, fontSize = 16.sp)
        Spacer(Modifier.width(6.dp))
        Text(
            text = label,
            color = if (selected) c.foreground else c.muted,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
        )
    }
}

/** Celda de un día de la semana para la tira de progreso. */
@Composable
fun DayCell(label: String, active: Boolean, today: Boolean, modifier: Modifier = Modifier) {
    val c = LocalEbyfitColors.current
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(if (active) c.primary else c.surface)
                .border(1.dp, if (today) c.primary else c.border, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = if (active) "✓" else "",
                color = Color(0xFF0B0F0D),
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(text = label, color = if (today) c.primary else c.muted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

/** Cabecera estándar de pantalla con título y subtítulo. */
@Composable
fun ScreenHeader(title: String, subtitle: String? = null) {
    val c = LocalEbyfitColors.current
    Column {
        Text(text = title, color = c.foreground, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
        if (subtitle != null) {
            Spacer(Modifier.height(2.dp))
            Text(text = subtitle, color = c.muted, fontSize = 14.sp)
        }
    }
}

@Composable
fun SectionCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val c = LocalEbyfitColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(c.surface)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        content()
    }
}
