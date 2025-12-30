import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING
from dataclasses import dataclass, asdict, field

if TYPE_CHECKING:
    from .storage import Storage


@dataclass
class Step:
    name: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    reasoning: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    duration_ms: Optional[float] = None


@dataclass
class Execution:
    execution_id: str
    name: str
    steps: List[Step] = field(default_factory=list)
    started_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    ended_at: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "execution_id": self.execution_id,
            "name": self.name,
            "steps": [asdict(step) for step in self.steps],
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "metadata": self.metadata,
        }


class XRay:
    def __init__(self, storage: Optional["Storage"] = None, storage_path: Optional[str] = None):
        if storage is None:
            from .storage import JSONFileStorage
            storage = JSONFileStorage(storage_path)
        self.storage = storage
        self._active_executions: Dict[str, Execution] = {}
    
    def start_execution(self, name: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        execution_id = str(uuid.uuid4())
        execution = Execution(
            execution_id=execution_id,
            name=name,
            metadata=metadata or {}
        )
        self._active_executions[execution_id] = execution
        return execution_id
    
    def add_step(
        self,
        execution_id: str,
        step_name: str,
        inputs: Dict[str, Any],
        outputs: Dict[str, Any],
        reasoning: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[float] = None
    ) -> None:
        if execution_id not in self._active_executions:
            raise ValueError(f"Execution {execution_id} not found. Did you call start_execution?")
        
        step = Step(
            name=step_name,
            inputs=inputs,
            outputs=outputs,
            reasoning=reasoning,
            metadata=metadata or {},
            duration_ms=duration_ms
        )
        
        self._active_executions[execution_id].steps.append(step)
    
    def end_execution(self, execution_id: str) -> None:
        if execution_id not in self._active_executions:
            raise ValueError(f"Execution {execution_id} not found")
        
        execution = self._active_executions[execution_id]
        execution.ended_at = datetime.utcnow().isoformat()
        self.storage.save_execution(execution)
        del self._active_executions[execution_id]
    
    def get_execution(self, execution_id: str) -> Optional[Execution]:
        if execution_id in self._active_executions:
            return self._active_executions[execution_id]
        return self.storage.load_execution(execution_id)
    
    def list_executions(self, limit: int = 100) -> List[Execution]:
        return self.storage.list_executions(limit=limit)

