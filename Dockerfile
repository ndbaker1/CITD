FROM rust:alpine as backend
WORKDIR /home/rust/src
RUN apk --no-cache add musl-dev openssl-dev
COPY ./backend .
RUN cargo test --release
RUN cargo build --release

FROM node:lts-alpine as frontend
WORKDIR /usr/src/app
COPY ./frontend .
RUN npm ci
RUN npm run build

FROM scratch as deployment
COPY --from=frontend /usr/src/app/out dist
COPY --from=backend /home/rust/src/target/release/server .
EXPOSE 8000
CMD [ "./server" ]