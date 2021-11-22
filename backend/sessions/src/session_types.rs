use std::collections::HashMap;
use tokio::sync::mpsc;
use warp::ws::Message;

pub type Clients = HashMap<String, Client>;
pub type Sessions = HashMap<String, Session>;

/// Data Stored for a Single User
#[derive(Debug, Clone)]
pub struct Client {
    pub id: String,
    pub session_id: Option<String>,
    pub sender: Option<mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>>,
}

/// Data Stored for a Game Sessions
#[derive(Debug, Clone)]
pub struct Session {
    pub id: String,
    pub owner: String,
    pub client_statuses: HashMap<String, bool>,
}
impl Session {
    pub fn get_num_clients(&self) -> usize {
        self.client_statuses.len()
    }
    pub fn contains_client(&self, id: &str) -> bool {
        self.client_statuses.contains_key(id)
    }
    pub fn get_client_ids(&self) -> Vec<String> {
        self.client_statuses
            .clone()
            .into_iter()
            .map(|(id, _)| id)
            .collect::<Vec<String>>()
    }
    pub fn remove_client(&mut self, id: &str) {
        self.client_statuses.remove(id);
    }
    pub fn insert_client(&mut self, id: &str, is_active: bool) {
        self.client_statuses.insert(id.to_string(), is_active);
    }
    pub fn get_clients_with_active_status(&self, active_status: bool) -> Vec<String> {
        self.client_statuses
            .clone()
            .into_iter()
            .filter(|(_, status)| status == &active_status)
            .map(|(id, _)| id)
            .collect::<Vec<String>>()
    }
    pub fn set_client_active_status(&mut self, id: &str, is_active: bool) {
        if self.client_statuses.get(id).is_some() {
            self.client_statuses.insert(id.to_string(), is_active);
        } else {
            println!(
                "[WARN] tried to set active_status of client: {} but id was not found in session",
                id
            );
        }
    }
}
