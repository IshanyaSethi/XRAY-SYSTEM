import json
from pathlib import Path
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .core import Execution


class Storage:
    def save_execution(self, execution: "Execution") -> None:
        raise NotImplementedError
    
    def load_execution(self, execution_id: str) -> Optional["Execution"]:
        raise NotImplementedError
    
    def list_executions(self, limit: int = 100) -> List["Execution"]:
        raise NotImplementedError


class JSONFileStorage(Storage):
    def __init__(self, storage_path: Optional[str] = None):
        if storage_path is None:
            storage_path = "./xray_storage"
        
        self.base_path = Path(storage_path)
        self.executions_dir = self.base_path / "executions"
        self.index_file = self.base_path / "index.json"
        
        self.executions_dir.mkdir(parents=True, exist_ok=True)
        if not self.index_file.exists():
            with open(self.index_file, "w") as f:
                json.dump({"executions": []}, f, indent=2)
    
    def save_execution(self, execution: "Execution") -> None:
        execution_file = self.executions_dir / f"{execution.execution_id}.json"
        with open(execution_file, "w") as f:
            json.dump(execution.to_dict(), f, indent=2, default=str)
        self._update_index(execution.execution_id, execution.name, execution.started_at)
    
    def load_execution(self, execution_id: str) -> Optional["Execution"]:
        execution_file = self.executions_dir / f"{execution_id}.json"
        
        if not execution_file.exists():
            return None
        
        with open(execution_file, "r") as f:
            data = json.load(f)
        
        return self._dict_to_execution(data)
    
    def list_executions(self, limit: int = 100) -> List["Execution"]:
        """List recent executions from index."""
        if not self.index_file.exists():
            return []
        
        with open(self.index_file, "r") as f:
            index = json.load(f)
        
        executions = index.get("executions", [])
        executions.sort(key=lambda x: x.get("started_at", ""), reverse=True)
        
        result = []
        for exec_info in executions[:limit]:
            execution = self.load_execution(exec_info["execution_id"])
            if execution:
                result.append(execution)
        return result
    
    def _update_index(self, execution_id: str, name: str, started_at: str) -> None:
        if not self.index_file.exists():
            index = {"executions": []}
        else:
            with open(self.index_file, "r") as f:
                index = json.load(f)
        
        index["executions"] = [e for e in index["executions"] if e["execution_id"] != execution_id]
        index["executions"].insert(0, {
            "execution_id": execution_id,
            "name": name,
            "started_at": started_at
        })
        
        with open(self.index_file, "w") as f:
            json.dump(index, f, indent=2)
    
    def _dict_to_execution(self, data: dict) -> "Execution":
        from .core import Execution, Step
        
        steps = [
            Step(
                name=step["name"],
                inputs=step["inputs"],
                outputs=step["outputs"],
                reasoning=step.get("reasoning"),
                metadata=step.get("metadata", {}),
                timestamp=step.get("timestamp"),
                duration_ms=step.get("duration_ms")
            )
            for step in data.get("steps", [])
        ]
        
        return Execution(
            execution_id=data["execution_id"],
            name=data["name"],
            steps=steps,
            started_at=data["started_at"],
            ended_at=data.get("ended_at"),
            metadata=data.get("metadata", {})
        )

