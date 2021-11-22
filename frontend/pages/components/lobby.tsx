import React from 'react'

import { useSessionData } from '../../providers/session.provider'
import { useServerConnection } from '../../providers/server-connecton.provider'
import { Screen, useScreen } from '../../providers/screen.provider'
import { Container, List, Stack, Text } from '@chakra-ui/layout'
import { Button, IconButton } from '@chakra-ui/button'
import { Input, InputGroup, InputRightAddon } from '@chakra-ui/input'
import { CopyIcon } from '@chakra-ui/icons'

export default function LobbyComponent(): JSX.Element {

  const { connection } = useServerConnection()
  const { log, getSession, getUser, getUsers } = useSessionData()
  const { setScreen } = useScreen()

  return (
    <Container>
      <Text label="UserID" variant="outlined" value={getUser()} />

      <Stack style={{ display: connection?.isOpen() ? 'flex' : 'none', flexDirection: 'column', margin: 'auto' }}>
        <Button onClick={() => {
          connection?.disconnect()
          setScreen(Screen.Login)
        }}> Disconnect </Button>


        <InputGroup>
          <Input
            id="session-id"
            label="Session ID"
            value={getSession()}
            readOnly
          />
          <InputRightAddon>
            <IconButton aria-label="Copy to Clipboard" icon={<CopyIcon />}
              onClick={() =>
                navigator.clipboard.writeText(getSession())
                  .then(() => log('Copied SessionID: ' + getSession()))
              } />
          </InputRightAddon>
        </InputGroup>
        <Button onClick={() => {
          connection?.leave_session()
        }}>  Leave Session </Button>

        <Button onClick={() => {
          connection?.startGame()
        }}>  Start Game </Button>

        <UserList users={getUsers()} />

      </Stack>
    </Container>
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