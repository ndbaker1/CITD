import create from 'zustand'
import { Accessor, Mutator } from './provider'

type SessionData = {
  session: string
  user: string
  users: string[]
  logs: string[]
}

type SessionDataStore = {
  data: SessionData

  getSession: Accessor<SessionData['session']>
  getUser: Accessor<SessionData['user']>
  getUsers: Accessor<SessionData['users']>
  getLogs: Accessor<SessionData['logs']>

  setSession: Mutator<SessionData['session']>
  setUser: Mutator<SessionData['user']>
  setUsers: Mutator<SessionData['users']>
  log: Mutator<string>
}

export const useSessionData = create<SessionDataStore>((set, get) => ({
  data: {
    session: '',
    user: '',
    users: [],
    logs: [],
  },

  getSession: () => get().data.session,
  getUser: () => get().data.user,
  getUsers: () => get().data.users,
  getLogs: () => get().data.logs,

  setSession: session => set(state => { state.data.session = session }),
  setUser: user => set(state => { state.data.user = user }),
  setUsers: users => set(state => { state.data.users = users }),
  log: log => set(state => {
    console.log(log)
    state.data.logs = [...state.data.logs, log]
  }),
}))
