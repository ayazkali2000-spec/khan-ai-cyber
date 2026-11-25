package com.khanai.assistant.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.outlined.DeleteSweep
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Stop
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.khanai.assistant.KhanAiViewModel
import com.khanai.assistant.agents.AssistantMode

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainChatScreen(viewModel: KhanAiViewModel) {
    val context = LocalContext.current
    val messages by viewModel.messages.collectAsState()
    val currentMode by viewModel.activeMode.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val isStreaming by viewModel.isStreaming.collectAsState()
    val errorText by viewModel.errorMessage.collectAsState()

    var inputText by remember { mutableStateOf("") }
    var isListening by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }
    var showAbout by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()

    val micPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            isListening = true
            viewModel.startVoiceInput(
                localeTag = settings.voiceLocale,
                onPartial = { inputText = it },
                onFinal = { finalText ->
                    inputText = finalText
                    isListening = false
                },
                onError = { isListening = false }
            )
        }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    Scaffold(
        containerColor = Color(0xFFF8FAFC),
        topBar = {
            Column(modifier = Modifier.background(Color(0xFF0F172A))) {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF0F172A),
                        titleContentColor = Color.White,
                        actionIconContentColor = Color.White
                    ),
                    title = {
                        Column {
                            Text(
                                text = "KHAN AI",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Developed by: ایاز احمد خان",
                                fontSize = 11.sp,
                                color = Color(0xFF5EEAD4)
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.clearCurrentModeChat() }) {
                            Icon(Icons.Outlined.DeleteSweep, contentDescription = "Clear chat")
                        }
                        IconButton(onClick = { showSettings = true }) {
                            Icon(Icons.Outlined.Settings, contentDescription = "API & Server Settings")
                        }
                        IconButton(onClick = { showAbout = true }) {
                            Icon(Icons.Outlined.Info, contentDescription = "About KHAN AI")
                        }
                    }
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AssistantMode.entries.forEach { mode ->
                        val selected = mode == currentMode
                        FilterChip(
                            selected = selected,
                            onClick = { viewModel.selectMode(mode) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFF0F766E),
                                selectedLabelColor = Color.White,
                                containerColor = Color(0xFF1E293B),
                                labelColor = Color(0xFFCBD5E1)
                            ),
                            label = {
                                Text(
                                    text = if (settings.voiceLocale.startsWith("ur")) mode.labelUr else mode.labelEn,
                                    fontSize = 12.sp
                                )
                            }
                        )
                    }
                }
            }
        },
        bottomBar = {
            Surface(color = Color.White, shadowElevation = 4.dp) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    HorizontalDivider(color = Color(0xFFE2E8F0))

                    if (!errorText.isNullOrBlank()) {
                        Text(
                            text = errorText.orEmpty(),
                            color = Color(0xFFB91C1C),
                            fontSize = 12.sp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFFEF2F2))
                                .padding(horizontal = 14.dp, vertical = 6.dp)
                        )
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                if (isListening) {
                                    viewModel.stopVoiceInput()
                                    isListening = false
                                } else {
                                    val hasPermission = ContextCompat.checkSelfPermission(
                                        context,
                                        Manifest.permission.RECORD_AUDIO
                                    ) == PackageManager.PERMISSION_GRANTED
                                    if (hasPermission) {
                                        isListening = true
                                        viewModel.startVoiceInput(
                                            localeTag = settings.voiceLocale,
                                            onPartial = { inputText = it },
                                            onFinal = { finalText ->
                                                inputText = finalText
                                                isListening = false
                                            },
                                            onError = { isListening = false }
                                        )
                                    } else {
                                        micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                    }
                                }
                            },
                            modifier = Modifier.size(44.dp)
                        ) {
                            Icon(
                                imageVector = if (isListening) Icons.Outlined.Stop else Icons.Outlined.Mic,
                                contentDescription = if (isListening) "Stop voice input" else "Voice input",
                                tint = if (isListening) Color(0xFFDC2626) else Color(0xFF0F766E)
                            )
                        }

                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = {
                                Text(
                                    text = if (settings.voiceLocale.startsWith("ur"))
                                        "اردو یا انگریزی میں پیغام لکھیں..."
                                    else
                                        "Message KHAN AI...",
                                    fontSize = 14.sp
                                )
                            },
                            maxLines = 4,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )

                        IconButton(
                            enabled = inputText.isNotBlank() && !isStreaming,
                            onClick = {
                                val prompt = inputText.trim()
                                inputText = ""
                                viewModel.sendMessage(prompt)
                            },
                            modifier = Modifier.size(44.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Send message",
                                tint = if (inputText.isNotBlank() && !isStreaming) Color(0xFF0F766E) else Color(0xFF94A3B8)
                            )
                        }
                    }

                    Text(
                        text = "KHAN AI · Developed by: ایاز احمد خان",
                        fontSize = 11.sp,
                        color = Color(0xFF64748B),
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .padding(bottom = 8.dp)
                    )
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(vertical = 8.dp)
        ) {
            if (messages.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "KHAN AI",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0F172A)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Developed by: ایاز احمد خان",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF0F766E)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Say Salam/Hi, paste code to debug, or ask for defensive cyber safety help. Configure your free Gemini API key or local Ollama URL in Settings.",
                            fontSize = 13.sp,
                            color = Color(0xFF475569)
                        )
                    }
                }
            } else {
                items(messages, key = { it.id }) { msg ->
                    MessageBubble(
                        message = msg,
                        onSpeakClick = { text -> viewModel.speakReply(text, settings.voiceLocale) }
                    )
                }
            }
        }
    }

    if (showSettings) {
        SettingsSheet(
            current = settings,
            onSave = { viewModel.saveSettings(it) },
            onDismiss = { showSettings = false }
        )
    }

    if (showAbout) {
        AboutDialog(onDismiss = { showAbout = false })
    }
}
