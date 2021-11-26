#!/bin/bash
PORT=8000
fontend-env="NEXT_PUBLIC_API_DOMAIN='localhost:8000/api'"

sh -c 'cd backend && cargo watch -x run' \
& sh -c 'cd frontend && npm i && NEXT_PUBLIC_API_DOMAIN="localhost:8000/api" npm run dev'