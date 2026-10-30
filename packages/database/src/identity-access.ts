import type { Pool } from 'pg';
export interface CredentialRecord {
  tenant_id: string;
  user_id: string;
  password_hash: string;
}
export interface SessionRecord {
  tenant_id: string;
  user_id: string;
  session_id: string;
}
export class IdentityAccess {
  constructor(private readonly pool: Pool) { }
  async credential(companyCode: string, email: string): Promise<CredentialRecord | null> { return (await this.pool.query<CredentialRecord>('SELECT * FROM app.lookup_credential($1,$2)', [companyCode, email])).rows[0] ?? null; }
  async session(tokenHash: string): Promise<SessionRecord | null> { return (await this.pool.query<SessionRecord>('SELECT * FROM app.lookup_session($1)', [tokenHash])).rows[0] ?? null; }
  async installation(): Promise<{
    mode: string;
    configured: boolean;
  } | null> { return (await this.pool.query<{
    mode: string;
    configured: boolean;
  }>('SELECT * FROM app.installation_state()')).rows[0] ?? null; }
}
