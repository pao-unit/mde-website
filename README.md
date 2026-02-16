# MDE Website

This is the code repository for the MDE website.

## Frontend
The frontend is built with React, TypeScript, Vite, TanStack Router, TanStack Query, OpenAPI-TS/Fetch and Chakra UI.
Data visualization is done using D3.js (for 2D) and React Three Fiber (for 3D).

## Backend
The backend is built with Python (uv), FastAPI and Pydantic.

## Development
1. Implement API in the backend
2. Run the backend server using `cd backend && uv run fastapi dev main.py --reload`
3. Generate the OpenAPI client code using `cd frontend && pnpm generate`
4. Run the frontend server using `pnpm dev`

See also @backend/README.md and @frontend/README.md for more details.
