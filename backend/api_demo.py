from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from demo.competitor_selection import find_competitor

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/run-competitor-selection")
async def run_competitor_selection(product: Dict[str, Any]) -> Dict[str, Any]:
    try:
        from backend import main
        xray = main.xray
        
        required_fields = ["title", "price", "rating", "reviews", "category"]
        for field in required_fields:
            if field not in product:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        reference_product = {
            "asin": product.get("asin", "DEMO-" + product.get("title", "unknown")[:10]),
            "title": product["title"],
            "price": float(product["price"]),
            "rating": float(product["rating"]),
            "reviews": int(product["reviews"]),
            "category": product["category"]
        }
        
        competitor = find_competitor(reference_product, xray)
        
        if competitor and competitor is not None:
            return {
                "success": True,
                "reference_product": reference_product,
                "selected_competitor": {
                    "title": competitor["title"],
                    "asin": competitor["asin"],
                    "price": competitor["metrics"]["price"],
                    "rating": competitor["metrics"]["rating"],
                    "reviews": competitor["metrics"]["reviews"],
                    "score": competitor["total_score"]
                }
            }
        else:
            return {
                "success": False,
                "reference_product": reference_product,
                "message": "No qualified competitor found"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in competitor selection: {e}")
        print(traceback.format_exc())
        return {
            "success": False,
            "reference_product": reference_product,
            "message": f"No qualified competitor found: {str(e)}"
        }

