use crate::{
    data_types,
    shared_types::{
        ClientEvent, ClientEventCode, EventBuilder, GameData, ServerEvent, ServerEventCode,
        ServerEventDataBuilder,
    },
    ws::cleanup_session,
};
use connect_in_the_dark::types::{create_game_board, GameState};
use nanoid::nanoid;
use nanorand::{Rng, WyRand};
use serde_json::from_str;
use sessions::session_types;
use std::{collections::HashMap, usize::MAX};
use warp::ws::Message;

trait ShareableGameData {
    fn as_shared_game_data(&self, player_pov: Option<&str>) -> GameData;
}

impl ShareableGameData for GameState {
    fn as_shared_game_data(&self, player_pov: Option<&str>) -> GameData {
        GameData {
            play_indexes: match player_pov {
                None => self.board.clone(),
                Some(client_id) => {
                    let player_index = self.get_player_index(client_id).unwrap();
                    self.board
                        .iter()
                        .map(|col| {
                            col.iter()
                                .map(|ele| match *ele >= self.player_turn_order.len() {
                                    true => MAX,
                                    false => match self.player_turn_order[*ele] == client_id {
                                        true => player_index,
                                        false => MAX,
                                    },
                                })
                                .collect()
                        })
                        .collect()
                }
            },
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
    let client_event = match from_str::<ClientEvent>(event) {
        Ok(obj) => obj,
        Err(_) => {
            eprintln!(
                "[ERROR] failed to parse ClientEvent struct from string: {}",
                event
            );
            return;
        }
    };

    match client_event.event_code {
        ClientEventCode::SessionRequest => {
            let session_id: String = match get_client_session_id(client_id, clients).await {
                Some(session_id) => session_id,
                None => return, // no session is ok
            };

            // create a base server event
            let mut server_event: ServerEvent = EventBuilder::default()
                .event_code(ServerEventCode::SessionResponse)
                .data(
                    ServerEventDataBuilder::default()
                        .session_id(session_id.clone())
                        .build()
                        .unwrap(),
                )
                .build()
                .unwrap();

            if let Some(client) = clients.read().await.get(client_id) {
                if let Some(data) = server_event.data.as_mut() {
                    if let Some(session) = sessions.read().await.get(&session_id) {
                        data.session_client_ids = Some(session.get_client_ids());
                    }
                    if let Some(game_state) = game_states.read().await.get(&session_id) {
                        data.game_data = Some(game_state.as_shared_game_data(Some(client_id)));
                    }
                }
                notify_client(&server_event, client);
            }
        }
        ClientEventCode::CreateSession => {
            println!("[INFO] request from {} to create new session", client_id);
            create_session(client_id, None, &sessions, &clients).await;
        }
        ClientEventCode::JoinSession => {
            println!("[INFO] request from {} to join new session", client_id);

            let session_id = match client_event.data {
                Some(data) => match data.session_id {
                    Some(session_id) => session_id,
                    None => panic!("no session id found!"),
                },
                None => {
                    println!("[ERROR] the session id to join was missing in the request");
                    return;
                } // no session was found on a session join request? ¯\(°_o)/¯
            };

            remove_client_from_current_session(client_id, clients, sessions, game_states).await;

            // Joining Some Session that already exists

            if let Some(session) = sessions.write().await.get_mut(&session_id) {
                // do not allow clients to join an active game
                if game_states.read().await.get(&session_id).is_none() {
                    println!(
                        "[INFO] adding client {} into session {}",
                        client_id, session_id
                    );
                    insert_client_into_given_session(client_id, &clients, session).await;
                }
                return;
            }
            // Attempt to join a Reserved session, which will be created if it doesnt exist
            println!("[INFO] creating a session from id: {}", session_id);
            create_session(client_id, Some(&session_id), &sessions, &clients).await;
        }
        ClientEventCode::LeaveSession => {
            remove_client_from_current_session(client_id, clients, sessions, game_states).await;
        }
        ClientEventCode::StartGame => {
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
                            board: create_game_board(7, 6),
                        };

                        game_states
                            .write()
                            .await
                            .insert(session_id.clone(), game_state.clone());

                        // signal the turn start
                        notify_session(
                            &EventBuilder::default()
                                .event_code(ServerEventCode::GameStarted)
                                .data(
                                    ServerEventDataBuilder::default()
                                        .game_data(game_state.as_shared_game_data(Some(client_id)))
                                        .build()
                                        .unwrap(),
                                )
                                .build()
                                .unwrap(),
                            session,
                            clients,
                        )
                        .await;

                        // signal the turn start
                        notify_session(
                            &EventBuilder::default()
                                .event_code(ServerEventCode::TurnStart)
                                .data(
                                    ServerEventDataBuilder::default()
                                        .client_id(game_state.get_turn_player())
                                        .game_data(game_state.as_shared_game_data(Some(client_id)))
                                        .build()
                                        .unwrap(),
                                )
                                .build()
                                .unwrap(),
                            session,
                            clients,
                        )
                        .await;
                    }
                    Err(msg) => {
                        eprintln!("[ERROR] {}", msg);
                        notify_session(
                            &EventBuilder::default()
                                .event_code(ServerEventCode::LogicError)
                                .message(msg.to_string())
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
        ClientEventCode::Play => {
            let session_id: String = match get_client_session_id(client_id, clients).await {
                Some(s_id) => s_id,
                None => return,
            };

            let column = match client_event.data {
                Some(data) => data.column.unwrap(),
                None => return,
            };

            if let Some(game_state) = game_states.write().await.get_mut(&session_id) {
                if game_state.get_turn_player() != client_id {
                    if let Some(client) = clients.read().await.get(client_id) {
                        notify_client(
                            &EventBuilder::default()
                                .event_code(ServerEventCode::LogicError)
                                .message("It is not your turn to play.")
                                .build()
                                .unwrap(),
                            &client,
                        );
                    }
                    // exit
                    return;
                }

                let player_index = match game_state.get_player_index(client_id) {
                    Some(index) => index,
                    None => return,
                };

                match game_state.play(column, player_index) {
                    Ok(won) => {
                        if let Some(session) = sessions.read().await.get(&session_id) {
                            // if the move was a winning move, then notify everyone that the game is over
                            if won {
                                notify_session(
                                    &EventBuilder::default()
                                        .event_code(ServerEventCode::GameEnded)
                                        .data(
                                            ServerEventDataBuilder::default()
                                                .client_id(client_id)
                                                .game_data(game_state.as_shared_game_data(None))
                                                .build()
                                                .unwrap(),
                                        )
                                        .build()
                                        .unwrap(),
                                    session,
                                    &clients,
                                )
                                .await;
                            }
                            // else continue emitting the game format
                            else {
                                for (client_name, _) in &session.client_statuses {
                                    if let Some(client) = clients.read().await.get(client_name) {
                                        notify_client(
                                            &EventBuilder::default()
                                                .event_code(ServerEventCode::TurnStart)
                                                .data(
                                                    ServerEventDataBuilder::default()
                                                        .client_id(game_state.get_turn_player())
                                                        .game_data(
                                                            game_state.as_shared_game_data(Some(
                                                                client_name,
                                                            )),
                                                        )
                                                        .build()
                                                        .unwrap(),
                                                )
                                                .build()
                                                .unwrap(),
                                            &client,
                                        );
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        if let Some(client) = clients.read().await.get(client_id) {
                            notify_client(
                                &EventBuilder::default()
                                    .event_code(ServerEventCode::LogicError)
                                    .message("This column has reached its max.".to_string())
                                    .build()
                                    .unwrap(),
                                &client,
                            );
                        }
                        eprintln!(
                            "[ERROR] player {} failed to play with err: {}",
                            client_id, e,
                        )
                    }
                }
            }
        }
    }
}

/// Creates a Session with a given Client as its creator / first member
async fn create_session(
    client_id: &str,
    session_id: Option<&str>,
    sessions: &data_types::SafeSessions,
    clients: &data_types::SafeClients,
) {
    println!("[INFO] creating session");
    let session = &mut session_types::Session {
        client_statuses: HashMap::new(),
        owner: client_id.to_string(),
        id: match session_id {
            Some(id) => id.to_string(),
            None => get_rand_session_id(),
        },
    };

    // insert the host client into the session
    session.insert_client(&client_id.to_string(), true);

    println!(
        "[INFO] writing new session {} to global sessions",
        session.id
    );
    // add a new session into the server
    sessions
        .write()
        .await
        .insert(session.id.clone(), session.clone());

    println!(
        "[INFO] attaching session {} to client {}",
        session.id, client_id
    );
    // update the session reference within the client
    if let Some(client) = clients.write().await.get_mut(client_id) {
        client.session_id = Some(session.id.clone());
    }

    println!("[INFO] send notification to client {}", client_id);
    if let Some(client) = clients.read().await.get(client_id) {
        notify_client(
            &EventBuilder::default()
                .event_code(ServerEventCode::ClientJoined)
                .data(
                    ServerEventDataBuilder::default()
                        .session_id(session.id.clone())
                        .client_id(client_id.to_string())
                        .session_client_ids(session.get_client_ids())
                        .build()
                        .unwrap(),
                )
                .build()
                .unwrap(),
            &client,
        );
    }
    println!("[INFO] finished creating session {}", session.id);
    println!("[INFO] sessions live: {}", sessions.read().await.len());
}

/// Send an update to all clients in the session
///
/// Uses a Read lock on clients
async fn notify_session(
    game_update: &ServerEvent,
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
async fn _notify_clients(
    game_update: &ServerEvent,
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
fn notify_client(game_update: &ServerEvent, client: &session_types::Client) {
    let sender = match &client.sender {
        Some(s) => s,
        None => return eprintln!("[ERROR] sender was lost for client: {}", client.id),
    };
    if let Err(e) = sender.send(Ok(Message::text(
        serde_json::to_string(game_update).unwrap(),
    ))) {
        eprintln!(
            "[ERROR] failed to send message to {} with err: {}",
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
    println!(
        "[INFO] attempting to remove client {} from their current session",
        client_id
    );

    let session_id: String = match get_client_session_id(client_id, clients).await {
        Some(s_id) => s_id,
        None => {
            println!("[SKIP] client {} was not in a session", client_id);
            return;
        } // client did not exist in any session
    };

    let mut session_empty: bool = false;
    if let Some(session) = sessions.write().await.get_mut(&session_id) {
        // notify all clients in the sessions that the client will be leaving
        notify_session(
            &EventBuilder::default()
                .event_code(ServerEventCode::ClientLeft)
                .data(
                    ServerEventDataBuilder::default()
                        .client_id(client_id.to_string())
                        .build()
                        .unwrap(),
                )
                .build()
                .unwrap(),
            &session,
            &clients,
        )
        .await;
        // remove the client from the session
        session.remove_client(&client_id.to_string());

        println!(
            "[INFO] removed client {} from session {}",
            client_id, session_id
        );

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
        &EventBuilder::default()
            .event_code(ServerEventCode::ClientJoined)
            .data(
                ServerEventDataBuilder::default()
                    .session_id(session.id.clone())
                    .client_id(client_id.to_string())
                    .session_client_ids(session.get_client_ids())
                    .build()
                    .unwrap(),
            )
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

/// Attempt to create a new game if the lobby has enough players
fn initialize_game_data(client_vec: &Vec<String>) -> Result<Vec<String>, &str> {
    // Check that the game has at least 2 players
    match client_vec.len() >= 2 {
        false => Err("Need at least 2 players to start a game."),
        true => {
            // random gen for shuffling
            let mut rand = WyRand::new();
            // shuffle the order characters
            let mut playerinfo_vec = client_vec.clone();
            rand.shuffle(&mut playerinfo_vec);

            Ok(playerinfo_vec)
        }
    }
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
