import create from 'zustand'
import { GameData } from '../utils/shared-types'
import { Accessor, Mutator } from './provider'


type GameDataStore = {
  data: GameData

  getPlayerOrder: Accessor<GameData['player_order']>
  getTurnIndex: Accessor<GameData['turn_index']>

  setPlayerOrder: Mutator<GameData['player_order']>
  setTurnIndex: Mutator<GameData['turn_index']>
}

export const useGameData = create<GameDataStore>((set, get) => ({
  data: {
    play_indexes: [],
    player_order: [],
    turn_index: 0
  },

  getPlayerOrder: () => get().data.player_order,
  getTurnIndex: () => get().data.turn_index,

  setPlayerOrder: playerOrder => set(state => { state.data.player_order = playerOrder }),
  setTurnIndex: turnIndex => set(state => { state.data.turn_index = turnIndex }),
}))

