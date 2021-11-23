import React from 'react'

import { useSessionData } from '../../providers/session.provider'
import { useServerConnection } from '../../providers/server-connecton.provider'
import { Screen, useScreen } from '../../providers/screen.provider'
import { List, Stack, Text } from '@chakra-ui/layout'
import { Button, IconButton } from '@chakra-ui/button'
import { Input, InputGroup, InputLeftAddon, InputRightElement } from '@chakra-ui/input'
import { CopyIcon } from '@chakra-ui/icons'
import { useNotify } from 'providers/notification.provider'

export default function LobbyComponent(): JSX.Element {

  const notify = useNotify()

  const { connection } = useServerConnection()
  const { getSession, getUser, getUsers } = useSessionData()
  const { setScreen } = useScreen()

  return (
    <Stack>
      <InputGroup>
        <InputLeftAddon children="ID" />
        <Input label="UserID" value={getUser()} />
      </InputGroup>

      <Button onClick={() => {
        connection?.disconnect()
        setScreen(Screen.Login)
      }}>
        Disconnect
      </Button>

      <InputGroup>
        <InputRightElement>
          <IconButton
            title="Copy to Clipboard"
            aria-label="copy"
            icon={<CopyIcon />}
            onClick={() =>
              navigator.clipboard.writeText(getSession())
                .then(() => notify('Copied SessionID: ' + getSession()))
            }
          />
        </InputRightElement>
        <Input
          id="session-id"
          label="Session ID"
          value={getSession()}
          readOnly
        />
      </InputGroup>

      <Button onClick={() => { connection?.leave_session() }}>
        Leave Session
      </Button>

      <Button onClick={() => { connection?.startGame() }}>
        Start Game
      </Button>

      <UserList users={getUsers()} />

    </Stack>
  )
}

function UserList({ users }: { users: string[] }) {
  return (
    <List>
      {users.map((user, i) => (
        <Text key={i}>{user}</Text>
      ))}
    </List>
  )
}