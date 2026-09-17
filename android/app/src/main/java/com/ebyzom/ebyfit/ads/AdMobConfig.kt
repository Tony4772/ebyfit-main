package com.ebyzom.ebyfit.ads

import com.ebyzom.ebyfit.BuildConfig

/**
 * IDs de AdMob configurados para EbyFit.
 * En debug se usan unidades de prueba de Google para no invalidar la cuenta.
 */
object AdMobConfig {
    /** ID de aplicación AdMob (AndroidManifest). */
    const val APPLICATION_ID = "ca-app-pub-7470413991742442~5763487162"

    /** Unidad de anuncio: Banner. */
    private const val BANNER_PRODUCTION = "ca-app-pub-7470413991742442/5017381707"

    /** Banner de prueba oficial de Google (solo debug). */
    private const val BANNER_TEST = "ca-app-pub-3940256099942544/9214589741"

    val bannerAdUnitId: String
        get() = if (BuildConfig.DEBUG) BANNER_TEST else BANNER_PRODUCTION
}
