#!/bin/bash
PORT=8080

sh -c "cd backend && PORT=$PORT cargo watch -x run" \
& sh -c "cd frontend && npm i && NEXT_PUBLIC_API_DOMAIN='localhost:$PORT/api' npm run dev"