import { WagmiProvider, useAccount, useConnect, useDisconnect, useSignTypedData } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi-config'
import { SiweMessage } from 'siwe'
import { useState } from 'react'

const queryClient = new QueryClient()

function PortoSigningTest() {
  const account = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { signTypedDataAsync } = useSignTypedData()
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const portoConnector = connectors.find(
    (connector) => connector.id === 'xyz.ithaca.porto',
  )

  const handleConnect = () => {
    if (!portoConnector) {
      addLog('❌ Porto connector not found')
      return
    }
    addLog('🔌 Connecting to Porto...')
    connect({ connector: portoConnector })
  }

  const handleDisconnect = () => {
    addLog('👋 Disconnecting...')
    disconnect()
  }

  const handleSign = async () => {
    if (!account.address) {
      addLog('❌ No account connected')
      return
    }

    try {
      addLog('📝 Creating SIWE message...')
      const message = new SiweMessage({
        domain: window.location.host,
        address: account.address,
        statement: 'Sign in to test Porto signing',
        uri: window.location.origin,
        version: '1',
        chainId: account.chainId || 84532,
        nonce: Math.random().toString(36).substring(2, 15),
        issuedAt: new Date().toISOString(),
      })

      addLog(`✅ SIWE message created for chain ${account.chainId}`)

      // Prepare EIP-712 typed data
      const typedData = {
        domain: {
          name: 'Sign in with Ethereum',
          version: message.version,
          chainId: message.chainId,
          verifyingContract: message.address as `0x${string}`,
        },
        types: {
          Message: [
            { name: 'domain', type: 'string' },
            { name: 'address', type: 'address' },
            { name: 'statement', type: 'string' },
            { name: 'uri', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'nonce', type: 'string' },
            { name: 'issuedAt', type: 'string' },
          ],
        },
        primaryType: 'Message' as const,
        message: {
          domain: message.domain,
          address: message.address,
          statement: message.statement || '',
          uri: message.uri,
          version: message.version,
          chainId: BigInt(message.chainId),
          nonce: message.nonce,
          issuedAt: message.issuedAt,
        },
      }

      addLog('🔐 Calling signTypedDataAsync...')
      addLog('⏳ Please complete signing in Porto UI...')

      const signature = await signTypedDataAsync(typedData)

      addLog(`✅ Signature received: ${signature}`)
      addLog(`📏 Signature length: ${signature?.length || 0}`)
      addLog(`🔍 Signature type: ${typeof signature}`)

      if (!signature || signature === 'undefined') {
        addLog('❌ BUG: Signature is undefined despite successful UI completion!')
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      console.error('Full error:', error)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Porto Signing Bug Reproduction</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Connection Status</h2>
        <p>
          <strong>Connected:</strong> {account.isConnected ? '✅ Yes' : '❌ No'}
        </p>
        {account.address && (
          <>
            <p>
              <strong>Address:</strong> {account.address}
            </p>
            <p>
              <strong>Chain ID:</strong> {account.chainId}
            </p>
            <p>
              <strong>Chain Name:</strong> {account.chain?.name}
            </p>
          </>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        {!account.isConnected ? (
          <button onClick={handleConnect} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Connect Porto Wallet
          </button>
        ) : (
          <>
            <button onClick={handleSign} style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}>
              Sign Message (EIP-712)
            </button>
            <button onClick={handleDisconnect} style={{ padding: '10px 20px', fontSize: '16px' }}>
              Disconnect
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Logs</h2>
        <div style={{
          backgroundColor: '#000',
          color: '#0f0',
          padding: '15px',
          borderRadius: '5px',
          maxHeight: '400px',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <p style={{ margin: 0 }}>No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>
        {logs.length > 0 && (
          <button onClick={() => setLogs([])} style={{ marginTop: '10px', padding: '5px 10px' }}>
            Clear Logs
          </button>
        )}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>Expected Behavior:</h3>
        <p>After clicking "Sign Message", the Porto UI should appear. After completing the signing flow with your passkey, the signature should be returned as a hex string.</p>

        <h3>Actual Behavior (Bug):</h3>
        <p><strong>The signature returns as `undefined`</strong> even though:</p>
        <ul>
          <li>✅ Porto UI appears correctly</li>
          <li>✅ User completes passkey authentication</li>
          <li>✅ Porto UI shows success</li>
          <li>✅ No errors are thrown</li>
          <li>❌ Promise resolves with `undefined` instead of signature</li>
        </ul>

        <h3>Environment:</h3>
        <ul>
          <li>Chain: Base Sepolia (84532)</li>
          <li>Porto version: 0.2.23</li>
          <li>Wagmi version: 2.17.5</li>
          <li>Viem version: 2.37.9</li>
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PortoSigningTest />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
