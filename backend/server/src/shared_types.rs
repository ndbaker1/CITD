/**
 * This file contains type defintions which are shared between the front and back end applications
 */
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

#[derive(Serialize)]
pub struct ServerEventData {
    pub session_id: Option<String>,
    pub client_id: Option<String>,
    pub session_client_ids: Option<Vec<String>>,
    pub game_data: Option<GameData>,
}

#[derive(Serialize, Debug, Clone)]
pub struct GameData {
    pub turn_index: usize,
    pub player_order: Vec<String>,
}

#[derive(Serialize)]
pub struct ServerEvent {
    pub event_code: ServerEventCode,
    pub message: Option<String>,
    pub data: Option<ServerEventData>,
}

#[derive(Serialize_repr)]
#[repr(u8)]
pub enum ServerEventCode {
    // session_id, client_id, session_client_ids
    ClientJoined = 1,
    // client_id
    ClientLeft,
    GameStarted,
    // session_id, session_client_ids
    DataResponse,
    // client_id
    TurnStart,
    LogicError,
}

#[derive(Deserialize)]
pub struct ClientEvent {
    pub event_code: ClientEventCode,
    pub target_ids: Option<Vec<String>>,
    pub session_id: Option<String>,
}

#[derive(Deserialize_repr)]
#[repr(u8)]
pub enum ClientEventCode {
    // session_id
    JoinSession = 1,
    CreateSession,
    LeaveSession,
    DataRequest,
    StartGame,
    EndTurn,
    PlayCard,
    StateResponse,
}
