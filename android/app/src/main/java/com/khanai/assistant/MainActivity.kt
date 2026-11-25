package com.khanai.assistant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color
import com.khanai.assistant.ui.MainChatScreen

class MainActivity : ComponentActivity() {
    private val viewModel: KhanAiViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme(
                    primary = Color(0xFF0F766E),
                    secondary = Color(0xFF0F172A),
                    background = Color(0xFFF8FAFC),
                    surface = Color.White
                )
            ) {
                MainChatScreen(viewModel = viewModel)
            }
        }
    }
}
