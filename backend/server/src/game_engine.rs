use crate::{
    data_types,
    shared_types::{self, GameData},
    ws::cleanup_session,
};
use connect_in_the_dark::types::{create_game_board, GameState};
use nanoid::nanoid;
use nanorand::{WyRand, RNG};
use serde_json::from_str;
use sessions::session_types;
use std::collections::HashMap;
use warp::ws::Message;

trait ShareableGameData {
    fn as_shared_game_data(&self) -> GameData;
}

impl ShareableGameData for GameState {
    fn as_shared_game_data(&self) -> GameData {
        GameData {
            player_order: self.player_turn_order.clone(),
            turn_index: self.turn_index,
        }
    }
}

/// Handle the Client events from a given Session
pub async fn handle_event(
    client_id: &str,
    event: &str,
    clients: &data_types::SafeClients,
    sessions: &data_types::SafeSessions,
    game_states: &data_types::SafeGameStates,
) {
    //======================================================
    // Deserialize into Session Event object
    //======================================================
    let client_event: shared_types::ClientEvent = match from_str::<shared_types::ClientEvent>(event)
    {
        Ok(obj) => obj,
        Err(_) => {
            eprintln!(
                "[error] failed to parse ClientEvent struct from string: {}",
                event
            );
            return;
        }
    };

    match client_event.event_code {
        shared_types::ClientEventCode::SessionRequest => {
            let session_id: String = match get_client_session_id(client_id, clients).await {
                Some(session_id) => session_id,
                None => return, // no session is ok
            };

            let mut server_event: shared_types::ServerEvent = shared_types::EventBuilder::default()
                .event_code(shared_types::ServerEventCode::SessionResponse)
                .data(Some(
                    shared_types::ServerEventDataBuilder::default()
                        .build()
                        .unwrap(),
                ))
                .build()
                .unwrap();

            if let Some(client) = clients.read().await.get(client_id) {
                if let Some(data) = server_event.data.as_mut() {
                    if let Some(session) = sessions.read().await.get(&session_id) {
                        data.session_client_ids = Some(session.get_client_ids());
                    }
                    if let Some(game_state) = game_states.read().await.get(&session_id) {
                        data.game_data = Some(game_state.as_shared_game_data());
                    }
                }
                notify_client(&server_event, client);
            }
        }
        shared_types::ClientEventCode::CreateSession => {
            let session = &mut session_types::Session {
                client_statuses: HashMap::new(),
                owner: client_id.to_string(),
                id: get_rand_session_id(),
            };
            session.insert_client(&client_id.to_string(), true);

            sessions
                .write()
                .await
                .insert(session.id.clone(), session.clone());

            if let Some(client) = clients.write().await.get_mut(client_id) {
                client.session_id = Some(session.id.clone());
            }

            if let Some(client) = clients.read().await.get(client_id) {
                notify_client(
                    &shared_types::EventBuilder::default()
                        .event_code(shared_types::ServerEventCode::ClientJoined)
                        .data(Some(
                            shared_types::ServerEventDataBuilder::default()
                                .session_id(Some(session.id.clone()))
                                .client_id(Some(client_id.to_string()))
                                .session_client_ids(Some(session.get_client_ids()))
                                .build()
                                .unwrap(),
                        ))
                        .build()
                        .unwrap(),
                    &client,
                );
            }

            println!(
                "[EVENT] created session :: session count: {}",
                sessions.read().await.len()
            );
        }
        shared_types::ClientEventCode::JoinSession => {
            let session_id = match client_event.data {
                Some(data) => match data.session_id {
                    Some(session_id) => session_id,
                    None => panic!("no session id found!"),
                },
                None => return, // no session was found on a session join request? ¯\(°_o)/¯
            };

            remove_client_from_current_session(client_id, clients, sessions, game_states).await;

            if let Some(session) = sessions.write().await.get_mut(&session_id) {
                if game_states.read().await.get(&session_id).is_none() {
                    // do not allow clients to join an active game
                    insert_client_into_given_session(client_id, &clients, session).await;
                }
            } else {
                if let Some(client) = clients.read().await.get(client_id) {
                    notify_client(
                        &shared_types::EventBuilder::default()
                            .message(Some(format!("Invalid SessionID: {}", session_id)))
                            .build()
                            .unwrap(),
                        &client,
                    );
                }
            }
        }
        shared_types::ClientEventCode::LeaveSession => {
            remove_client_from_current_session(client_id, clients, sessions, game_states).await;
        }
        shared_types::ClientEventCode::StartGame => {
            let session_id = match get_client_session_id(client_id, clients).await {
                Some(s_id) => s_id,
                None => return,
            };

            if let Some(session) = sessions.read().await.get(&session_id) {
                match initialize_game_data(&session.get_client_ids()) {
                    Ok(player_turn_order) => {
                        let game_state = GameState {
                            turn_index: 0,
                            player_turn_order,
                            board: create_game_board(5, 5),
                        };

                        game_states
                            .write()
                            .await
                            .insert(session_id.clone(), game_state.clone());

                        // signal the turn start
                        notify_session(
                            &shared_types::EventBuilder::default()
                                .event_code(shared_types::ServerEventCode::TurnStart)
                                .build()
                                .unwrap(),
                            session,
                            clients,
                        )
                        .await;
                    }
                    Err(msg) => {
                        eprintln!("[error] {}", msg);
                        notify_session(
                            &shared_types::EventBuilder::default()
                                .event_code(shared_types::ServerEventCode::LogicError)
                                .message(Some(msg.to_string()))
                                .build()
                                .unwrap(),
                            &session,
                            &clients,
                        )
                        .await;
                    }
                }
            }
        }
        shared_types::ClientEventCode::Play => {
            let session_id: String = match get_client_session_id(client_id, clients).await {
                Some(s_id) => s_id,
                None => return,
            };

            let column = match client_event.data {
                Some(data) => data.column.unwrap(),
                None => return,
            };

            if let Some(game_state) = game_states.write().await.get_mut(&session_id) {
                // incriment index and wrap around
                game_state.turn_index =
                    (game_state.turn_index + 1) % game_state.player_turn_order.len();

                let player_index = match game_state.get_player_index(client_id) {
                    Some(index) => index,
                    None => return,
                };

                match game_state.play(column, player_index) {
                    Ok(_) => {
                        if let Some(session) = sessions.read().await.get(&session_id) {
                            notify_session(
                                &shared_types::EventBuilder::default()
                                    .event_code(shared_types::ServerEventCode::TurnStart)
                                    .data(Some(
                                        shared_types::ServerEventDataBuilder::default()
                                            .client_id(Some(
                                                game_state.player_turn_order[game_state.turn_index]
                                                    .clone(),
                                            ))
                                            .build()
                                            .unwrap(),
                                    ))
                                    .build()
                                    .unwrap(),
                                &session,
                                clients,
                            )
                            .await;
                        }
                    }
                    Err(s) => {}
                }
            }
        }
    }
}

