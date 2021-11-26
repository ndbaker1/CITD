import React from 'react'

import { useDisclosure } from '@chakra-ui/hooks'
import { Button } from '@chakra-ui/button'
import { Tag } from '@chakra-ui/tag'
import { Center, Divider, HStack, Text, VStack } from '@chakra-ui/layout'
import { Input } from '@chakra-ui/input'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@chakra-ui/react'

import { useNotify } from 'providers/notification.provider'
import { getRoomId } from 'providers/route-updater.provider'
import { Screen, useScreen } from 'providers/screen.provider'
import { useLogin, useServerConnection } from 'providers/server-connecton.provider'
import { useSessionData } from 'providers/session.provider'

import { verifySessionID } from 'utils/websocket-client'
import { useRouter } from 'next/router'


export default function RoomJoinModal(): JSX.Element {

  const router = useRouter()
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

    // consume the roomid after reading it
    router.replace('', undefined, { shallow: true })

  }, [])

  React.useEffect(() => { setUser(cachedUser) }, [cachedUser])

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      isCentered
    >
      <ModalContent>
        <form onSubmit={
          e => {
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
          }
        }>
          <ModalHeader>
            <VStack>
              <HStack>
                <Text>Joining Room </Text>
                <Tag size="lg"> {roomid} </Tag>
              </HStack>
              <Divider />
            </VStack>
          </ModalHeader>
          {
            cachedUser
              ? (
                <>
                  <ModalBody>
                    <Center>
                      <HStack>
                        <Text>Join as: </Text>
                        <Tag size="lg"> {getUser()} </Tag>
                        <Text>?</Text>
                        <Button colorScheme="blue" onClick={() => setCachedUser('')}>
                          No
                        </Button>
                        <Button colorScheme="blue" type="submit">
                          Yes
                        </Button>
                      </HStack>
                    </Center>
                  </ModalBody>
                </>
              )
              : (
                <>
                  <ModalBody>
                    <HStack>
                      <Input
                        label="UserID"
                        placeholder="Enter a name"
                        value={getUser()}
                        onChange={event => setUser(event.target.value)}
                      />
                      <Button colorScheme="blue" type="submit">
                        Connect
                      </Button>
                    </HStack>
                  </ModalBody>
                </>
              )
          }
        </form>
        <ModalFooter>
          <Button onClick={() => { setScreen(Screen.Login) }}>
            Stop Joining
          </Button>
        </ModalFooter>
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
