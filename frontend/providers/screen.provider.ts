import create from 'zustand'
import { Accessor, Mutator } from './provider'

export enum Screen { Login, Menu, Lobby, Game, QuickJoin }

type ScreenState = Screen

type ScreenStateStore = {
  screenState: ScreenState
  getScreen: Accessor<ScreenState>
  setScreen: Mutator<ScreenState>
}

export const useScreen = create<ScreenStateStore>((set, get): ScreenStateStore => ({
  screenState: Screen.Login,
  getScreen: () => get().screenState,
  setScreen: screen => set(state => { state.screenState = screen }),
}))
