package com.khanai.assistant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.khanai.assistant.storage.ChatEntity

private sealed class TextSegment {
    data class Plain(val text: String) : TextSegment()
    data class CodeBlock(val language: String, val code: String) : TextSegment()
}

private fun parseMessageSegments(raw: String): List<TextSegment> {
    val regex = Regex("```([a-zA-Z0-9_+-]*)\\n([\\s\\S]*?)```")
    val segments = mutableListOf<TextSegment>()
    var lastIdx = 0
    for (match in regex.findAll(raw)) {
        if (match.range.first > lastIdx) {
            val plain = raw.substring(lastIdx, match.range.first).trim()
            if (plain.isNotEmpty()) segments.add(TextSegment.Plain(plain))
        }
        val lang = match.groupValues[1].ifBlank { "code" }
        val code = match.groupValues[2].trimEnd()
        segments.add(TextSegment.CodeBlock(lang, code))
        lastIdx = match.range.last + 1
    }
    if (lastIdx < raw.length) {
        val tail = raw.substring(lastIdx).trim()
        if (tail.isNotEmpty()) segments.add(TextSegment.Plain(tail))
    }
    if (segments.isEmpty()) segments.add(TextSegment.Plain(raw))
    return segments
}

private fun containsUrduOrArabic(text: String): Boolean {
    return text.any { ch -> ch in '\u0600'..'\u06FF' || ch in '\u0750'..'\u077F' }
}

@Composable
fun MessageBubble(
    message: ChatEntity,
    onSpeakClick: (String) -> Unit
) {
    val isUser = message.role == "user"
    val clipboard = LocalClipboardManager.current
    val segments = remember(message.content) { parseMessageSegments(message.content) }
    val isRtlText = remember(message.content) { containsUrduOrArabic(message.content) }

    val containerColor = if (isUser) Color(0xFF0F766E) else Color.White
    val textColor = if (isUser) Color.White else Color(0xFF0F172A)
    val borderColor = if (isUser) Color(0xFF0F766E) else Color(0xFFE2E8F0)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.90f)
                .background(containerColor, RoundedCornerShape(12.dp))
                .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isUser) "You" else "KHAN AI",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isUser) Color(0xFFCCFBF1) else Color(0xFF0F766E)
                )
                if (!isUser && message.content.isNotBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = { onSpeakClick(message.content) },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.VolumeUp,
                                contentDescription = "Read aloud",
                                tint = Color(0xFF475569),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        IconButton(
                            onClick = { clipboard.setText(AnnotatedString(message.content)) },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.ContentCopy,
                                contentDescription = "Copy reply",
                                tint = Color(0xFF475569),
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            segments.forEach { segment ->
                when (segment) {
                    is TextSegment.Plain -> {
                        val dir = if (isRtlText) LayoutDirection.Rtl else LayoutDirection.Ltr
                        CompositionLocalProvider(LocalLayoutDirection provides dir) {
                            Text(
                                text = segment.text,
                                color = textColor,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    lineHeight = if (isRtlText) 26.sp else 21.sp
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                            )
                        }
                    }

                    is TextSegment.CodeBlock -> {
                        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp)
                                    .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                                    .padding(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = segment.language,
                                        color = Color(0xFF94A3B8),
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                    TextButton(
                                        onClick = { clipboard.setText(AnnotatedString(segment.code)) }
                                    ) {
                                        Text(
                                            text = "Copy Code",
                                            color = Color(0xFF5EEAD4),
                                            fontSize = 11.sp
                                        )
                                    }
                                }
                                Text(
                                    text = segment.code,
                                    color = Color(0xFFF8FAFC),
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace,
                                    lineHeight = 18.sp,
                                    modifier = Modifier.horizontalScroll(rememberScrollState())
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
