## Server

This is a `Rust` server built using [`warp`](https://github.com/seanmonstar/warp) in order to interacti with `WebSockets`.

## Getting Started

Startup the server with
```bash
cargo run
```

## Structure

This server is a workspace with 3 components
- [Game Logic Library](./connect_in_the_dark)
- [Client & Session Library](./sessions)
- [Executable Server Package](./server)