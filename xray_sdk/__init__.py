"""
X-Ray SDK - A library for debugging multi-step algorithmic systems.

This library provides transparency into decision processes by capturing
context at each step: inputs, candidates, filters, outcomes, and reasoning.
"""

from .core import XRay, Execution, Step
from .storage import Storage, JSONFileStorage

__version__ = "1.0.0"
__all__ = ["XRay", "Execution", "Step", "Storage", "JSONFileStorage"]

