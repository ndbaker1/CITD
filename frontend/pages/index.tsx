import React from 'react'
import Head from 'next/head'
import { ServerConnection } from 'utils/websocket-client'
import { ServerEventCode, ServerEvent } from 'utils/shared-types'
import { APP_NAME, environment } from 'environment'

import { useSessionData } from 'providers/session.provider'
import { Screen, useScreen } from 'providers/screen.provider'
import { useServerConnection } from 'providers/server-connecton.provider'
import { useGameData } from 'providers/game.provider'

import LobbyComponent from './components/lobby'
import LoginComponent from './components/login'
import MenuComponent from './components/menu'
import GameComponent from './components/game'

import { Box, Center } from '@chakra-ui/layout'
import { useNotify } from '../providers/notification.provider'


export default function Home(): JSX.Element {

  const notify = useNotify()

  const { getScreen, setScreen } = useScreen()
  const { setConnection } = useServerConnection()
  const { setSession, getUser, setUser, getUsers, setUsers } = useSessionData()
  const { data, setTurnIndex } = useGameData()

  // run once on init
  React.useEffect(() => {
    if (environment.healthCheck) // wake up app using the health endpoint
      fetch(`${environment.http_or_https}://${environment.apiDomain}/health`)
        .then(() => console.log('health check passed'))


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
        data.player_order = response.data?.game_data?.player_order || []
        data.turn_index = response.data?.game_data?.turn_index || 0
        data.play_indexes = response.data?.game_data?.play_indexes || []
        setTurnIndex(data.turn_index)

        notify('Game is starting!')
        setScreen(Screen.Game)
      },
      [ServerEventCode.SessionResponse]: (response: ServerEvent) => {
        setSession(response.data?.session_id || '')
        setUsers(response.data?.session_client_ids || [])
        notify('Resumed Previous Session!')
        // setGameData(response.data?.game_data)
        // setPlayerData(response.data?.player_data)
        setScreen(Screen.Lobby) // set to different state depending on gamedata
      },
      [ServerEventCode.TurnStart]: (response: ServerEvent) => {
        data.player_order = response.data?.game_data?.player_order || []
        data.turn_index = response.data?.game_data?.turn_index || 0
        data.play_indexes = response.data?.game_data?.play_indexes || []
        setTurnIndex(data.turn_index)
      },
      [ServerEventCode.LogicError]: (response: ServerEvent) => {
        notify(response.message || '')
      },
      [ServerEventCode.GameEnded]: (response: ServerEvent) => {
        notify(response.data?.client_id + ' won!' || '')
      },
    })

    setConnection(newGameServerConnection)

    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('roomid')) {
      const roomid = searchParams.get('roomid') as string
      const userid = localStorage.getItem('userid')
      if (userid) {
        newGameServerConnection.connect(userid, {
          open: () => {
            setScreen(Screen.Menu)
            notify('Connected.')
            setUser(userid)
            localStorage.setItem('userid', getUser())
            newGameServerConnection.join_session(roomid)
          },
          error: () => {
            notify('Error: ID may already be taken.')
          },
          close: () => {
            notify('Disconnected..')
            setScreen(Screen.Login)
          },
        })
      }
    }
  }, [])

  return (
    <Box>
      <Head>
        <title>{APP_NAME}</title>
        <link rel="icon" href="/favicon.ico" />
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
  }
}