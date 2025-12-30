from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from xray_sdk import XRay
from xray_sdk.storage import JSONFileStorage

app = FastAPI(title="X-Ray Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

project_root = Path(__file__).parent.parent
storage_path = str(project_root / "xray_storage")
xray = XRay(storage=JSONFileStorage(storage_path=storage_path))


@app.get("/api/executions")
def list_executions(limit: int = 100) -> List[Dict[str, Any]]:
    try:
        executions = xray.list_executions(limit=limit)
        return [execution.to_dict() for execution in executions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/executions/{execution_id}")
def get_execution(execution_id: str) -> Dict[str, Any]:
    try:
        execution = xray.get_execution(execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        return execution.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


from backend.api_demo import router as demo_router
app.include_router(demo_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

