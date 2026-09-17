package com.ebyzom.ebyfit.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.FitnessCenter
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navOptions
import com.ebyzom.ebyfit.ads.BannerAd
import com.ebyzom.ebyfit.auth.FirebaseAuthManager
import com.ebyzom.ebyfit.data.FitnessRepository
import com.ebyzom.ebyfit.data.SettingsRepository
import com.ebyzom.ebyfit.feedback.FeedbackManager
import com.ebyzom.ebyfit.feedback.Sfx
import com.ebyzom.ebyfit.ui.components.clickableWithSound
import com.ebyzom.ebyfit.ui.screens.CheckInScreen
import com.ebyzom.ebyfit.ui.screens.ClassesScreen
import com.ebyzom.ebyfit.ui.screens.HomeScreen
import com.ebyzom.ebyfit.ui.screens.LoginScreen
import com.ebyzom.ebyfit.ui.screens.PlanScreen
import com.ebyzom.ebyfit.ui.screens.ProfileScreen
import com.ebyzom.ebyfit.ui.screens.ProgressScreen
import com.ebyzom.ebyfit.ui.theme.LocalEbyfitColors

object Routes {
    const val HOME = "home"
    const val CLASSES = "classes"
    const val PLAN = "plan"
    const val PROGRESS = "progress"
    const val PROFILE = "profile"
    const val LOGIN = "login"
    const val CHECK_IN = "checkin"
}

private data class TabSpec(val route: String, val label: String, val icon: ImageVector, val iconOutlined: ImageVector)

@Composable
fun EbyfitApp(
    fitness: FitnessRepository,
    settings: SettingsRepository,
    feedback: FeedbackManager,
    auth: FirebaseAuthManager,
) {
    val colors = LocalEbyfitColors.current
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val view = LocalView.current

    val tabs = listOf(
        TabSpec(Routes.HOME, "Inicio", Icons.Filled.Home, Icons.Outlined.Home),
        TabSpec(Routes.CLASSES, "Clases", Icons.Filled.FitnessCenter, Icons.Outlined.FitnessCenter),
        TabSpec(Routes.PLAN, "Plan", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth),
        TabSpec(Routes.PROGRESS, "Progreso", Icons.Filled.BarChart, Icons.Outlined.BarChart),
        TabSpec(Routes.PROFILE, "Perfil", Icons.Filled.Person, Icons.Outlined.Person),
    )

    Scaffold(
        containerColor = colors.background,
        bottomBar = {
            if (tabs.any { it.route == currentRoute }) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    BannerAd()
                    Row(
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                            .clip(RoundedCornerShape(26.dp))
                            .background(colors.surface)
                            .border(1.dp, colors.border, RoundedCornerShape(26.dp))
                            .padding(vertical = 8.dp),
                    ) {
                        tabs.forEach { tab ->
                            val selected = currentRoute == tab.route
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(18.dp))
                                    .clickableWithSound {
                                        feedback.play(Sfx.TAP)
                                        feedback.haptic(view)
                                        navController.navigate(
                                            tab.route,
                                            navOptions {
                                                popUpTo(navController.graph.startDestinationId) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            },
                                        )
                                    }
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                            ) {
                                Icon(
                                    imageVector = if (selected) tab.icon else tab.iconOutlined,
                                    contentDescription = tab.label,
                                    tint = if (selected) colors.primary else colors.muted,
                                    modifier = Modifier.size(22.dp),
                                )
                                Text(
                                    text = tab.label,
                                    color = if (selected) colors.primary else colors.muted,
                                    fontSize = 11.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                )
                                Box(
                                    modifier = Modifier
                                        .padding(top = 3.dp)
                                        .size(width = 16.dp, height = 3.dp)
                                        .clip(RoundedCornerShape(50))
                                        .background(if (selected) colors.primary else colors.primary.copy(alpha = 0f)),
                                )
                            }
                        }
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    fitness = fitness,
                    settings = settings,
                    feedback = feedback,
                    onOpenProfile = { navController.navigate(Routes.PROFILE) },
                    onOpenPlan = { navController.navigate(Routes.PLAN) },
                    onOpenClasses = { navController.navigate(Routes.CLASSES) },
                    onOpenCheckIn = { navController.navigate(Routes.CHECK_IN) },
                )
            }
            composable(Routes.CLASSES) {
                ClassesScreen(
                    fitness = fitness,
                    auth = auth,
                    feedback = feedback,
                    onNeedLogin = { navController.navigate(Routes.LOGIN) },
                )
            }
            composable(Routes.PLAN) {
                PlanScreen(fitness, feedback)
            }
            composable(Routes.CHECK_IN) {
                CheckInScreen(fitness, feedback, onSaved = { navController.navigate(Routes.PROGRESS) })
            }
            composable(Routes.PROGRESS) {
                ProgressScreen(fitness, feedback)
            }
            composable(Routes.PROFILE) {
                ProfileScreen(settings, feedback, auth, onGoLogin = { navController.navigate(Routes.LOGIN) })
            }
            composable(Routes.LOGIN) {
                LoginScreen(auth, feedback)
            }
        }
    }
}
