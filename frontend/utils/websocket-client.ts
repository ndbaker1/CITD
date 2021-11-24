import { IMessageEvent, w3cwebsocket as W3CWebSocket } from 'websocket'
import { environment } from '../environment'
import { ClientEvent, ClientEventCode, ServerEvent, ServerEventCode } from './shared-types'


export class ServerConnection {
  private socket: W3CWebSocket | null = null
  private eventHandler: (event: IMessageEvent) => void

  constructor(callbacks: Record<ServerEventCode, (response: ServerEvent) => void>) {
    this.eventHandler = this.create_event_handler(callbacks)
  }

  public connect(user_id: string, callbacks: {
    open: () => void
    close: () => void
    error: (err: any) => void
  }): void {
    const setupConnection = () => {
      this.socket = new W3CWebSocket(`${environment.ws_or_wss}://${environment.apiDomain}/ws/${user_id}`)
      this.socket.onmessage = this.eventHandler
      this.socket.onopen = () => callbacks.open()
      this.socket.onclose = () => callbacks.close()
      this.socket.onerror = (err: any) => callbacks.error(err)
    }
    if (this.socket && this.socket.readyState != this.socket.CLOSED) {
      this.socket.onclose = () => {
        callbacks.close()
        setupConnection()
      }
      this.socket.close()
    } else {
      setupConnection()
    }
  }

  public disconnect(): void {
    this.socket?.close()
  }

  //=====================================
  // Receives Messages from the Server
  //=====================================
  private create_event_handler(callbacks: Record<number, (response: ServerEvent) => void>) {
    return (event: IMessageEvent) => {
      const response: ServerEvent = JSON.parse(event.data as string)
      // console.log('event handler:', response)
      callbacks[response.event_code](response)
    }
  }

  //=====================
  // Public Methods
  //=====================
  public isOpen(): boolean {
    return !!this.socket && this.socket.readyState == this.socket.OPEN
  }

  public play = (column: number): void => this.send_message({
    event_code: ClientEventCode.Play,
    data: { column },
  })
  public create_session = (): void => this.send_message({ event_code: ClientEventCode.CreateSession })
  public leave_session = (): void => this.send_message({ event_code: ClientEventCode.LeaveSession })
  public fetchSession = (): void => this.send_message({ event_code: ClientEventCode.SessionRequest })

  public startGame = (): void => this.send_message({ event_code: ClientEventCode.StartGame })

  public join_session(session_id: string, errorCallback?: (err: string) => void): void {
    const errors = verifySessionID(session_id)
    if (errors) {
      errorCallback && errorCallback(errors)
    } else {
      this.send_message({
        event_code: ClientEventCode.JoinSession,
        data: { session_id },
      })
    }
  }

  //======================================
  // Sends Client Messages to the Server
  //======================================
  private send_message(session_update: ClientEvent) {
    if (!this.socket)
      console.log('socket not connected!')
    else
      this.socket.send(JSON.stringify(session_update))
  }
}

export function verifySessionID(sessionID: string): string {
  const sessionIDLength = 5
  const errors: string[] = []

  if (sessionID.length !== sessionIDLength)
    errors.push(`SessionID needs to be ${sessionIDLength} characters`)

  return errors.join('')
}