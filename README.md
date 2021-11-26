# Connect In The Dark

A Modification of Connect-Four where you can't see moves that other players take

## Development
`Rust-`[`warp`](https://github.com/seanmonstar/warp) backend 

`TypeScript-`[`NextJS`](https://nextjs.org/) frontend

run the development server with change-detection:
> Uses [`cargo-watch`](https://github.com/watchexec/cargo-watch) to monitor rust changes, and the provided builder for NextJS 
```bash
# Default PORTS:
#   frontend  3000
#   backend   8000
./dev.sh
```

## Config
- `PORT`: The listening port of the server (default is 8000).

## Deployment
The app is built into a Docker image for deployment on cloud platforms.

Build and run the image locally to test.  
Exposes the server to port 80, so that you can visit the app at 
[http://localhost](http://localhost)
```bash
./docker_build.sh
```

## Gameplay
![gameplay ui](./assets/grid.png)