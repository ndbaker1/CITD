import create from 'zustand'
import { ServerConnection } from '../utils/websocket-client'
import { Mutator } from './provider'

type ServerConnectionStore = {
  connection?: ServerConnection
  setConnection: Mutator<ServerConnection>
}

export const useServerConnection = create<ServerConnectionStore>(set => ({
  setConnection: connection => set({ connection })
}))
