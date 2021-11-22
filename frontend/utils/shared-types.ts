/**
 * This file contains type defintions which are shared between the front and back end applications
 */

export type GameData = {
     turn_index: number,
     player_order: Array<string>,
}

export type Event<Code, PayloadType> = {
     event_code: Code,
     message?: string,
     data?: PayloadType,
}

export type ServerEvent = Event<ServerEventCode, ServerEventData>
export type ClientEvent = Event<ClientEventCode, ClientEventData>

export type ServerEventData = {
     session_id?: string,
     client_id?: string,
     session_client_ids?: Array<string>,
     game_data?: GameData,
}

export type ClientEventData = {
     target_ids?: Array<string>,
     session_id?: string,
     column?: number,
}

export enum ServerEventCode {
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

export enum ClientEventCode {
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
