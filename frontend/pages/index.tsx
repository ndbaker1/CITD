import React from 'react'
import Head from 'next/head'

import { Box, Center, HStack, Text } from '@chakra-ui/layout'
import { useDisclosure } from '@chakra-ui/hooks'
import { Button } from '@chakra-ui/button'
import { Input } from '@chakra-ui/input'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/react'

import { ServerConnection, verifySessionID } from 'utils/websocket-client'
import { ServerEventCode, ServerEvent } from 'utils/shared-types'
import { APP_NAME, environment } from 'environment'

import { useSessionData } from 'providers/session.provider'
import { Screen, useScreen } from 'providers/screen.provider'
import { useLogin, useServerConnection } from 'providers/server-connecton.provider'
import { useGameData } from 'providers/game.provider'
import { useNotify } from '../providers/notification.provider'
import { getRoomId } from 'providers/route-updater.provider'

import LobbyComponent from './components/lobby'
import LoginComponent from './components/login'
import MenuComponent from './components/menu'
import GameComponent from './components/game'


export default function Home(): JSX.Element {

  const notify = useNotify()

  const { getScreen, setScreen } = useScreen()
  const { setConnection } = useServerConnection()
  const { setSession, getUser, getUsers, setUsers } = useSessionData()
  const { setTurnIndex, setPlayIndexes, setPlayerOrder } = useGameData()

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
        setPlayerOrder(response.data?.game_data?.player_order || [])
        setPlayIndexes(response.data?.game_data?.play_indexes || [])
        setTurnIndex(response.data?.game_data?.turn_index || 0)

        notify('Game is starting!')
        setScreen(Screen.Game)
      },
      [ServerEventCode.SessionResponse]: (response: ServerEvent) => {
        setSession(response.data?.session_id || '')
        setUsers(response.data?.session_client_ids || [])
        notify('Resumed Previous Session!')
        setScreen(Screen.Lobby) // set to different state depending on gamedata
      },
      [ServerEventCode.TurnStart]: (response: ServerEvent) => {
        setPlayerOrder(response.data?.game_data?.player_order || [])
        setPlayIndexes(response.data?.game_data?.play_indexes || [])
        setTurnIndex(response.data?.game_data?.turn_index || 0)
      },
      [ServerEventCode.LogicError]: (response: ServerEvent) => {
        notify(response.message || '')
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
    case Screen.QuickJoin: return <RoomJoinModal />
  }
}


function RoomJoinModal() {

  const notify = useNotify()
  const login = useLogin()
  const { setScreen } = useScreen()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { connection } = useServerConnection()
  const { getUser, setUser } = useSessionData()

  const [cachedUser, setCachedUser] = useCached('userid')
  const [roomid, setRoomid] = React.useState<string>('')

  React.useEffect(() => {
    const errors = verifySessionID(getRoomId() || '')
    if (errors) {
      notify(errors)
      setScreen(Screen.Login)
    }

    onOpen()
    setRoomid(getRoomId() || '')
  }, [])

  React.useEffect(() => { setUser(cachedUser) }, [cachedUser])

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={e => {
          e.preventDefault()
          login({
            user: getUser(),
            success: () => {
              connection?.join_session(roomid)
              onClose()
              setCachedUser(getUser())
            },
            failure: () => setCachedUser('')
          })
        }}>
          <ModalHeader>Join Room [ {roomid} ]</ModalHeader>
          <ModalBody>
            {
              !!cachedUser
                ? (
                  <Text>Join using Id: {getUser()} ?</Text>
                )
                : (
                  <Input
                    label="UserID"
                    placeholder="Enter a name"
                    value={getUser()}
                    onChange={event => setUser(event.target.value)}
                  />
                )
            }
          </ModalBody>

          <ModalFooter>
            {
              !!cachedUser
                ? (
                  <HStack>
                    <Button
                      mr={3}
                      colorScheme="blue"
                      onClick={() => setCachedUser('')}
                    >
                      No
                    </Button>
                    <Button
                      mr={3}
                      colorScheme="blue"
                      type="submit"
                    >
                      Yes
                    </Button>
                  </HStack>
                )
                : (
                  <HStack>
                    <Button
                      mr={3}
                      colorScheme="blue"
                      type="submit"
                    >
                      Connect
                    </Button>
                  </HStack>
                )
            }
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}


function useCached(key: string): [string, (val: string) => void] {
  const [value, setValue] = React.useState('')

  React.useEffect(() => { setValue(localStorage.getItem(key) || '') }, [])

  const updateCache = (val: string) => {
    setValue(val)
    localStorage.setItem(key, val)
  }

  return [value, updateCache]
}
