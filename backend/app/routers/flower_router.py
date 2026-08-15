from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.flower_service import flower_service
from app.services.llm_service import explain_flower_with_llm

router = APIRouter(prefix="/flower", tags=["Flowers"])

class ExplainRequest(BaseModel):
    flower_name: str
    lang: Optional[str] = "vi"
    custom_prompt: Optional[str] = None

class FlowerResponse(BaseModel):
    id: str
    index: int
    name_vi: str
    name_en: str
    scientific_name: str
    symbol: Optional[str] = None
    color_palette: Optional[List[str]] = []
    meaning: Optional[str] = None
    season: Optional[str] = None
    distribution: Optional[str] = None
    care: Optional[str] = None
    decorative_tips: Optional[str] = None
    fun_facts: Optional[List[str]] = []

@router.get("/list", response_model=List[FlowerResponse])
def get_flower_list():
    """Returns the list of 5 supported decorative flowers."""
    return flower_service.get_all_flowers()

@router.get("/{identifier}", response_model=FlowerResponse)
def get_flower_detail(identifier: str):
    """Returns details for a specific flower by id, name or index."""
    flower = flower_service.get_flower_by_id_or_name(identifier)
    if not flower:
        raise HTTPException(status_code=404, detail=f"Flower '{identifier}' not found")
    return flower

@router.post("/explain")
def explain_flower(req: ExplainRequest):
    """Explains flower meaning, symbolism, decorative traits and care using LLM (with offline fallback)."""
    return explain_flower_with_llm(
        flower_name=req.flower_name,
        lang=req.lang or "vi",
        custom_prompt=req.custom_prompt
    )
