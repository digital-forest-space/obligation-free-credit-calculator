import { createSolanaRpc, type Rpc, type SolanaRpcApi } from '@solana/kit';

let _rpc: Rpc<SolanaRpcApi> | null = null;

export function getRpc(): Rpc<SolanaRpcApi> {
  if (!_rpc) {
    const url = process.env.SOLANA_RPC_URL;
    if (!url) {
      throw new Error('SOLANA_RPC_URL environment variable is required');
    }
    _rpc = createSolanaRpc(url);
  }
  return _rpc;
}
