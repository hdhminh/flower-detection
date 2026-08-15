import os
import json
from typing import Dict, Any, Optional
from openai import OpenAI
from app.services.flower_service import flower_service

SYSTEM_PROMPT = """Bạn là chuyên gia thực vật học và trang trí hoa nghệ thuật cao cấp.
Khi nhận được tên hoa và câu hỏi/yêu cầu, hãy phân tích chi tiết và trả về định dạng JSON thuần túy (không kèm markdown format ngoài JSON block) với schema sau:
{
  "name_vi": "Tên tiếng Việt",
  "name_en": "Tên tiếng Anh",
  "scientific_name": "Tên khoa học",
  "symbol": "Emoji đại diện",
  "meaning": "Ý nghĩa biểu tượng sâu sắc trong phong thủy, tình cảm, đời sống",
  "season": "Mùa hoa nở và điều kiện thời vụ lý tưởng",
  "distribution": "Phân bố địa lý và nguồn gốc",
  "care": "Hướng dẫn chăm sóc (ánh sáng, lượng nước, đất trồng, cắt tỉa)",
  "decorative_tips": "Mẹo nhận diện & trang trí với hoa trang trí/hoa nhân tạo (đặc biệt khi màu sắc không theo màu gốc)",
  "fun_facts": [
    "Sự thật thú vị 1",
    "Sự thật thú vị 2",
    "Sự thật thú vị 3"
  ],
  "ai_analysis": "Nhận xét chuyên sâu từ AI về loài hoa này trong bối cảnh nhận diện hình ảnh/trang trí"
}
Nếu ngôn ngữ là 'en', hãy viết toàn bộ nội dung bằng tiếng Anh. Nếu là 'vi', viết toàn bộ bằng tiếng Việt."""

def get_llm_client() -> Optional[OpenAI]:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return None
    return OpenAI(
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        api_key=api_key,
    )

def explain_flower_with_llm(flower_name: str, lang: str = "vi", custom_prompt: Optional[str] = None) -> Dict[str, Any]:
    # Check if we have fallback data in flower_service
    local_info = flower_service.get_flower_by_id_or_name(flower_name)
    client = get_llm_client()
    model = os.getenv("LLM_MODEL", "google/gemini-2.0-flash-exp:free")

    if client:
        try:
            user_msg = f"Loại hoa cần phân tích: {flower_name}\nNgôn ngữ phản hồi: {lang}"
            if custom_prompt:
                user_msg += f"\nYêu cầu thêm: {custom_prompt}"
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg}
                ],
                response_format={"type": "json_object"}
            )
            raw_content = response.choices[0].message.content
            if raw_content:
                parsed = json.loads(raw_content)
                return parsed
        except Exception as e:
            print(f"[LLM Service] Warning: OpenRouter request failed: {e}. Falling back to rich local database.")

    # Fallback to rich curated local knowledge if LLM is unavailable
    if local_info:
        if lang == "en":
            return {
                "name_vi": local_info["name_vi"],
                "name_en": local_info["name_en"],
                "scientific_name": local_info["scientific_name"],
                "symbol": local_info.get("symbol", "🌸"),
                "meaning": f"Represents longevity, grace, and joy. In decorative arts, {local_info['name_en']} brings vitality and harmony.",
                "season": local_info["season"],
                "distribution": local_info["distribution"],
                "care": local_info["care"],
                "decorative_tips": local_info.get("decorative_tips", "Recognized primarily by petal swirl, layering geometry, and stem structure regardless of artificial coloring."),
                "fun_facts": local_info.get("fun_facts", []),
                "ai_analysis": f"Recognized as {local_info['name_en']} based on characteristic botanical shape invariants."
            }
        else:
            return {
                **local_info,
                "ai_analysis": f"Mô hình AI nhận diện loài {local_info['name_vi']} ({local_info['name_en']}) dựa trên cấu trúc hình học đặc trưng bất biến theo màu sắc."
            }

    # Generic response if flower is unknown
    return {
        "name_vi": flower_name,
        "name_en": flower_name,
        "scientific_name": "Plantae",
        "symbol": "🌸",
        "meaning": "Loài hoa mang nét đẹp tinh tế trong thiên nhiên và nghệ thuật trang trí.",
        "season": "Xuân - Hạ - Thu",
        "distribution": "Toàn cầu",
        "care": "Cần ánh sáng và độ ẩm thích hợp.",
        "decorative_tips": "Quan sát hình dáng cánh hoa, cách sắp xếp nhụy và đài hoa để phân biệt.",
        "fun_facts": ["Thực vật có hoa đã xuất hiện từ hơn 130 triệu năm trước."],
        "ai_analysis": "Thông tin chi tiết về loài hoa trang trí."
    }
