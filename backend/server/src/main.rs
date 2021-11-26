use server::server;
use std::env;
use warp::Filter;

const FRONTEND_DEV: &str = "http://localhost:3000";

#[tokio::main]
async fn main() {
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| String::from("8000"))
        .parse()
        .expect("PORT must be a number");

    let server = server().with(warp::cors().allow_origin(FRONTEND_DEV));

    println!("[BOOT] server starting on port::{}", port);
    warp::serve(server).run(([0, 0, 0, 0], port)).await;
}
