package com.khanai.assistant.agents

enum class AssistantMode(
    val id: String,
    val labelEn: String,
    val labelUr: String
) {
    GENERAL(
        id = "general",
        labelEn = "General Chat",
        labelUr = "عمومی گفتگو"
    ),
    CODING(
        id = "coding",
        labelEn = "Coding & Debug",
        labelUr = "کوڈنگ اور ڈیبگنگ"
    ),
    CYBER_SAFETY(
        id = "cyber_safety",
        labelEn = "Cyber Safety",
        labelUr = "سائبر تحفظ اور شواہد"
    ),
    IMAGE_PROMPT(
        id = "image_prompt",
        labelEn = "Image Prompts",
        labelUr = "امیج پرامپٹ ہیلپر"
    )
}
