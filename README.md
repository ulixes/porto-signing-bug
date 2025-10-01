# Porto Signing Bug Reproduction

This is a minimal reproduction case for a bug in Porto's dialog mode where `signTypedDataAsync` returns `undefined` despite successful user authentication.

## Bug Description

When using Porto wallet with Wagmi to sign EIP-712 typed data (SIWE message), the promise resolves with `undefined` instead of the signature, even though:

- ✅ Porto UI appears correctly
- ✅ User completes passkey authentication successfully
- ✅ Porto UI indicates success
- ✅ No JavaScript errors are thrown
- ❌ The returned signature is `undefined`

## Environment

- **Porto version:** 0.2.23
- **Wagmi version:** 2.17.5
- **Viem version:** 2.37.9
- **Chain:** Base Sepolia (chainId: 84532)
- **Node version:** v20.18.3
- **Package manager:** Bun 1.2.20

## Root Cause Analysis

Based on Porto's source code (`src/core/internal/modes/dialog.ts`), the dialog provider creates a promise that should resolve with `queued.result` when `queued.status === 'success'`:

```typescript
// From Porto source
if (queued.status === 'success') resolve(queued.result as any)
```

However, in practice, `queued.result` is `undefined` even when the status is `'success'` and the user has completed signing.

## Reproduction Steps

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Start dev server:**
   ```bash
   bun dev
   ```

3. **Open browser at** `http://localhost:5173`

4. **Follow these steps:**
   - Click "Connect Porto Wallet"
   - Complete Porto wallet setup/connection with passkey
   - Click "Sign Message (EIP-712)"
   - Complete signing in Porto UI with passkey
   - Observe the logs

## Expected Result

After completing the signing flow in Porto UI, the logs should show:
```
✅ Signature received: 0x....[valid hex signature]
📏 Signature length: 132 (or longer for EIP-1271)
```

## Actual Result

The logs show:
```
✅ Signature received: undefined
📏 Signature length: 0
🔍 Signature type: undefined
❌ BUG: Signature is undefined despite successful UI completion!
```

## Additional Notes

- This bug occurs consistently on Base Sepolia
- The same issue occurs with both `signMessageAsync` (personal_sign) and `signTypedDataAsync` (eth_signTypedData_v4)
- Tested with both iframe (default) and popup dialog modes - same result
- The Porto dialog provider's promise resolution appears to have a timing or result propagation issue

## Workarounds

None found. The signature is required for authentication and cannot proceed without it.

## References

- Porto Repository: https://github.com/ithacaxyz/porto
- Relevant code: `src/core/internal/modes/dialog.ts` lines 79-119
- Dialog provider promise handling: lines 105-110

## Contact

This reproduction was created to report the issue to the Porto team. Please see the GitHub issue for updates.
