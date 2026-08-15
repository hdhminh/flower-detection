import json
import os
from typing import List, Optional, Dict, Any

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "flowers_data.json")

class FlowerService:
    def __init__(self, data_path: str = DATA_PATH):
        self.data_path = os.path.abspath(data_path)
        self._data_cache: Optional[Dict[str, Any]] = None
        self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        if not os.path.exists(self.data_path):
            return {"flowers": []}
        with open(self.data_path, "r", encoding="utf-8") as f:
            self._data_cache = json.load(f)
        return self._data_cache

    def get_all_flowers(self) -> List[Dict[str, Any]]:
        if not self._data_cache:
            self._load_data()
        return self._data_cache.get("flowers", [])

    def get_flower_by_id_or_name(self, identifier: str) -> Optional[Dict[str, Any]]:
        flowers = self.get_all_flowers()
        identifier_clean = identifier.strip().lower()
        for f in flowers:
            if (
                f["id"].lower() == identifier_clean
                or f["name_vi"].lower() == identifier_clean
                or f["name_en"].lower() == identifier_clean
                or str(f.get("index")) == identifier_clean
            ):
                return f
        return None

flower_service = FlowerService()
