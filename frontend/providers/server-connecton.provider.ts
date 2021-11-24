import create from 'zustand'
import { ServerConnection } from '../utils/websocket-client'
import { useNotify } from './notification.provider'
import { Mutator } from './provider'
import { useSessionData } from './session.provider'

type ServerConnectionStore = {
  connection?: ServerConnection
  setConnection: Mutator<ServerConnection>
}

export const useServerConnection = create<ServerConnectionStore>(set => ({
  setConnection: connection => set({ connection })
}))


type LoginEvents = {
  success?: () => void,
  failure?: () => void,
  close?: () => void
}

export function useLogin() {

  const notify = useNotify()
  const { setUser } = useSessionData()
  const { connection } = useServerConnection()

  return ({
    user,
    success = () => 0,
    failure = () => 0,
    close = () => 0,
  }:
    { user: string } & LoginEvents
  ) => {
    connection?.connect(user, {
      open: () => {
        notify('Connected.')
        localStorage.setItem('userid', user)
        connection.fetchSession()
        success()
      },
      error: () => {
        notify('Error: ID may already be taken.')
        failure()
      },
      close: () => {
        notify('Disconnected..')
        close()
      },
    })
  }
}