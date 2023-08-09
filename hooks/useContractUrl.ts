import { useNetwork } from "wagmi"

export const useContractUrl = (address: string) => {
  const { chain } = useNetwork()
  return chain?.blockExplorers?.default.url + '/address/' + address
}