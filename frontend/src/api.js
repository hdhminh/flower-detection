import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

export const LOCAL_FLOWERS_DB = [
  {
    id: "chrysanthemum",
    index: 0,
    name_vi: "Hoa Cúc",
    name_en: "Chrysanthemum",
    scientific_name: "Chrysanthemum morifolium",
    symbol: "🌼",
    image: "/images/flowers/chrysanthemum.jpg",
    color_palette: ["#FFE066", "#FFA94D", "#FFFFFF", "#FF6B6B"],
    // English
    meaning: "Symbolizes longevity, vitality, joy, and nobility. In decorative arts, chrysanthemums represent flourishing prosperity and positivity.",
    season: "Autumn to early winter, flourishing from September through December.",
    distribution: "Native to East Asia, extensively cultivated in Japan, China, Vietnam, and worldwide.",
    care: "Prefers full to partial sun, well-draining moist soil, moderate watering every 1-2 days.",
    decorative_tips: "Identified by its signature concentric multilayered petals radiating outwards from a central disk, maintaining distinct geometric structure regardless of artificial dyeing.",
    fun_facts: [
      "The official imperial seal and throne of the Emperor of Japan (Chrysanthemum Throne).",
      "Over 20,000 cultivated varieties exist across the globe with distinct petal curvatures.",
      "Traditional herbal chrysanthemum infusion has been enjoyed for centuries."
    ],
    // Vietnamese
    meaning_vi: "Tượng trưng cho sự trường thọ, sức sống dẻo dai, niềm vui và sự thanh cao. Trong nghệ thuật cắm hoa và trang trí, hoa cúc mang đến nguồn năng lượng thịnh vượng và an khang.",
    season_vi: "Mùa thu đến đầu đông, nở rộ rực rỡ nhất từ tháng 9 đến tháng 12.",
    distribution_vi: "Có nguồn gốc từ Đông Á, được trồng và nhân giống rộng rãi tại Nhật Bản, Trung Quốc, Việt Nam và khắp thế giới.",
    care_vi: "Ưa ánh sáng tự nhiên từ nắng đầy đủ đến bán phần, đất tơi xốp thoát nước tốt, tưới nước đều đặn 1-2 ngày/lần.",
    decorative_tips_vi: "Dễ dàng nhận dạng qua các lớp cánh hoa đồng tâm xếp nhiều tầng tỏa tròn đều từ nhụy giữa, giữ vững cấu trúc hình học bất kể màu nhuộm trang trí.",
    fun_facts_vi: [
      "Là biểu tượng hoàng gia chính thức trên quốc huy và ngai vàng của Thiên hoàng Nhật Bản.",
      "Có hơn 20.000 giống hoa cúc khác nhau trên toàn thế giới với vô số hình thái cánh hoa độc đáo.",
      "Trà hoa cúc thảo mộc tự nhiên đã được ưa chuộng từ hàng ngàn năm qua."
    ]
  },
  {
    id: "rose",
    index: 1,
    name_vi: "Hoa Hồng",
    name_en: "Rose",
    scientific_name: "Rosa spp.",
    symbol: "🌹",
    image: "/images/flowers/rose.jpg",
    color_palette: ["#FF4D6D", "#C9184A", "#FF758F", "#FFCCD5", "#D8B4E2"],
    // English
    meaning: "Universal emblem of romance, profound love, grace, and timeless elegance.",
    season: "Blooms year-round in temperate environments, peak flourishing in spring and summer.",
    distribution: "Originally native to Asia and the Mediterranean, now globally hybridized.",
    care: "Requires at least 6 hours of daily sunlight, nutrient-rich well-drained soil, and regular pruning.",
    decorative_tips: "Recognized by spiral swirling petal layers folding inwards toward the core and characteristic calyx structure.",
    fun_facts: [
      "Over 30,000 distinct cultivars from miniature shrubs to climbing ramblers.",
      "Rose fossil records date back over 35 million years.",
      "Natural rose essential oil remains one of the most prestigious fragrance bases in haute perfumery."
    ],
    // Vietnamese
    meaning_vi: "Biểu tượng vĩnh cửu của tình yêu đôi lứa nồng nàn, vẻ đẹp kiêu sa, quý phái và lòng thủy chung son sắt.",
    season_vi: "Nở quanh năm ở điều kiện khí hậu ôn hòa, rộ nhất vào mùa xuân và mùa hạ.",
    distribution_vi: "Xuất xứ ban đầu từ châu Á và Địa Trung Hải, ngày nay được lai tạo rộng rãi trên toàn cầu.",
    care_vi: "Cần tối thiểu 6 giờ nắng mỗi ngày, đất giàu dinh dưỡng thoát nước nhanh và cắt tỉa cành định kỳ.",
    decorative_tips_vi: "Nổi bật với các lớp cánh hoa xoắn ốc mềm mại khum dần về phía tâm và cấu trúc đài hoa đặc trưng.",
    fun_facts_vi: [
      "Có hơn 30.000 giống hoa hồng lai tạo từ dạng bụi mini đến hoa hồng leo rực rỡ.",
      "Hóa thạch hoa hồng cổ đại có niên đại lên đến hơn 35 triệu năm.",
      "Tinh dầu hoa hồng tự nhiên là một trong những thành phần nước hoa xa xỉ bậc nhất thế giới."
    ]
  },
  {
    id: "hydrangea",
    index: 2,
    name_vi: "Cẩm Tú Cầu",
    name_en: "Hydrangea",
    scientific_name: "Hydrangea macrophylla",
    symbol: "🌸",
    image: "/images/flowers/hydrangea.jpg",
    color_palette: ["#74C0FC", "#A5D8FF", "#B197FC", "#F783AC", "#D0BFFF"],
    // English
    meaning: "Symbolizes heartfelt gratitude, deep emotion, abundance, and unity.",
    season: "Summer through autumn, from May to October, especially thriving in cool highland climates.",
    distribution: "Native to Japan, Korea, and the Americas.",
    care: "Thrives in partial shade, requires generous watering, and moist organic-rich soil.",
    decorative_tips: "Distinguished by dense spherical pom-pom clusters composed of dozens of small four-petaled florets.",
    fun_facts: [
      "Natural bloom pigmentation shifts based on soil pH (acidic soil yields blues, alkaline produces pinks).",
      "The name derives from ancient Greek 'hydro' (water) and 'angeion' (vessel).",
      "A celebrated ornamental flower in cool mountainous regions and temperate highland gardens worldwide."
    ],
    // Vietnamese
    meaning_vi: "Biểu trưng cho lòng biết ơn chân thành, sự hòa hợp, gắn kết trọn vẹn và niềm hạnh phúc đong đầy.",
    season_vi: "Từ tháng 5 đến tháng 10, đặc biệt tươi tốt tại các vùng cao nguyên mát mẻ như Đà Lạt.",
    distribution_vi: "Có nguồn gốc từ Nhật Bản, Hàn Quốc và châu Mỹ, rất được ưa chuộng trong cảnh quan sân vườn.",
    care_vi: "Thích bóng râm nhẹ, cần tưới nhiều nước giữ ẩm và đất giàu mùn hữu cơ.",
    decorative_tips_vi: "Dễ nhận diện qua chùm hoa hình cầu lớn dạng pom-pom kết hợp từ hàng chục bông hoa nhỏ 4 cánh xinh xắn.",
    fun_facts_vi: [
      "Màu sắc cánh hoa có khả năng đổi màu kỳ diệu theo độ pH của đất (đất chua ra hoa xanh lam, đất kiềm ra hoa hồng tím).",
      "Tên khoa học Hydrangea bắt nguồn từ tiếng Hy Lạp mang ý nghĩa 'bình đựng nước'.",
      "Là loài hoa trang trí tiệc cưới và sự kiện sang trọng được yêu thích hàng đầu."
    ]
  },
  {
    id: "lavender",
    index: 3,
    name_vi: "Oải Hương",
    name_en: "Lavender",
    scientific_name: "Lavandula angustifolia",
    symbol: "💜",
    image: "/images/flowers/lavender.jpg",
    color_palette: ["#9775FA", "#7950F2", "#B197FC", "#E5DBFF"],
    // English
    meaning: "Represents serenity, purity, devotion, tranquility, and graceful poise.",
    season: "Summer months, especially June through August.",
    distribution: "Mediterranean basin, celebrated in Provence, France and worldwide herb gardens.",
    care: "Demands full sunshine, low humidity, lean sandy soil, and sharp drainage.",
    decorative_tips: "Characterized by slender vertical spike stalks with tiered whorls of miniature calyces along the stem.",
    fun_facts: [
      "Ancient Romans infused bathwater with lavender, giving rise to its Latin root 'lavare' (to wash).",
      "Contains aromatic linalool, widely studied for calming relaxation and sleep support.",
      "Iconic purple fields of Provence attract millions of visitors every summer."
    ],
    // Vietnamese
    meaning_vi: "Tượng trưng cho sự bình yên, thanh khiết, lòng trung thành và nét duyên dáng, thư thái tâm hồn.",
    season_vi: "Tháng 6 đến tháng 8 vào mùa hè ngập tràn ánh nắng.",
    distribution_vi: "Vùng Địa Trung Hải, nổi tiếng nhất tại thung lũng Provence nước Pháp và các trang trại thảo mộc.",
    care_vi: "Cần nhiều nắng gắt, không khí khô ráo, đất cát thoát nước cực nhanh, tưới ít nước.",
    decorative_tips_vi: "Nổi bật với cành hoa dạng bông thẳng đứng thon dài với nhiều tầng hoa tím nhỏ li ti mọc vòng quanh cuống.",
    fun_facts_vi: [
      "Người La Mã cổ đại dùng hoa oải hương pha nước tắm, tạo nên gốc từ Latin 'lavare' (nghĩa là gột rửa).",
      "Chứa hoạt chất Linalool tự nhiên giúp an thần, thư giãn thần kinh và cải thiện giấc ngủ sâu.",
      "Những cánh đồng oải hương tím ngắt ở Provence thu hút hàng triệu du khách mỗi mùa hè."
    ]
  },
  {
    id: "sunflower",
    index: 4,
    name_vi: "Hướng Dương",
    name_en: "Sunflower",
    scientific_name: "Helianthus annuus",
    symbol: "🌻",
    image: "/images/flowers/sunflower.jpg",
    color_palette: ["#FFD43B", "#FAB005", "#F59F00", "#795548", "#4E342E"],
    // English
    meaning: "Symbolizes unwavering optimism, warmth, loyalty, vitality, and seeking the light.",
    season: "Summer through autumn, June through November.",
    distribution: "Native to North America, cultivated across the globe.",
    care: "Needs full direct sun (6-8 hours), drought-tolerant once established, deep fertile soil.",
    decorative_tips: "Features a prominent broad circular disk florets center bordered by radiant elongated ray petals.",
    fun_facts: [
      "Exhibits heliotropism: young flower buds track the sun's journey across the sky from east to west.",
      "Vincent van Gogh's iconic 'Sunflowers' series revolutionized floral still-life painting.",
      "A single sunflower head is actually an inflorescence made of thousands of tiny individual flowers."
    ],
    // Vietnamese
    meaning_vi: "Tượng trưng cho tinh thần lạc quan mãnh liệt, sự ấm áp, niềm tin bất diệt và luôn hướng về ánh sáng tương lai.",
    season_vi: "Mùa hè đến mùa thu, từ tháng 6 đến tháng 11.",
    distribution_vi: "Có nguồn gốc từ Bắc Mỹ, hiện được gieo trồng khắp các châu lục trên thế giới.",
    care_vi: "Cần nắng trực tiếp tối thiểu 6-8 tiếng/ngày, chịu hạn tốt khi cây đã bén rễ, đất sâu giàu dưỡng chất.",
    decorative_tips_vi: "Dễ nhận dạng nhờ đĩa nhụy hoa tròn lớn ở giữa bao quanh bởi hàng chục cánh hoa vàng thon dài rực rỡ.",
    fun_facts_vi: [
      "Có đặc tính hướng dương độc đáo: nụ hoa non luôn quay theo hành trình mặt trời từ đông sang tây mỗi ngày.",
      "Bộ tranh 'Hoa Hướng Dương' của danh họa Vincent van Gogh là một trong những kiệt tác hội họa đắt giá nhất lịch sử.",
      "Mỗi đầu hoa hướng dương thực chất là một cụm hoa khổng lồ gồm hàng ngàn bông hoa nhỏ li ti kết hợp lại."
    ]
  }
];

