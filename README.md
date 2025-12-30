# X-Ray System

An X-Ray library and dashboard for debugging non-deterministic, multi-step algorithmic systems. Provides complete transparency into decision processes by capturing context at each step: inputs, candidates, filters, outcomes, and reasoning.

## How to Run

### Prerequisites

- Python 3.11+
- Node.js 18+

### Quick Start

```bash
# 1. Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# 2. Install Python dependencies
cd backend && pip install -r requirements.txt && cd ..
pip install -e .
cd demo && pip install -r requirements.txt && cd ..

# 3. Install Node.js dependencies
cd frontend && npm install && cd ..

# 4. Run backend (Terminal 1)
source venv/bin/activate
cd backend && python main.py

# 5. Run frontend (Terminal 2)
cd frontend && npm run dev

# 6. Access the application
# Dashboard: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

For detailed setup instructions, see [RUN.md](RUN.md).

## Future Improvements & Trade-offs

### Current Trade-offs

**JSON File Storage vs. Database**
- **Current**: Simple JSON file storage requires zero setup and works out of the box
- **Trade-off**: No concurrent writes, limited querying capabilities, no built-in indexing
- **Future**: PostgreSQL backend for production use cases requiring concurrent access and complex queries

**Client-Side Rendering vs. Server-Side**
- **Current**: Dashboard fetches data client-side for simplicity
- **Trade-off**: Can't optimize with caching or incremental loading
- **Future**: Server-side rendering (SSR) or framework like Remix for better performance

**Minimal Demo Data vs. Real-World Scale**
- **Current**: 3 products to focus on algorithmic approach
- **Trade-off**: Filtering and ranking logic is simpler than production needs
- **Future**: Scale testing with larger datasets and more complex scenarios

**Manual Refresh vs. Real-Time Updates**
- **Current**: Dashboard requires manual refresh to see new executions
- **Trade-off**: No live updates, less engaging for monitoring
- **Future**: WebSocket support for real-time execution tracking

### Planned Improvements

**Performance**
- Server-side rendering for faster initial loads
- Pagination for executions list
- Caching strategies for frequently accessed data

**SDK Enhancements**
- Async support for concurrent step tracking
- Execution snapshots for querying historical state
- Built-in metrics aggregation (average step duration, failure rates, common failure patterns)

**Dashboard Features**
- Timeline visualization showing step execution
- Decision trees for multi-branch workflows
- Comparison views to see how different executions differ
- Search functionality to find executions by metadata
- Export capabilities for compliance and debugging

**Production Readiness**
- Authentication and authorization
- Rate limiting and proper error handling with retries
- Database backend with migrations
- Additional storage backends (Redis for fast access, S3 for long-term archival)

**Testing**
- Comprehensive unit tests for the SDK
- Integration tests for the demo workflow
- E2E tests for the dashboard

**Visualization**
- Graphs showing performance metrics over time
- Decision tree visualization for complex workflows
- Comparison mode for side-by-side execution analysis
