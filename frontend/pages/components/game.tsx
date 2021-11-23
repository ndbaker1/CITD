import React from 'react'

import { Button } from '@chakra-ui/button'
import { Center, Heading, HStack, Stack, Text, VStack } from '@chakra-ui/layout'

import { useServerConnection } from 'providers/server-connecton.provider'
import { useGameData } from '../../providers/game.provider'
import { useSessionData } from 'providers/session.provider'

/**
 * Renders the Game according to the State
 */
export default function GameComponent(): JSX.Element {

  const { data } = useGameData()
  const { connection } = useServerConnection()
  const { getUser } = useSessionData()

  return (
    <Stack>
      <Stack>
        <Text>Players</Text>
        {data.player_order.map(player => <Text>{player}</Text>)}
      </Stack>
      <Stack>
        <Center>
          <Heading>{data.player_order[data.turn_index] == getUser() ? "Your Turn" : data.player_order[data.turn_index] + "'s Turn"}</Heading>
        </Center>
        <HStack>
          {
            data.play_indexes.map((_, i) =>
              <Button key={i} onClick={() => connection?.play(i)}></Button>
            )
          }
        </HStack>

        <HStack>
          {
            data.play_indexes.map(vec =>
              <VStack>
                {
                  vec.map((_, i) => <Button borderWidth="1px" bg={vec[vec.length - i - 1] ? "grey" : ""}></Button>)
                }
              </VStack>
            )
          }
        </HStack>
      </Stack>
    </Stack>
  )
}
