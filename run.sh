#!/bin/bash
sh -c 'cd backend && cargo run' & sh -c 'cd frontend && npm i && npm start'