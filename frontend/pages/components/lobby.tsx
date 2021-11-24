import React from 'react'

import { useSessionData } from '../../providers/session.provider'
import { useServerConnection } from '../../providers/server-connecton.provider'
import { Screen, useScreen } from '../../providers/screen.provider'
import { Divider, Heading, HStack, Stack, VStack } from '@chakra-ui/layout'
import { Button, IconButton } from '@chakra-ui/button'
import { Input, InputGroup, InputLeftAddon, InputRightAddon } from '@chakra-ui/input'
import { CopyIcon } from '@chakra-ui/icons'
import { useNotify } from 'providers/notification.provider'
import { useRouteUpdater } from 'providers/route-updater.provider'
import { Tag } from '@chakra-ui/tag'

export default function LobbyComponent(): JSX.Element {

  useRouteUpdater()

  const notify = useNotify()

  const { connection } = useServerConnection()
  const { getSession, getUser, getUsers } = useSessionData()
  const { setScreen } = useScreen()

  const copyRoomLink = () =>
    navigator.clipboard.writeText(location.protocol + '//' + location.host + '?roomid=' + getSession())
      .then(() => notify('Link Copied ✓'))

  return (
    <Stack>
      <InputGroup>
        <InputLeftAddon children="ID" />
        <Input value={getUser()} readOnly />
      </InputGroup>

      <Button onClick={() => {
        connection?.disconnect()
        setScreen(Screen.Login)
      }}>
        Disconnect
      </Button>

      <InputGroup>
        <InputLeftAddon children="RoomID" />
        <Input value={getSession()} readOnly />
        <InputRightAddon
          bg="transparent"
          border="none"
        >
          <IconButton
            title="Get Room Link"
            aria-label="copy"
            icon={<CopyIcon />}
            onClick={copyRoomLink}
          />
        </InputRightAddon>
      </InputGroup>

      <Button onClick={() => { connection?.leave_session() }}>
        Leave Room
      </Button>

      <Button onClick={() => { connection?.startGame() }}>
        Start Game
      </Button>

      <Divider pt={5} />

      <UserList users={getUsers()} />

    </Stack>
  )
}

function UserList({ users }: { users: string[] }) {
  return (
    <VStack>
      <Heading size="md">
        Player Lobby
      </Heading>
      <HStack>
        {users.map(player => <Tag> {player} </Tag>)}
      </HStack>
    </VStack>
  )
}