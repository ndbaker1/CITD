import React from 'react'

import { Button } from '@chakra-ui/button'
import { Center, Heading, HStack, Stack, VStack } from '@chakra-ui/layout'

import { useConnectionChecker, useServerConnection } from 'providers/server-connecton.provider'
import { useGameData } from 'providers/game.provider'
import { useSessionData } from 'providers/session.provider'
import { useRouteUpdater } from 'providers/route-updater.provider'
import { Tag } from '@chakra-ui/tag'
import { ArrowUpIcon } from '@chakra-ui/icons'


let colors: string[] = []

/**
 * Renders the Game according to the State
 */
export default function GameComponent(): JSX.Element {

  useRouteUpdater()
  useConnectionChecker()

  const { data } = useGameData()
  const { connection } = useServerConnection()
  const { getUser } = useSessionData()

  const getColor = (index: number): string => {
    if (index >= data.player_order.length) return ''

    if (colors.length != data.player_order.length) {
      colors = data.player_order.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16))
    }

    return colors[index]
  }

  return (
    <Stack>
      <Center>
        <VStack>
          <Heading>Turn</Heading>
          <HStack>
            {data.player_order.map((player, index) =>
              <VStack>
                <Tag
                  size="md"
                  borderBottomWidth="0.5rem"
                  borderBottomColor={getColor(index)}
                >
                  {player == getUser() ? "You" : player}
                </Tag>
                {data.player_order[data.turn_index] != player || <ArrowUpIcon />}
              </VStack>
            )}
          </HStack>
        </VStack>
      </Center >
      <Stack>
        <HStack>
          {data.play_indexes.map((_, i) =>
            <Button key={i} onClick={() => connection?.play(i)}></Button>
          )}
        </HStack>

        <HStack>
          {data.play_indexes.map(vec =>
            <VStack>
              {vec.map((_, i) =>
                <Button borderWidth="1px" bg={getColor(vec[vec.length - i - 1])}></Button>
              )}
            </VStack>
          )}
        </HStack>
      </Stack>
      <Button onClick={() => connection?.startGame()}>
        Restart
      </Button>
    </Stack >
  )
}
