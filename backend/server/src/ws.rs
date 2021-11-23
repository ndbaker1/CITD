use crate::{data_types, game_engine};
use futures::{FutureExt, StreamExt};
use sessions::session_types;
use tokio::sync::mpsc::{self};
use urlencoding::decode;
use warp::ws::{Message, WebSocket};

/// The Initial Setup for a WebSocket Connection
pub async fn client_connection(
    ws: WebSocket,
    connection_id: String,
    clients: data_types::SafeClients,
    sessions: data_types::SafeSessions,
    game_states: data_types::SafeGameStates,
) {
    // Decode the strings coming in over URL parameters so we dont get things like '%20'
    // for spaces in our clients map
    let id = decode(&connection_id).expect("UTF-8").to_string();
    //======================================================
    // Splits the WebSocket into a Sink + Stream:
    // Sink - Pools the messages to get send to the client
    // Stream - receiver of messages from the client
    //======================================================
    let (client_ws_sender, mut client_ws_rcv) = ws.split();
    //======================================================
    // Gets an Unbounced Channel that can transport messages
    // between asynchronous tasks:
    // Sender - front end of the channel
    // Receiver - recieves the sender messages
    //======================================================
    let (client_sender, client_rcv) = mpsc::unbounded_channel();
    //======================================================
    // Spawn a thread to forward messages
    // from our channel into our WebSocket Sink
    // between asynchronous tasks using the same Client object
    //======================================================
    tokio::task::spawn(client_rcv.forward(client_ws_sender).map(|result| {
        if let Err(e) = result {
            eprintln!("[ERROR] failed to send websocket msg: {}", e);
        }
    }));
    //======================================================
    // From now on we can use our client_sender.send(val: T)
    // to send messages to a given client websocket
    //======================================================

    //======================================================
    // Create a new Client and insert them into the Map
    //======================================================
    clients.write().await.insert(
        id.clone(),
        session_types::Client {
            id: id.clone(),
            sender: Some(client_sender),
            session_id: get_client_session_id(&id, &sessions).await,
        },
    );

    if let Some(client) = clients.read().await.get(&id) {
        handle_client_connect(&client, &sessions).await;
    }
    //======================================================
    // Synchronously wait for messages from the
    // Client Receiver Stream until an error occurs
    //======================================================
    while let Some(result) = client_ws_rcv.next().await {
        // Check that there was no error actually obtaining the Message
        match result {
            Ok(msg) => {
                handle_client_msg(&id, msg, &clients, &sessions, &game_states).await;
            }
            Err(e) => {
                eprintln!(
                    "[ERROR] failed to recieve websocket message for id: {} :: error: {}",
                    id.clone(),
                    e,
                );
            }
        }
    }
    //======================================================
    // Remove the Client from the Map
    // when they are finished using the socket (or error)
    //======================================================
    if let Some(client) = clients.write().await.remove(&id) {
        handle_client_disconnect(&client, &sessions, &game_states).await;
    }
}

/// Handle messages from an open receiving websocket
async fn handle_client_msg(
    id: &str,
    msg: Message,
    clients: &data_types::SafeClients,
    sessions: &data_types::SafeSessions,
    game_states: &data_types::SafeGameStates,
) {
    //======================================================
    // Ensure the Message Parses to String
    //======================================================
    let message = match msg.to_str() {
        Ok(v) => v,
        Err(_) => {
            eprintln!("[WARN] websocket message: '{:?}' was not handled", msg);
            return;
        }
    };

    match message {
        //======================================================
        // ignore pings
        //======================================================
        "ping" | "ping\n" => {
            println!("[INFO] ignoring ping...");
        }
        //======================================================
        // Game Session Related Events
        //======================================================
        _ => {
            game_engine::handle_event(id, message, clients, sessions, game_states).await;
        }
    }
}

/// If a client exists in a session, then set their status to inactive.
///
/// If setting inactive status would leave no other active member, remove the session
async fn handle_client_disconnect(
    client: &session_types::Client,
    sessions: &data_types::SafeSessions,
    game_states: &data_types::SafeGameStates,
) {
    println!("[INFO] {} disconnected", client.id);
    if let Some(session_id) = &client.session_id {
        let mut session_empty = false;
        // remove the client from the session and check if the session become empty
        if let Some(session) = sessions.write().await.get_mut(session_id) {
            session.set_client_active_status(&client.id, false);
            session_empty = session.get_clients_with_active_status(true).is_empty();
        }
        // remove the session if empty
        if session_empty {
            cleanup_session(session_id, sessions, game_states).await;
        }
    }
}

/// If a client exists in a session, then set their status to active
async fn handle_client_connect(
    client: &session_types::Client,
    sessions: &data_types::SafeSessions,
) {
    println!("[INFO] {} connected", client.id);
    if let Some(session_id) = &client.session_id {
        if let Some(session) = sessions.write().await.get_mut(session_id) {
            session.set_client_active_status(&client.id, true);
        }
    }
}

/// Gets the SessionID of a client if it exists
async fn get_client_session_id(
    client_id: &str,
    sessions: &data_types::SafeSessions,
) -> Option<String> {
    for session in sessions.read().await.values() {
        if session.contains_client(client_id) {
            return Some(session.id.clone());
        }
    }
    return None;
}

/// Remove a sessions and the possible game state that accompanies it
pub async fn cleanup_session(
    session_id: &str,
    sessions: &data_types::SafeSessions,
    game_states: &data_types::SafeGameStates,
) {
    // remove session
    sessions.write().await.remove(session_id);
    // remove possible game state
    game_states.write().await.remove(session_id);
    // log
    println!(
        "[INFO] removed empty session :: remaining session count: {}",
        sessions.read().await.len()
    );
}
