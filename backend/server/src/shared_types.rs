/**
 * This file contains type defintions which are shared between the front and back end applications
 */
use derive_builder::Builder;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

#[derive(Serialize, Debug, Clone)]
pub struct GameData {
    pub turn_index: usize,
    pub player_order: Vec<String>,
}

#[derive(Deserialize, Serialize, Builder)]
pub struct Event<Code, PayloadType> {
    pub event_code: Code,
    pub message: Option<String>,
    pub data: Option<PayloadType>,
}

pub type ServerEvent = Event<ServerEventCode, ServerEventData>;
pub type ClientEvent = Event<ClientEventCode, ClientEventData>;

#[derive(Serialize, Clone, Builder)]
pub struct ServerEventData {
    pub session_id: Option<String>,
    pub client_id: Option<String>,
    pub session_client_ids: Option<Vec<String>>,
    pub game_data: Option<GameData>,
}

#[derive(Deserialize, Builder)]
pub struct ClientEventData {
    pub target_ids: Option<Vec<String>>,
    pub session_id: Option<String>,
    pub column: Option<usize>,
}

#[derive(Serialize_repr, Clone)]
#[repr(u8)]
pub enum ServerEventCode {
    /**
     * Session Related
     */
    ClientJoined = 1,
    ClientLeft,
    GameStarted,
    SessionResponse,
    /**
     * Game Related
     */
    TurnStart,
    LogicError,
}

#[derive(Deserialize_repr)]
#[repr(u8)]
pub enum ClientEventCode {
    /**
     * Session Related Events
     */
    JoinSession = 1,
    CreateSession,
    LeaveSession,
    SessionRequest,
    /**
     * Game Related Events
     */
    StartGame,
    Play,
}
