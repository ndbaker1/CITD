import create from 'zustand'
import { Accessor, Mutator } from './provider'

export enum Screen {
  Login,
  Menu,
  Lobby,
  Game,
}

type ScreenState = {
  screen: Screen
}

type ScreenStateStore = {
  data: ScreenState
  getScreen: Accessor<ScreenState['screen']>
  setScreen: Mutator<ScreenState['screen']>
}

export const useScreen = create<ScreenStateStore>((set, get) => ({
  data: { screen: Screen.Login },
  getScreen: () => get().data.screen,
  setScreen: screen => set(state => { state.data.screen = screen }),
}))