/// Send an update to all clients in the session
///
/// Uses a Read lock on clients
async fn notify_session(
    game_update: &shared_types::ServerEvent,
    session: &session_types::Session,
    clients: &data_types::SafeClients,
) {
    for (client_id, _) in &session.client_statuses {
        if let Some(client) = clients.read().await.get(client_id) {
            notify_client(game_update, client);
        }
    }
}

/// Send and update to a set of clients
async fn notify_clients(
    game_update: &shared_types::ServerEvent,
    client_ids: &Vec<String>,
    clients: &data_types::SafeClients,
) {
    for client_id in client_ids {
        if let Some(client) = clients.read().await.get(client_id) {
            notify_client(game_update, client);
        }
    }
}

/// Send an update to single clients
fn notify_client(game_update: &shared_types::ServerEvent, client: &session_types::Client) {
    let sender = match &client.sender {
        Some(s) => s,
        None => return eprintln!("[error] sender was lost for client: {}", client.id),
    };
    if let Err(e) = sender.send(Ok(Message::text(
        serde_json::to_string(game_update).unwrap(),
    ))) {
        eprintln!(
            "[error] failed to send message to {} with err: {}",
            client.id, e,
        );
    }
}

/// Removes a client from the session that they currently exist under
async fn remove_client_from_current_session(
    client_id: &str,
    clients: &data_types::SafeClients,
    sessions: &data_types::SafeSessions,
    game_states: &data_types::SafeGameStates,
) {
    let session_id: String = match get_client_session_id(client_id, clients).await {
        Some(s_id) => s_id,
        None => return, // client did not exist in any session
    };

    let mut session_empty: bool = false;
    if let Some(session) = sessions.write().await.get_mut(&session_id) {
        // notify all clients in the sessions that the client will be leaving
        notify_session(
            &shared_types::EventBuilder::default()
                .event_code(shared_types::ServerEventCode::ClientLeft)
                .data(Some(
                    shared_types::ServerEventDataBuilder::default()
                        .client_id(Some(client_id.to_string()))
                        .build()
                        .unwrap(),
                ))
                .build()
                .unwrap(),
            &session,
            &clients,
        )
        .await;
        // remove the client from the session
        session.remove_client(&client_id.to_string());
        // revoke the client's copy of the session_id
        if let Some(client) = clients.write().await.get_mut(client_id) {
            client.session_id = None;
        }
        // checks the statuses to see if any users are still active
        session_empty = session.get_clients_with_active_status(true).is_empty();
        // if the session is not empty, make someone else the owner
        if !session_empty {
            set_new_session_owner(session, &clients, &session.get_client_ids()[0]);
        }
    }
    // clean up the session from the map if it is empty
    // * we cannot do this in the scope above because because we are already holding a mutable reference to a session within the map
    if session_empty {
        cleanup_session(&session_id, sessions, game_states).await;
    }
}

