import React from 'react'
import { useGameData } from '../../providers/game.provider'

/**
 * Renders the Game according to the State
 */
export default function GameComponent(): JSX.Element {
  const { data } = useGameData()
  return (
    <>
    </>
  )
}
