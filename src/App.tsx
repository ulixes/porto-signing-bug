import { WagmiProvider, useAccount, useConnect, useDisconnect, useSignTypedData } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi-config'
import { SiweMessage } from 'siwe'
import { useState } from 'react'
import { getAddress } from 'viem'

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

      // Convert to EIP-55 checksum format
      const checksumAddress = getAddress(account.address)

      const message = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
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

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #333',
    cursor: 'pointer',
    fontFamily: 'monospace',
    backgroundColor: '#1a1a1a',
    color: '#fff',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ccc',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Porto Signing Bug Reproduction</h1>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>signTypedDataAsync returns undefined</p>

        <div style={{
          backgroundColor: '#111',
          padding: '20px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #222'
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#fff' }}>Connection Status</h2>
          <p style={{ marginBottom: '6px', fontSize: '14px' }}>
            <span style={{ color: '#666' }}>Connected:</span>{' '}
            <span style={{ color: account.isConnected ? '#0f0' : '#f00' }}>
              {account.isConnected ? 'Yes' : 'No'}
            </span>
          </p>
          {account.address && (
            <>
              <p style={{ marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Address:</span>{' '}
                <span style={{ color: '#fff' }}>{account.address}</span>
              </p>
              <p style={{ marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Chain ID:</span>{' '}
                <span style={{ color: '#fff' }}>{account.chainId}</span>
              </p>
              <p style={{ marginBottom: '0', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Chain:</span>{' '}
                <span style={{ color: '#fff' }}>{account.chain?.name}</span>
              </p>
            </>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!account.isConnected ? (
              <button onClick={handleConnect} style={buttonStyle}>
                Connect Porto Wallet
              </button>
            ) : (
              <>
                <button onClick={handleSign} style={buttonStyle}>
                  Sign Message
                </button>
                <button onClick={handleDisconnect} style={buttonStyle}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#fff' }}>Logs</h2>
          <div style={{
            backgroundColor: '#000',
            color: '#0f0',
            padding: '15px',
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: '1px solid #222'
          }}>
            {logs.length === 0 ? (
              <p style={{ margin: 0, color: '#333' }}>No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>
                  {log}
                </div>
              ))
            )}
          </div>
          {logs.length > 0 && (
            <button onClick={() => setLogs([])} style={{ ...buttonStyle, marginTop: '10px' }}>
              Clear Logs
            </button>
          )}
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#111',
          borderRadius: '4px',
          border: '1px solid #222',
          fontSize: '14px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>Expected Behavior</h3>
          <p style={{ marginBottom: '20px', color: '#999', lineHeight: '1.5' }}>
            After signing, should return a hex signature string.
          </p>

          <h3 style={{ color: '#f00', marginBottom: '12px', fontSize: '16px' }}>Actual Behavior (Bug)</h3>
          <p style={{ marginBottom: '10px', color: '#999' }}>
            Signature returns undefined even though:
          </p>
          <ul style={{ marginBottom: '20px', lineHeight: '1.6', paddingLeft: '20px', color: '#999' }}>
            <li>Porto UI appears correctly</li>
            <li>User completes passkey authentication</li>
            <li>Porto UI shows success</li>
            <li>No errors are thrown</li>
            <li style={{ color: '#f00' }}>Promise resolves with undefined</li>
          </ul>

          <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>Environment</h3>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px', marginBottom: 0, color: '#999' }}>
            <li>Chain: Base Sepolia (84532)</li>
            <li>Porto: 0.2.23</li>
            <li>Wagmi: 2.17.5</li>
            <li>Viem: 2.37.9</li>
          </ul>
        </div>
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
