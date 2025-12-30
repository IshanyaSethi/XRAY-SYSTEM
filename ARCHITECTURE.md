# X-Ray System: Complete Architecture Overview

This document provides a comprehensive overview of the X-Ray system architecture, including all components, data flows, and interactions.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Breakdown](#component-breakdown)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Design Patterns](#design-patterns)
7. [Storage Architecture](#storage-architecture)
8. [API Architecture](#api-architecture)
9. [Frontend Architecture](#frontend-architecture)
10. [Integration Points](#integration-points)

---

## System Overview

The X-Ray system is a **three-tier architecture** designed to provide transparency and debugging capabilities for multi-step algorithmic systems:

1. **SDK Layer** (Python Library) - Core tracing functionality
2. **Backend Layer** (FastAPI) - REST API and data serving
3. **Frontend Layer** (Next.js) - Dashboard UI for visualization

### Key Design Principles

- **Separation of Concerns**: Each layer has a distinct responsibility
- **Storage Abstraction**: Pluggable storage backends (currently JSON files)
- **Lightweight SDK**: Minimal overhead for instrumenting code
- **General-Purpose**: Works with any multi-step algorithmic system
- **Developer-Friendly**: Simple API, easy to integrate

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER APPLICATIONS                              │
│  (Your code instrumented with X-Ray SDK)                                │
│  - Demo: competitor_selection.py                                        │
│  - Custom workflows                                                     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Instrumentation Calls
                             │ (start_execution, add_step, end_execution)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            X-RAY SDK                                    │
│  (Python Package: xray_sdk)                                             │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  Core Classes                                                 │      │
│  │  - XRay: Main orchestrator class                             │      │
│  │  - Execution: Complete trace data model                      │      │
│  │  - Step: Individual step data model                          │      │
│  └──────────────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  Storage Interface                                            │      │
│  │  - Storage: Abstract base class                              │      │
│  │  - JSONFileStorage: JSON file implementation                 │      │
│  └──────────────────────────────────────────────────────────────┘      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Persists Traces
                             │ (save_execution, load_execution)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         STORAGE LAYER                                   │
│  JSON File Storage                                                       │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  xray_storage/                                                │      │
│  │  ├── executions/                                              │      │
│  │  │   ├── {execution_id_1}.json                               │      │
│  │  │   ├── {execution_id_2}.json                               │      │
│  │  │   └── ...                                                  │      │
│  │  └── index.json (metadata index)                             │      │
│  └──────────────────────────────────────────────────────────────┘      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Reads Traces
                             │ (via SDK Storage Interface)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API LAYER                               │
│  FastAPI Server (Python)                                                │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  main.py                                                      │      │
│  │  - Initializes XRay SDK instance                             │      │
│  │  - CORS middleware                                            │      │
│  │  - API Routes:                                                │      │
│  │    • GET /api/executions (list all)                          │      │
│  │    • GET /api/executions/{id} (get one)                      │      │
│  │    • GET /api/health (health check)                          │      │
│  └──────────────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  api_demo.py                                                  │      │
│  │  - POST /api/demo/run-competitor-selection                   │      │
│  │  - Runs demo workflow via API                                │      │
│  └──────────────────────────────────────────────────────────────┘      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │ (JSON responses)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                                  │
│  Next.js 14 + React + TailwindCSS                                      │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  app/page.tsx (Main Dashboard)                               │      │
│  │  - Lists all executions                                      │      │
│  │  - Displays execution details                                │      │
│  │  - Step-by-step accordion view                               │      │
│  └──────────────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  app/demo/page.tsx (Demo Runner)                             │      │
│  │  - Form to input product data                                │      │
│  │  - Runs demo workflow                                        │      │
│  │  - Shows results                                             │      │
│  └──────────────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  components/ui/ (ShadCN Components)                          │      │
│  │  - Card, Button, Accordion, Badge                            │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. X-Ray SDK (Core Library)

**Location**: `xray_sdk/`

**Components**:
- **`__init__.py`**: Package exports and version
- **`core.py`**: 
  - `XRay` class: Main SDK orchestrator
  - `Execution` dataclass: Complete execution trace
  - `Step` dataclass: Individual step in execution
- **`storage.py`**:
  - `Storage` abstract base class: Storage interface
  - `JSONFileStorage` class: JSON file implementation

**Responsibilities**:
- Provide simple API for instrumenting code
- Manage execution lifecycle (start, add steps, end)
- Abstract storage backend
- Handle serialization/deserialization

**Key Methods**:
- `XRay.start_execution()`: Begin tracking a new execution
- `XRay.add_step()`: Record a step in the execution
- `XRay.end_execution()`: Complete and persist execution
- `XRay.get_execution()`: Retrieve an execution
- `XRay.list_executions()`: List all executions

### 2. Backend API Server

**Location**: `backend/`

**Components**:
- **`main.py`**: 
  - FastAPI application initialization
  - CORS configuration
  - XRay SDK instance initialization
  - API route definitions
- **`api_demo.py`**:
  - Demo workflow API endpoint
  - Runs competitor selection workflow

**Responsibilities**:
- Serve execution data via REST API
- Handle HTTP requests from frontend
- Initialize shared XRay SDK instance
- Provide demo workflow execution endpoint

**API Endpoints**:
- `GET /api/executions`: List all executions (with limit)
- `GET /api/executions/{execution_id}`: Get specific execution
- `GET /api/health`: Health check
- `POST /api/demo/run-competitor-selection`: Run demo workflow

### 3. Frontend Dashboard

**Location**: `frontend/`

**Components**:
- **`app/page.tsx`**: Main dashboard page
  - Execution list view
  - Execution detail view
  - Step-by-step accordion
- **`app/demo/page.tsx`**: Demo runner page
  - Product input form
  - Demo execution trigger
  - Results display
- **`components/ui/`**: Reusable UI components (ShadCN)
- **`lib/utils.ts`**: Utility functions

**Responsibilities**:
- Display execution traces in user-friendly format
- Allow interactive exploration of execution data
- Provide UI for running demo workflows
- Handle API communication

### 4. Demo Application

**Location**: `demo/`

**Components**:
- **`competitor_selection.py`**: Complete demo workflow
  - 5-step competitor selection algorithm
  - X-Ray instrumentation throughout
  - Mock product data

**Workflow Steps**:
1. Keyword Generation: Generate search keywords
2. Candidate Search: Search for candidate products
3. Apply Filters: Filter by price, rating, reviews
4. LLM Relevance Evaluation: Remove false positives
5. Rank & Select: Rank candidates and select best

### 5. Storage Layer

**Location**: `xray_storage/`

**Structure**:
```
xray_storage/
├── executions/
│   ├── {uuid_1}.json  # Individual execution files
│   ├── {uuid_2}.json
│   └── ...
└── index.json         # Metadata index for fast listing
```

**File Format**:
- Execution files: Complete execution data (JSON)
- Index file: List of execution metadata (execution_id, name, started_at)

**Storage Implementation**:
- `JSONFileStorage`: File-based JSON storage
- Simple, no database required
- Easy to inspect and debug
- Suitable for development and small-scale production

---

## Data Flow

### Execution Flow (Write Path)

1. **User Code** calls `xray.start_execution()`
   - SDK creates new `Execution` object
   - Stores in memory (`_active_executions`)
   - Returns `execution_id`

2. **User Code** calls `xray.add_step()` multiple times
   - SDK creates `Step` objects
   - Appends to execution's `steps` list
   - All stored in memory

3. **User Code** calls `xray.end_execution()`
   - SDK sets `ended_at` timestamp
   - Calls `storage.save_execution()`
   - Storage serializes to JSON file
   - Storage updates `index.json`
   - SDK removes from memory

### Dashboard Flow (Read Path)

1. **Frontend** calls `GET /api/executions`
   - Backend calls `xray.list_executions()`
   - SDK calls `storage.list_executions()`
   - Storage reads `index.json`
   - Storage loads execution files as needed
   - Returns list of `Execution` objects
   - Backend serializes to JSON
   - Frontend receives and displays

2. **Frontend** calls `GET /api/executions/{id}`
   - Backend calls `xray.get_execution(id)`
   - SDK checks memory (active executions)
   - If not found, calls `storage.load_execution(id)`
   - Storage reads execution JSON file
   - Returns `Execution` object
   - Backend serializes to JSON
   - Frontend receives and displays details

### Demo Execution Flow

1. **Frontend** sends `POST /api/demo/run-competitor-selection`
   - Backend receives product data
   - Backend calls `find_competitor()` function
   - Demo function uses X-Ray SDK throughout
   - Execution is created and persisted
   - Backend returns result
   - Frontend displays result

---

## Technology Stack

### SDK Layer
- **Language**: Python 3.10+
- **Key Libraries**: 
  - Standard library (uuid, datetime, json, pathlib)
  - dataclasses (Python 3.7+)
  - typing (type hints)

### Backend Layer
- **Framework**: FastAPI
- **Server**: Uvicorn (ASGI)
- **Language**: Python 3.10+
- **Dependencies**:
  - `fastapi`: Web framework
  - `uvicorn`: ASGI server
  - `python-dotenv`: Environment variables

### Frontend Layer
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: TailwindCSS
- **Component Library**: ShadCN UI
- **Icons**: Lucide React

### Storage Layer
- **Format**: JSON files
- **Structure**: File system
- **Index**: Single index.json file

---

## Design Patterns

### 1. Storage Abstraction Pattern

The SDK uses an abstract `Storage` interface, allowing different storage backends:

```python
class Storage(ABC):
    @abstractmethod
    def save_execution(self, execution: Execution) -> None: ...
    @abstractmethod
    def load_execution(self, execution_id: str) -> Execution: ...
    @abstractmethod
    def list_executions(self, limit: int) -> List[Execution]: ...
```

**Benefits**:
- Easy to swap storage backends
- Testable (can use in-memory storage for tests)
- Future-proof (can add database storage)

### 2. Dataclass Pattern

Execution and Step are Python dataclasses:

**Benefits**:
- Clean, declarative data models
- Automatic `__init__`, `__repr__`, `__eq__`
- Type hints for better IDE support
- Easy serialization to dict

### 3. Factory Pattern

`XRay` class creates default storage if none provided:

```python
def __init__(self, storage: Optional["Storage"] = None, ...):
    if storage is None:
        from .storage import JSONFileStorage
        storage = JSONFileStorage(storage_path)
    self.storage = storage
```

### 4. Repository Pattern

Storage classes act as repositories, abstracting data access:

- `save_execution()`: Persist execution
- `load_execution()`: Retrieve execution
- `list_executions()`: Query executions

---

## Storage Architecture

### JSON File Storage Design

**Directory Structure**:
```
xray_storage/
├── executions/
│   ├── {uuid_1}.json
│   ├── {uuid_2}.json
│   └── ...
└── index.json
```

**Execution File Format**:
```json
{
  "execution_id": "uuid",
  "name": "competitor_selection",
  "started_at": "2024-01-01T12:00:00",
  "ended_at": "2024-01-01T12:00:05",
  "metadata": {...},
  "steps": [
    {
      "name": "keyword_generation",
      "inputs": {...},
      "outputs": {...},
      "reasoning": "...",
      "timestamp": "...",
      "duration_ms": 10.5,
      "metadata": {...}
    },
    ...
  ]
}
```

**Index File Format**:
```json
{
  "executions": [
    {
      "execution_id": "uuid",
      "name": "competitor_selection",
      "started_at": "2024-01-01T12:00:00"
    },
    ...
  ]
}
```

**Advantages**:
- Simple: No database setup required
- Portable: Easy to backup, move, version control
- Human-readable: Can inspect JSON files directly
- Fast for small-scale use: File system is efficient

**Limitations**:
- Not suitable for high-volume production
- No advanced querying (full-text search, filtering)
- No concurrent write optimization
- Index must be loaded fully

**Future Improvements**:
- Add database storage backend (PostgreSQL, MongoDB)
- Add query interface
- Add pagination for large datasets

---

## API Architecture

### REST API Design

**Base URL**: `http://localhost:8000`

**Endpoints**:

1. **GET /api/executions**
   - Query params: `limit` (default: 100)
   - Response: List of execution summaries
   - Purpose: List all executions for dashboard

2. **GET /api/executions/{execution_id}**
   - Path params: `execution_id` (UUID string)
   - Response: Complete execution object
   - Purpose: Get detailed execution data

3. **GET /api/health**
   - Response: `{"status": "ok"}`
   - Purpose: Health check

4. **POST /api/demo/run-competitor-selection**
   - Body: Product JSON object
   - Response: Execution result
   - Purpose: Run demo workflow

### CORS Configuration

Backend allows requests from:
- `http://localhost:3000` (Next.js dev server)
- `http://127.0.0.1:3000` (Alternative localhost)

### Error Handling

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Execution not found
- **500 Internal Server Error**: Server errors

---

## Frontend Architecture

### Next.js App Router Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main dashboard (/)
│   ├── demo/
│   │   └── page.tsx     # Demo runner (/demo)
│   └── globals.css      # Global styles
├── components/
│   └── ui/              # ShadCN components
└── lib/
    └── utils.ts         # Utility functions
```

### Data Fetching

**Pattern**: Client-side fetching (useEffect + fetch)

- No server-side rendering for simplicity
- Real-time data (always fresh from API)
- Simple error handling

**Future**: Could add SSR/SSG for better performance

### Component Structure

- **Page Components**: Top-level route components
- **UI Components**: Reusable ShadCN components
- **No State Management**: Uses React useState (simple enough)
- **No Routing Library**: Next.js handles routing

---

## Integration Points

### 1. SDK Integration

**How to integrate X-Ray SDK into your code**:

```python
from xray_sdk import XRay
from xray_sdk.storage import JSONFileStorage

# Initialize SDK
xray = XRay(storage=JSONFileStorage(storage_path="./xray_storage"))

# In your workflow
exec_id = xray.start_execution("my_workflow", metadata={...})

# Around each step
xray.add_step(exec_id, "step_name", inputs={...}, outputs={...}, reasoning="...")

# At the end
xray.end_execution(exec_id)
```

### 2. Storage Integration

**Current**: JSON file storage (default)

**Future**: Can add database storage:
- Implement `Storage` interface
- Pass to `XRay` constructor
- No code changes needed in your workflow

### 3. Backend Integration

**Current**: Single FastAPI instance serves frontend

**Future**: Can deploy separately:
- Backend as microservice
- Frontend as static site
- Storage as shared volume/database

### 4. Frontend Integration

**Current**: Standalone Next.js app

**Future**: Can embed dashboard:
- As iframe
- As React component library
- As API consumer (build custom UI)

---

## Scalability Considerations

### Current Limitations

1. **Storage**: JSON files don't scale well
   - Solution: Add database backend
2. **API**: Single-threaded (Uvicorn can handle async)
   - Solution: Deploy multiple workers
3. **Frontend**: No caching
   - Solution: Add API response caching
4. **Index**: Full index loaded in memory
   - Solution: Add pagination to storage layer

### Future Improvements

1. **Database Storage**: PostgreSQL/MongoDB backend
2. **Caching**: Redis for frequently accessed executions
3. **Pagination**: API and storage pagination
4. **Search**: Full-text search on execution metadata
5. **Real-time**: WebSocket updates for live executions
6. **Distributed Tracing**: Support for distributed systems

---

## Security Considerations

### Current State

- **No Authentication**: Dashboard is open
- **No Authorization**: All executions visible
- **No Input Validation**: Basic FastAPI validation
- **CORS**: Limited to localhost

### Production Recommendations

1. **Authentication**: Add user authentication
2. **Authorization**: Role-based access control
3. **Input Validation**: Strict validation on all inputs
4. **Rate Limiting**: Prevent API abuse
5. **HTTPS**: Always use HTTPS in production
6. **Secrets Management**: Store API keys securely
7. **Audit Logging**: Log all API access

---

## Development Workflow

### Local Development

1. **SDK Development**: 
   - Modify `xray_sdk/` code
   - Test with demo application
   - Install with `pip install -e .`

2. **Backend Development**:
   - Modify `backend/` code
   - Restart FastAPI server
   - Test with frontend or curl

3. **Frontend Development**:
   - Modify `frontend/` code
   - Next.js hot-reloads automatically
   - Test in browser

### Testing Strategy

**Current**: Manual testing with demo

**Future**:
- Unit tests for SDK
- Integration tests for API
- E2E tests for frontend
- Performance tests for storage

---

## Deployment Architecture

### Development Setup

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│  Backend    │────▶│  Storage    │
│  :3000      │     │  :8000      │     │  Files      │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Production Architecture (Future)

```
┌─────────────┐
│   CDN/      │
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Load      │────▶│   Backend   │────▶│  Database   │
│   Balancer  │     │   (Multiple │     │  (Postgres) │
└─────────────┘     │   Workers)  │     └─────────────┘
                    └─────────────┘
```

---

## Conclusion

The X-Ray system is designed with simplicity and extensibility in mind. The three-tier architecture (SDK, Backend, Frontend) provides clear separation of concerns while maintaining flexibility for future enhancements. The storage abstraction allows for easy migration to production-grade databases, and the API design supports various frontend implementations.

The current implementation is ideal for development and small-scale production use, with clear paths for scaling as needs grow.

