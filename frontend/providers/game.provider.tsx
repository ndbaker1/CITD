import create from 'zustand'
import { GameData } from '../utils/shared-types'
import { Accessor, Mutator } from './provider'


type GameDataStore = {
  data: GameData

  getPlayerOrder: Accessor<GameData['player_order']>
  getPlayIndexes: Accessor<GameData['play_indexes']>
  getTurnIndex: Accessor<GameData['turn_index']>

  setPlayerOrder: Mutator<GameData['player_order']>
  setPlayIndexes: Mutator<GameData['play_indexes']>
  setTurnIndex: Mutator<GameData['turn_index']>
}

export const useGameData = create<GameDataStore>((set, get): GameDataStore => ({
  data: {
    turn_index: 0,
    player_order: [],
    play_indexes: [],
  },

  getPlayerOrder: () => get().data.player_order,
  getPlayIndexes: () => get().data.play_indexes,
  getTurnIndex: () => get().data.turn_index,

  setPlayerOrder: playerOrder => set(state => { state.data.player_order = playerOrder }),
  setPlayIndexes: playIndexes => set(state => { state.data.play_indexes = playIndexes }),
  setTurnIndex: turnIndex => set(state => { state.data.turn_index = turnIndex }),
}))

