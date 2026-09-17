package com.ebyzom.ebyfit.auth

import android.content.Context
import com.ebyzom.ebyfit.data.CloudSyncRepository
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Autenticación Firebase (email/contraseña) usando google-services.json.
 */
class FirebaseAuthManager(context: Context) {

    private val appContext = context.applicationContext
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val cloud = CloudSyncRepository()

    val isConfigured: Boolean = try {
        if (FirebaseApp.getApps(appContext).isEmpty()) {
            FirebaseApp.initializeApp(appContext) != null
        } else {
            true
        }
    } catch (_: Throwable) {
        false
    }

    private val firebaseAuth: FirebaseAuth? =
        if (isConfigured) FirebaseAuth.getInstance() else null

    private val _user = MutableStateFlow<FirebaseUser?>(null)
    val user: StateFlow<FirebaseUser?> = _user.asStateFlow()

    init {
        firebaseAuth?.addAuthStateListener { auth -> _user.value = auth.currentUser }
        _user.value = firebaseAuth?.currentUser
    }

    fun signIn(email: String, password: String, onResult: (Result<FirebaseUser>) -> Unit) {
        val auth = firebaseAuth
        if (auth == null) {
            onResult(Result.failure(IllegalStateException(NOT_CONFIGURED_MESSAGE)))
            return
        }
        auth.signInWithEmailAndPassword(email.trim(), password)
            .addOnSuccessListener { result ->
                val user = result.user!!
                scope.launch {
                    runCatching { cloud.upsertUserProfile(user.displayName, user.email) }
                }
                onResult(Result.success(user))
            }
            .addOnFailureListener { onResult(Result.failure(it)) }
    }

    fun signUp(name: String, email: String, password: String, onResult: (Result<FirebaseUser>) -> Unit) {
        val auth = firebaseAuth
        if (auth == null) {
            onResult(Result.failure(IllegalStateException(NOT_CONFIGURED_MESSAGE)))
            return
        }
        auth.createUserWithEmailAndPassword(email.trim(), password)
            .addOnSuccessListener { result ->
                val user = result.user
                if (user == null) {
                    onResult(Result.failure(IllegalStateException("No se pudo crear la cuenta.")))
                    return@addOnSuccessListener
                }
                val profile = UserProfileChangeRequest.Builder()
                    .setDisplayName(name.trim())
                    .build()
                user.updateProfile(profile).addOnCompleteListener {
                    scope.launch {
                        runCatching { cloud.upsertUserProfile(name.trim(), user.email) }
                    }
                    onResult(Result.success(user))
                }
            }
            .addOnFailureListener { onResult(Result.failure(it)) }
    }

    fun sendPasswordReset(email: String, onResult: (Result<Unit>) -> Unit) {
        val auth = firebaseAuth
        if (auth == null) {
            onResult(Result.failure(IllegalStateException(NOT_CONFIGURED_MESSAGE)))
            return
        }
        auth.sendPasswordResetEmail(email.trim())
            .addOnSuccessListener { onResult(Result.success(Unit)) }
            .addOnFailureListener { onResult(Result.failure(it)) }
    }

    fun signOut() {
        firebaseAuth?.signOut()
    }

    private companion object {
        const val NOT_CONFIGURED_MESSAGE =
            "Firebase no está configurado en esta instalación."
    }
}
