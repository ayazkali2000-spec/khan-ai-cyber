package com.khanai.assistant.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.khanai.assistant.storage.AiSettings

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(
    current: AiSettings,
    onSave: (AiSettings) -> Unit,
    onDismiss: () -> Unit
) {
    var provider by remember(current) { mutableStateOf(current.provider) }
    var geminiKey by remember(current) { mutableStateOf(current.geminiApiKey) }
    var geminiModel by remember(current) { mutableStateOf(current.geminiModel) }
    var ollamaUrl by remember(current) { mutableStateOf(current.ollamaBaseUrl) }
    var ollamaModel by remember(current) { mutableStateOf(current.ollamaModel) }
    var voiceLocale by remember(current) { mutableStateOf(current.voiceLocale) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            Text(
                text = "Zero-Cost Cloud & Backend Settings",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF0F172A)
            )
            Text(
                text = "Use Google Gemini free-tier API key or your own local/self-hosted Ollama URL.",
                fontSize = 12.sp,
                color = Color(0xFF475569)
            )

            Spacer(modifier = Modifier.height(14.dp))
            Text(text = "Active AI Provider", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = provider == "gemini",
                    onClick = { provider = "gemini" },
                    label = { Text("Google Gemini (Free Tier)") }
                )
                FilterChip(
                    selected = provider == "ollama",
                    onClick = { provider = "ollama" },
                    label = { Text("Local / Custom Ollama") }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))
            if (provider == "gemini") {
                OutlinedTextField(
                    value = geminiKey,
                    onValueChange = { geminiKey = it },
                    label = { Text("Gemini API Key") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = geminiModel,
                    onValueChange = { geminiModel = it },
                    label = { Text("Gemini Model (e.g. gemini-4-hydrogen)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            } else {
                OutlinedTextField(
                    value = ollamaUrl,
                    onValueChange = { ollamaUrl = it },
                    label = { Text("Ollama Server URL (e.g. http://192.168.1.10:11434)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = ollamaModel,
                    onValueChange = { ollamaModel = it },
                    label = { Text("Ollama Model (e.g. llama3.2:3b or qwen2.5:3b)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "Voice Input & Speech Locale", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = voiceLocale == "en-US",
                    onClick = { voiceLocale = "en-US" },
                    label = { Text("English (en-US)") }
                )
                FilterChip(
                    selected = voiceLocale == "ur-PK",
                    onClick = { voiceLocale = "ur-PK" },
                    label = { Text("اردو (ur-PK)") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Cancel")
                }
                Button(
                    onClick = {
                        onSave(
                            AiSettings(
                                provider = provider,
                                geminiApiKey = geminiKey,
                                geminiModel = geminiModel,
                                ollamaBaseUrl = ollamaUrl,
                                ollamaModel = ollamaModel,
                                voiceLocale = voiceLocale
                            )
                        )
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F766E)),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Save Settings")
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
