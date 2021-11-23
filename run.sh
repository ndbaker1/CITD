#!/bin/bash
sh -c 'cd backend && cargo watch -x run' & sh -c 'cd frontend && npm i && npm run dev'