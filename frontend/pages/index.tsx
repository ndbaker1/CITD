import React from 'react'
import Head from 'next/head'

import { Box, Center } from '@chakra-ui/layout'

import { ServerConnection } from 'utils/websocket-client'
import { ServerEventCode, ServerEvent } from 'utils/shared-types'
import { APP_NAME } from 'environment'

import { useSessionData } from 'providers/session.provider'
import { Screen, useScreen } from 'providers/screen.provider'
import { useServerConnection } from 'providers/server-connecton.provider'
import { useGameData } from 'providers/game.provider'
import { useNotify } from '../providers/notification.provider'
import { getRoomId } from 'providers/route-updater.provider'

import LobbyComponent from './components/lobby'
import LoginComponent from './components/login'
import MenuComponent from './components/menu'
import GameComponent from './components/game'
import RoomJoinModal from './components/quick-join'


export default function Home(): JSX.Element {

  const notify = useNotify()

  const { getScreen, setScreen } = useScreen()
  const { setConnection } = useServerConnection()
  const { setSession, getUser, getUsers, setUsers } = useSessionData()
  const { setTurnIndex, setPlayIndexes, setPlayerOrder } = useGameData()

  // run once on init
  React.useEffect(() => {

    const newGameServerConnection = new ServerConnection({
      [ServerEventCode.ClientJoined]: (response: ServerEvent) => {
        if (response.data?.client_id == getUser()) {
          setSession(response.data?.session_id || '')
          notify(response.data?.session_client_ids?.length == 1
            ? 'Created New Session!'
            : 'Joined Session!'
          )
          setScreen(Screen.Lobby)
        } else {
          notify('User ' + response.data?.client_id + ' Joined!')
        }
        setUsers(response.data?.session_client_ids || [])
      },
      [ServerEventCode.ClientLeft]: (response: ServerEvent) => {
        if (response.data?.client_id == getUser()) {
          setSession('')
          setUsers([])
          notify('Left the Session.')
          setScreen(Screen.Menu)
        } else {
          notify('User ' + response.data?.client_id + ' Left!')
        }
        setUsers(getUsers().filter(id => id != response.data?.client_id))
      },
      [ServerEventCode.GameStarted]: (response: ServerEvent) => {
        setPlayerOrder(response.data?.game_data?.player_order || [])
        setPlayIndexes(response.data?.game_data?.play_indexes || [])
        setTurnIndex(response.data?.game_data?.turn_index || 0)

        notify('Game is starting!')
        setScreen(Screen.Game)
      },
      [ServerEventCode.SessionResponse]: (response: ServerEvent) => {
        setSession(response.data?.session_id || '')
        setUsers(response.data?.session_client_ids || [])

        if (response.data?.game_data) {
          notify('Resuming Previous Game!')
          setPlayerOrder(response.data?.game_data?.player_order || [])
          setPlayIndexes(response.data?.game_data?.play_indexes || [])
          setTurnIndex(response.data?.game_data?.turn_index || 0)

          setScreen(Screen.Game)
        } else {
          notify('Resuming Previous Lobby!')
          setScreen(Screen.Lobby)
        }
      },
      [ServerEventCode.TurnStart]: (response: ServerEvent) => {
        setPlayerOrder(response.data?.game_data?.player_order || [])
        setPlayIndexes(response.data?.game_data?.play_indexes || [])
        setTurnIndex(response.data?.game_data?.turn_index || 0)
      },
      [ServerEventCode.LogicError]: (response: ServerEvent) => {
        notify(response.message || '')
      },
      [ServerEventCode.CannotJoinInProgress]: () => {
        notify('Cannot join a game that is already in progress.')
        setScreen(Screen.Menu)
      },
      [ServerEventCode.GameEnded]: (response: ServerEvent) => {
        setPlayIndexes(response.data?.game_data?.play_indexes || [])
        notify(response.data?.client_id + ' won!' || '')
      },
    })

    setConnection(newGameServerConnection)

    // Enter Quick Join mode if there was a room id detected in the URL
    if (getRoomId()) setScreen(Screen.QuickJoin)

  }, [])

  return (
    <Box>
      <Head>
        <title>{APP_NAME}</title>
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Center h="100vh" w="100vw">
        <ScreenRouter screen={getScreen()} />
      </Center>
    </Box>
  )
}

function ScreenRouter({ screen }: { screen: Screen }) {
  switch (screen) {
    case Screen.Login: return <LoginComponent />
    case Screen.Menu: return <MenuComponent />
    case Screen.Lobby: return <LobbyComponent />
    case Screen.Game: return <GameComponent />
    case Screen.QuickJoin: return <RoomJoinModal />
  }
}
