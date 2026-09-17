package com.ebyzom.ebyfit.ads

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView

@Composable
fun BannerAd(
    modifier: Modifier = Modifier,
    adUnitId: String = AdMobConfig.bannerAdUnitId,
) {
    val context = LocalContext.current
    val widthDp = LocalConfiguration.current.screenWidthDp

    AndroidView(
        modifier = modifier
            .fillMaxWidth()
            .wrapContentHeight(),
        factory = { ctx ->
            AdView(ctx).apply {
                setAdSize(AdSize.getLargeAnchoredAdaptiveBannerAdSize(ctx, widthDp))
                this.adUnitId = adUnitId
                loadAd(AdRequest.Builder().build())
            }
        },
        onRelease = { adView ->
            adView.destroy()
        },
    )
}