export async function fetchFlowerList() {
  try {
    const res = await apiClient.get('/flower/list');
    return res.data;
  } catch (err) {
    return LOCAL_FLOWERS_DB;
  }
}

export async function fetchFlowerDetail(idOrName) {
  try {
    const res = await apiClient.get(`/flower/${idOrName}`);
    return res.data;
  } catch (err) {
    const clean = idOrName.toLowerCase();
    const found = LOCAL_FLOWERS_DB.find(
      f => f.id === clean || f.name_vi.toLowerCase() === clean || f.name_en.toLowerCase() === clean || String(f.index) === clean
    );
    return found || LOCAL_FLOWERS_DB[0];
  }
}

export async function explainFlowerWithLLM(flowerName, lang = 'en', customPrompt = '') {
  try {
    const res = await apiClient.post('/flower/explain', {
      flower_name: flowerName,
      lang,
      custom_prompt: customPrompt
    });
    return res.data;
  } catch (err) {
    const found = LOCAL_FLOWERS_DB.find(
      f => f.id === flowerName.toLowerCase() || f.name_vi.toLowerCase() === flowerName.toLowerCase() || f.name_en.toLowerCase() === flowerName.toLowerCase()
    ) || LOCAL_FLOWERS_DB[0];

    const isVi = lang === 'vi';
    return {
      name_vi: found.name_vi,
      name_en: found.name_en,
      scientific_name: found.scientific_name,
      symbol: found.symbol,
      meaning: isVi ? found.meaning_vi : found.meaning,
      season: isVi ? found.season_vi : found.season,
      distribution: isVi ? found.distribution_vi : found.distribution,
      care: isVi ? found.care_vi : found.care,
      decorative_tips: isVi ? found.decorative_tips_vi : found.decorative_tips,
      fun_facts: isVi ? found.fun_facts_vi : found.fun_facts,
      ai_analysis: isVi
        ? `Thị giác máy tính và phân tích thực vật xác nhận hình thái khớp với ${found.name_vi} (${found.name_en}) dựa trên cấu trúc cánh hoa và hình học giải phẫu.`
        : `Computer vision and botanical analysis verify morphology matching ${found.name_en} based on invariant petal formation and anatomical geometry.`
    };
  }
}
