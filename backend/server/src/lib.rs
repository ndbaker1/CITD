use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use warp::filters::BoxedFilter;
use warp::{Filter, Reply};

mod data_types;
mod game_engine;
mod handler;
mod shared_types;
mod ws;

/// Composite backend and frontend routes for the entire server
pub fn server() -> BoxedFilter<(impl Reply,)> {
    warp::path("api").and(backend()).or(frontend()).boxed()
}

/// Routes handling server requests and connections
fn backend() -> BoxedFilter<(impl Reply,)> {
    let clients: data_types::SafeClients = Arc::new(RwLock::new(HashMap::new()));
    let sessions: data_types::SafeSessions = Arc::new(RwLock::new(HashMap::new()));
    let game_states: data_types::SafeGameStates = Arc::new(RwLock::new(HashMap::new()));

    let health = warp::path!("health").and_then(handler::health_handler);

    let socket = warp::path("ws")
        .and(warp::ws())
        .and(warp::path::param())
        // pass copies of our references for the client and sessions maps to our handler
        .and(warp::any().map(move || clients.clone()))
        .and(warp::any().map(move || sessions.clone()))
        .and(warp::any().map(move || game_states.clone()))
        .and_then(handler::ws_handler);

    health.or(socket).boxed()
}

/// Routes for serving static website files
fn frontend() -> BoxedFilter<(impl Reply,)> {
    warp::fs::dir("dist").boxed()
}
