package com.ebyzom.ebyfit.ui.screens

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ebyzom.ebyfit.R
import com.ebyzom.ebyfit.auth.FirebaseAuthManager
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.EbyfitButton
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors

@Composable
fun LoginScreen(
    auth: FirebaseAuthManager,
    feedback: FeedbackManager,
) {
    val c = LocalEbyfitColors.current
    val view = LocalView.current

    var isSignUp by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(
            painter = painterResource(R.drawable.logo),
            contentDescription = "EbyFit",
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .size(120.dp)
                .clip(RoundedCornerShape(28.dp)),
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = if (isSignUp) "Crea tu cuenta" else "Inicia sesión",
                color = c.foreground,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = if (isSignUp) "Guarda tu progreso en la nube" else "Bienvenido de nuevo",
                color = c.muted,
                fontSize = 14.sp,
            )
        }

        if (!auth.isConfigured) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(c.warning.copy(alpha = 0.15f))
                    .border(1.dp, c.warning, RoundedCornerShape(16.dp))
                    .padding(14.dp),
            ) {
                Text(
                    text = "Firebase no está configurado en esta instalación.",
                    color = c.warning,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        if (error != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(c.error.copy(alpha = 0.15f))
                    .border(1.dp, c.error, RoundedCornerShape(16.dp))
                    .padding(14.dp),
            ) {
                Text(text = error ?: "", color = c.error, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        if (isSignUp) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nombre") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
            )
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Correo electrónico") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
        )

        EbyfitButton(
            label = if (busy) "Conectando…" else if (isSignUp) "Crear cuenta" else "Entrar",
            onClick = {
                if (busy) return@EbyfitButton
                error = null
                if (email.isBlank() || password.isBlank() || (isSignUp && name.isBlank())) {
                    error = "Completa todos los campos."
                    feedback.play(Sfx.TAP)
                    feedback.haptic(view)
                    return@EbyfitButton
                }
                busy = true
                val onResult: (Result<*>)->Unit = { result ->
                    busy = false
                    result.fold(
                        onSuccess = {
                            feedback.play(Sfx.SUCCESS)
                            feedback.haptic(view, strong = true)
                        },
                        onFailure = { t ->
                            feedback.play(Sfx.TAP)
                            feedback.haptic(view, strong = true)
                            error = t.message?.takeIf { m -> m.isNotBlank() } ?: "No se pudo completar la operación."
                        },
                    )
                }
                if (isSignUp) {
                    auth.signUp(name, email, password) { r -> onResult(r) }
                } else {
                    auth.signIn(email, password) { r -> onResult(r) }
                }
            },
            feedback = feedback,
            sfx = Sfx.SELECT,
        )

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = if (isSignUp) "¿Ya tienes cuenta? " else "¿No tienes cuenta? ",
                color = c.muted,
                fontSize = 13.sp,
            )
            Text(
                text = if (isSignUp) "Inicia sesión" else "Crea una",
                color = c.primary,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .padding(4.dp)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                    ) {
                        isSignUp = !isSignUp
                        error = null
                        feedback.play(Sfx.TOGGLE)
                        feedback.haptic(view)
                    },
            )
        }

        Text(
            text = "Tus datos siempre quedan en el dispositivo si no conectas una cuenta.",
            color = c.muted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(8.dp))
    }
}
