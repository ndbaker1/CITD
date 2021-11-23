import React from 'react'
import Head from 'next/head'
import { ServerConnection } from '../utils/websocket-client'
import { ServerEventCode, ServerEvent } from '../utils/shared-types'
import { APP_NAME, environment } from 'environment'

import { useSessionData } from '../providers/session.provider'
import { Screen, useScreen } from '../providers/screen.provider'
import { useServerConnection } from '../providers/server-connecton.provider'

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
  const { setSession, getUser, getUsers, setUsers } = useSessionData()

  // run once on init
  React.useEffect(() => {
    if (environment.healthCheck) // wake up app using the health endpoint
      fetch(`${environment.http_or_https}://${environment.apiDomain}/health`)
        .then(() => console.log('health check passed'))

    setConnection(
      new ServerConnection({
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
          // setGameData(response.data?.game_data)
          // setPlayerData(response.data?.player_data)
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
          notify(response.data?.session_id + ' is not a valid Session ID')
        },
        [ServerEventCode.LogicError]: (response: ServerEvent) => {
          notify(response.message || '')
        },
      })
    )
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