/// Takes a mutable session reference in order to add a client to a given session
///
/// Uses a Read lock for Clients
async fn insert_client_into_given_session(
    client_id: &str,
    clients: &data_types::SafeClients,
    session: &mut session_types::Session,
) {
    // add client to session
    session.insert_client(client_id, true);
    // update session_id of client
    if let Some(client) = clients.write().await.get_mut(client_id) {
        client.session_id = Some(session.id.clone());
    }
    // notify all clients in the session that the client has joined
    notify_session(
        &shared_types::EventBuilder::default()
            .event_code(shared_types::ServerEventCode::ClientJoined)
            .data(Some(
                shared_types::ServerEventDataBuilder::default()
                    .session_id(Some(session.id.clone()))
                    .client_id(Some(client_id.to_string()))
                    .session_client_ids(Some(session.get_client_ids()))
                    .build()
                    .unwrap(),
            ))
            .build()
            .unwrap(),
        &session,
        &clients,
    )
    .await;
}

fn set_new_session_owner(
    session: &mut session_types::Session,
    _clients: &data_types::SafeClients,
    client_id: &String,
) {
    session.owner = client_id.clone();
    // notify_all_clients(
    //   &ServerEvent {
    //     event_code: ServerEventCode::SessionOwnerChange,
    //     session_id: Some(session.id.clone()),
    //     client_id: Some(client_id.clone()),
    //     session_client_ids: None,
    //   },
    //   &session,
    //   &clients,
    // );
}

fn initialize_game_data(client_vec: &Vec<String>) -> Result<Vec<String>, &str> {
    // random gen for shuffling
    let mut rand = WyRand::new();
    // shuffle the order characters
    let mut playerinfo_vec: Vec<String> = client_vec.clone();
    rand.shuffle(&mut playerinfo_vec);

    return Ok(playerinfo_vec);
}

/// Gets a random new session 1 that is 5 characters long
/// This should almost ensure session uniqueness when dealing with a sizeable number of sessions
fn get_rand_session_id() -> String {
    let alphabet: [char; 26] = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
        'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    ];
    nanoid!(5, &alphabet)
}

/// pull the session id off of a client
async fn get_client_session_id(
    client_id: &str,
    clients: &data_types::SafeClients,
) -> Option<String> {
    if let Some(client) = &clients.read().await.get(client_id) {
        client.session_id.clone()
    } else {
        None
    }
}
