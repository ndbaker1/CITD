import { useToast } from "@chakra-ui/react"

export function useNotify() {
  const toast = useToast()
  const notify = (message: string) => toast({
    description: message,
    duration: 2000,
    isClosable: true,
  })

  return notify
}