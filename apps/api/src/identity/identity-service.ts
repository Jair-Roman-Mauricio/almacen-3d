import { randomUUID } from 'node:crypto';
import pg from 'pg';
import type { Pool } from 'pg';
import type { OnModuleDestroy } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { DomainError, normalizeCode, normalizeName, companyTimeZone } from '@almacen/domain';
import { IdentityAccess, queryTenant, withTenantTransaction, runUnitOfWork, appendAuditEvent, appendChange, type TenantContext, type SessionRecord } from '@almacen/database';
import type { RegistrationInput, LoginInput, CreateUserInput, UpdateUserInput, UpdateCompanyInput } from '@almacen/contracts';
import { validateOrigin, validateCsrf, type MutationHeaders } from './request-security.js';
import { executeCommand, type CommandOptions, type CommandStamp } from '../platform/commands/command-executor.js';
import { operationResult } from './operation-result.js';
import { listUsers } from './user-list.js';
import { ApiException } from '../platform/http/api-exception.js';
import { newSessionToken, sessionHash, csrfToken, readSessionCookie } from './session-token.js';
import { PasswordService } from './password-service.js';
export interface CommandHeaders extends MutationHeaders {
  reference?: string | undefined;
}
export interface AuthenticatedSession extends SessionRecord {
  token: string;
}
export interface IdentityOptions {
  appPool?: Pool;
  provisionPool?: Pool;
  mode?: 'saas' | 'local';
  origin?: string;
  demoMode?: boolean;
  clock?: () => Date;
}
export class IdentityService implements OnModuleDestroy {
  readonly passwords = new PasswordService();
  readonly mode: 'saas' | 'local' | null;
  readonly origin: string;
  readonly demoMode: boolean;
  readonly clock: () => Date;
  protected readonly appPool: Pool | undefined;
  protected readonly provisionPool: Pool | undefined;
  private readonly owned: Pool[] = [];
  constructor(options: IdentityOptions = {}) {
    const mode = options.mode ?? process.env.INSTALLATION_MODE ?? 'saas';
    this.mode = mode === 'saas' || mode === 'local' ? mode : null;
    this.origin = options.origin ?? process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
    this.demoMode = options.demoMode ?? process.env.DEMO_MODE === 'true';
    this.clock = options.clock ?? (() => new Date());
    const prepare = (provided: Pool | undefined, url: string | undefined) => {
      if (provided) return provided;
      if (!url) return undefined;
      const pool = new pg.Pool({connectionString: url, max: 10});
      pool.on('error', () => new Logger('Database').error('Se perdió una conexión de datos.'));
      this.owned.push(pool);
      return pool;
    };
    this.appPool = prepare(options.appPool, process.env.DATABASE_URL);
    this.provisionPool = prepare(options.provisionPool, process.env.DATABASE_PROVISION_URL);
  }
  async onModuleDestroy(): Promise<void> { await Promise.all(this.owned.map(pool => pool.end())); }
  protected pool(kind: 'app' | 'provision'): Pool {
    const pool = kind === 'app' ? this.appPool : this.provisionPool;
    if (!pool) throw new DomainError('TEMPORARY_FAILURE', 'Configura la conexión local de datos.');
    return pool;
  }
  protected requireMode(mode: 'saas' | 'local'): void {
    if (this.mode === null) throw new DomainError('TEMPORARY_FAILURE', 'La modalidad de instalación no es válida.');
    if (this.mode !== mode) throw new DomainError('MODE_UNAVAILABLE', 'Esta acción no está disponible en la modalidad configurada.');
  }
  protected databaseError(error: unknown): never {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const message = error instanceof Error ? error.message : '';
    if (code === '23505' && error && typeof error === 'object' && 'constraint' in error && String(error.constraint).includes('companies'))
      throw new DomainError('COMPANY_CODE_EXISTS', 'El código de empresa ya existe.');
    const known: Record<string, string> = { MODE_UNAVAILABLE: 'Esta acción no está disponible en la modalidad configurada.', ALREADY_CONFIGURED: 'La instalación local ya está configurada.', INVALID_TIME_ZONE: 'La zona horaria no es válida.' };
    if (code === 'P0001' && known[message])
      throw new DomainError(message, known[message]);
    throw error;
  }
  protected async registrationValues(input: RegistrationInput): Promise<readonly unknown[]> {
    const code = normalizeCode(input.company.code).value;
    const name = normalizeName(input.company.name);
    const timeZone = companyTimeZone(input.company.timeZone);
    const adminName = normalizeName(input.administrator.name);
    const credentials = this.passwords.validate(input.administrator.email, input.administrator.password);
    return [randomUUID(), code, name, timeZone, randomUUID(), adminName, credentials.email, await this.passwords.hash(credentials.password)];
  }
  async register(input: RegistrationInput): Promise<unknown> {
    this.requireMode('saas');
    const values = await this.registrationValues(input);
    try {
      return (await this.pool('provision').query('SELECT app.register_saas($1,$2,$3,$4,$5,$6,$7,$8) AS data', [...values])).rows[0].data;
    }
    catch (error) {
      this.databaseError(error);
    }
  }
  async config(): Promise<{
    mode: 'saas' | 'local';
    demoMode: boolean;
    localSetupRequired: boolean;
  }> {
    if (!this.mode)
      throw new DomainError('TEMPORARY_FAILURE', 'La modalidad de instalación no es válida.');
    const state = await new IdentityAccess(this.pool('app')).installation();
    if (state && state.mode !== this.mode)
      throw new DomainError('TEMPORARY_FAILURE', 'La modalidad no coincide con la instalación persistida.');
    return { mode: this.mode, demoMode: this.demoMode, localSetupRequired: this.mode === 'local' && !state?.configured };
  }
  async setup(input: RegistrationInput): Promise<unknown> {
    this.requireMode('local');
    const values = await this.registrationValues(input);
    try {
      return (await this.pool('provision').query('SELECT app.setup_local($1,$2,$3,$4,$5,$6,$7,$8) AS data', [...values])).rows[0].data;
    }
    catch (error) {
      this.databaseError(error);
    }
  }
  async sessionData(context: TenantContext, userId: string, token: string) {
    const company = (await queryTenant(context, 'SELECT id,code,name,time_zone AS "timeZone" FROM app.companies WHERE id=$1', [context.tenantId])).rows[0];
    const user = (await queryTenant(context, 'SELECT id,name,email,role,active FROM app.users WHERE tenant_id=$1 AND id=$2 AND active', [context.tenantId, userId])).rows[0];
    if (!company || !user)
      throw new DomainError('SESSION_INVALID', 'Inicia sesión para continuar.');
    return { company, user, csrfToken: csrfToken(token), demoMode: this.demoMode };
  }
  async login(input: LoginInput) {
    if ([input.companyCode, input.email, input.password].some(value => typeof value !== 'string' || value.length === 0))
      throw new ApiException(400, { code: 'REQUIRED_FIELD', message: 'Indica empresa, correo y contraseña.', details: [] });
    let credential = null;
    try {
      const code = normalizeCode(input.companyCode).value;
      const value = this.passwords.validate(input.email, input.password);
      credential = await new IdentityAccess(this.pool('app')).credential(code, value.email);
    }
    catch (error) {
      if (!(error instanceof DomainError) || !['INVALID_CODE', 'INVALID_EMAIL', 'REQUIRED_FIELD'].includes(error.code))
        throw error;
    }
    const valid = await this.passwords.verify(input.password, credential?.password_hash ?? null);
    if (!credential || !valid)
      throw new DomainError('INVALID_CREDENTIALS', 'La empresa o las credenciales no son válidas.');
    const token = newSessionToken();
    const created = (await this.pool('app').query('SELECT app.create_session($1,$2,$3,$4,$5) AS created', [credential.tenant_id, credential.user_id, randomUUID(), sessionHash(token), credential.password_hash])).rows[0].created;
    if (!created)
      throw new DomainError('INVALID_CREDENTIALS', 'La empresa o las credenciales no son válidas.');
    const data = await withTenantTransaction(this.pool('app'), credential.tenant_id, ctx => this.sessionData(ctx, credential.user_id, token));
    return { token, data };
  }
  async resolveSession(cookie: string | undefined): Promise<AuthenticatedSession> {
    const token = readSessionCookie(cookie);
    const session = await new IdentityAccess(this.pool('app')).session(sessionHash(token));
    if (!session)
      throw new DomainError('SESSION_INVALID', 'Inicia sesión para continuar.');
    return { ...session, token };
  }
  async authorize(context: TenantContext, session: AuthenticatedSession, roles: readonly string[]) {
    const user = (await queryTenant(context, `SELECT u.id,u.name,u.email,u.role,u.active FROM app.sessions s JOIN app.users u ON u.tenant_id=s.tenant_id AND u.id=s.user_id WHERE s.tenant_id=$1 AND s.id=$2 AND s.user_id=$3 AND s.token_hash=$4 AND s.revoked_at IS NULL AND u.active`, [context.tenantId, session.session_id, session.user_id, sessionHash(session.token)])).rows[0];
    if (!user)
      throw new DomainError('SESSION_INVALID', 'Inicia sesión para continuar.');
    if (!roles.includes(user.role))
      throw new DomainError('FORBIDDEN', 'No tienes permiso para realizar esta acción.');
    return user;
  }
  async withIdentity<T>(cookie: string | undefined, roles: readonly string[], operation: (context: TenantContext, session: AuthenticatedSession) => Promise<T>, permissions: 'shared' | 'exclusive' = 'shared'): Promise<T> {
    const session = await this.resolveSession(cookie);
    return runUnitOfWork(this.pool('app'), session.tenant_id, async (context) => { await this.authorize(context, session, roles); return operation(context, session); }, { permissions });
  }
  async current(cookie: string | undefined) { return this.withIdentity(cookie, ['admin', 'supervisor', 'operator'], (context, session) => this.sessionData(context, session.user_id, session.token)); }
  publicMutation(headers: MutationHeaders): void {
    validateOrigin(this.origin, headers.origin);
    if (!headers.contentType?.toLowerCase().match(/^application\/json(?:;|$)/u))
      throw new ApiException(400, { code: 'INVALID_INPUT', message: 'Envía un cuerpo JSON.', details: [] });
  }
  protectedMutation(headers: MutationHeaders): void { validateOrigin(this.origin, headers.origin); validateCsrf(headers.cookie, headers.csrf); }
  async logout(headers: MutationHeaders): Promise<void> {
    this.protectedMutation(headers);
    await this.withIdentity(headers.cookie, ['admin', 'supervisor', 'operator'], async (context, session) => { await queryTenant(context, 'UPDATE app.sessions SET revoked_at=$3 WHERE tenant_id=$1 AND id=$2', [context.tenantId, session.session_id, this.clock().toISOString()]); }, 'exclusive');
  }
  private role(value: unknown): string {
    if (value !== 'admin' && value !== 'supervisor' && value !== 'operator') throw new DomainError('INVALID_ROLE', 'El rol no es válido.');
    return value;
  }
  async command(headers: CommandHeaders, type: string, data: unknown, apply: (context: TenantContext, stamp: CommandStamp) => Promise<Record<string, unknown>>, options: Pick<CommandOptions, 'permissions' | 'validateReplay'> & {roles?:readonly string[];jsonBody?:boolean} = {}) {
    if(options.jsonBody!==false)this.publicMutation(headers);
    this.protectedMutation(headers);
    const session = await this.resolveSession(headers.cookie);
    return executeCommand(this.pool('app'), { tenantId: session.tenant_id, actorId: session.user_id, reference: headers.reference ?? '', type, data }, apply, { ...options, clock: this.clock, authorize: async (context) => { await this.authorize(context, session, options.roles??['admin']); } });
  }
  async createUser(headers: CommandHeaders, input: CreateUserInput) {
    const name = normalizeName(input.name), role = this.role(input.role), credentials = this.passwords.validate(input.email, input.password);
    // Passwords never enter a fast command fingerprint. Replay verifies the
    // supplied password against the original account's salted Argon2id hash.
    const data = { name, email: credentials.email, role };
    try {
      return await this.command(headers, 'user.create', data, async (context, stamp) => {
        const id = randomUUID(), hash = await this.passwords.hash(credentials.password);
        const result = (await queryTenant(context, 'INSERT INTO app.users(tenant_id,id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,name,email,role,active', [context.tenantId, id, name, credentials.email, hash, role])).rows[0]!;
        await appendAuditEvent(context, stamp, { kind: 'user.create', entityId: id, details: data });
        await appendChange(context, stamp, [{ kind: 'users', id }]);
        return result;
      }, { validateReplay: async (context, result) => {
          const user = (await queryTenant(context, 'SELECT password_hash FROM app.users WHERE tenant_id=$1 AND id=$2', [context.tenantId, result.id])).rows[0];
          if (!await this.passwords.verify(credentials.password, user?.password_hash ?? null))
            throw new DomainError('REFERENCE_REUSED', 'La referencia ya fue utilizada con otros datos.');
        } });
    }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505' && 'constraint' in error && String(error.constraint).startsWith('users_'))
        throw new DomainError('EMAIL_EXISTS', 'El correo ya existe en esta empresa.');
      throw error;
    }
  }
  async users(cookie: string | undefined, query: Record<string, unknown>) { return this.withIdentity(cookie, ['admin'], context => listUsers(context, query)); }
  private entityId(value: string): string {
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(value)) throw new ApiException(400, {code: 'INVALID_INPUT', message: 'El identificador no es válido.', details: []});
    return value.toLowerCase();
  }
  async updateUser(headers: CommandHeaders, idValue: string, input: UpdateUserInput) {
    const id = this.entityId(idValue);
    const changes: Record<string, unknown> = {};
    if (input.name !== undefined)
      changes.name = normalizeName(input.name);
    if (input.role !== undefined)
      changes.role = this.role(input.role);
    if (input.active !== undefined)
      changes.active = input.active;
    return this.command(headers, 'user.update', { id, ...changes }, async (context, stamp) => {
      const before = (await queryTenant(context, 'SELECT id,name,email,role,active FROM app.users WHERE tenant_id=$1 AND id=$2 FOR UPDATE', [context.tenantId, id])).rows[0];
      if (!before)
        throw new DomainError('NOT_FOUND', 'No se encontró la cuenta en esta empresa.');
      const after = { ...before, ...changes };
      if (before.role === 'admin' && before.active && (after.role !== 'admin' || !after.active)) {
        const remaining = (await queryTenant(context, "SELECT count(*)::int AS n FROM app.users WHERE tenant_id=$1 AND active AND role='admin' AND id<>$2", [context.tenantId, id])).rows[0]!.n;
        if (remaining === 0)
          throw new DomainError('LAST_ACTIVE_ADMIN', 'Debe permanecer al menos un administrador activo.');
      }
      const result = (await queryTenant(context, 'UPDATE app.users SET name=$3,role=$4,active=$5 WHERE tenant_id=$1 AND id=$2 RETURNING id,name,email,role,active', [context.tenantId, id, after.name, after.role, after.active])).rows[0]!;
      await appendAuditEvent(context, stamp, { kind: 'user.update', entityId: id, details: { before, after: result } });
      await appendChange(context, stamp, [{ kind: 'users', id }]);
      return result;
    }, { permissions: 'exclusive' });
  }
  async company(cookie: string | undefined) { return this.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => (await queryTenant(context, 'SELECT id,code,name,time_zone AS "timeZone" FROM app.companies WHERE id=$1', [context.tenantId])).rows[0]); }
  async updateCompany(headers: CommandHeaders, input: UpdateCompanyInput) {
    const changes: Record<string, unknown> = {};
    if (input.name !== undefined)
      changes.name = normalizeName(input.name);
    if (input.timeZone !== undefined)
      changes.timeZone = companyTimeZone(input.timeZone);
    return this.command(headers, 'company.update', changes, async (context, stamp) => {
      const before = (await queryTenant(context, 'SELECT id,code,name,time_zone AS "timeZone" FROM app.companies WHERE id=$1 FOR UPDATE', [context.tenantId])).rows[0]!;
      const after = { ...before, ...changes };
      const result = (await queryTenant(context, 'UPDATE app.companies SET name=$2,time_zone=$3 WHERE id=$1 RETURNING id,code,name,time_zone AS "timeZone"', [context.tenantId, after.name, after.timeZone])).rows[0]!;
      await appendAuditEvent(context, stamp, { kind: 'company.update', entityId: context.tenantId, details: { before, after: result } });
      await appendChange(context, stamp, [{ kind: 'company', id: context.tenantId }]);
      return result;
    });
  }
  async operation(cookie: string | undefined, value: string) {
    const reference = this.entityId(value);
    return this.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context, session) => { const user = await this.authorize(context, session, ['admin', 'supervisor', 'operator']); return operationResult(context, reference, user.role, user.id); });
  }
}
