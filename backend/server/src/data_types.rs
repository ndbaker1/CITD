use connect_in_the_dark::types::GameState;
use sessions::session_types::{Clients, Sessions};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::RwLock;

pub type GameStates = HashMap<String, GameState>;

pub type SafeResource<T> = Arc<RwLock<T>>;

pub type SafeClients = SafeResource<Clients>;
pub type SafeSessions = SafeResource<Sessions>;
pub type SafeGameStates = SafeResource<GameStates>;
