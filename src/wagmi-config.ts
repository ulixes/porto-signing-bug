import { http, createConfig, createStorage } from 'wagmi'
import { porto } from 'porto/wagmi'
import { baseSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [porto()],
  storage: createStorage({ storage: localStorage }),
  transports: {
    [baseSepolia.id]: http(),
  },
})
