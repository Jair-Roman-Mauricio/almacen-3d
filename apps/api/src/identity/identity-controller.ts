import {Body, Controller, Post, Get, HttpCode, Res, Req, Delete, Header, Query, Patch, Param, UseGuards} from '@nestjs/common';
import type {Request, Response} from 'express';
import {
  registrationSchema, loginSchema, createUserSchema, updateUserSchema, updateCompanySchema,
  type UpdateCompanyInput, type UpdateUserInput, type CreateUserInput, type LoginInput, type RegistrationInput,
} from '@almacen/contracts';
import {sessionCookie} from './session-token.js';
import {IdentityQueryGuard} from './identity-query.guard.js';
import {IdentityService} from './identity-service.js';

class RegistrationDto {
  static schema = registrationSchema;
  declare company: RegistrationInput['company'];
  declare administrator: RegistrationInput['administrator'];
}
class LoginDto {
  static schema = loginSchema;
  declare companyCode: LoginInput['companyCode'];
  declare email: LoginInput['email'];
  declare password: LoginInput['password'];
}
class CreateUserDto {
  static schema = createUserSchema;
  declare name: CreateUserInput['name'];
  declare email: CreateUserInput['email'];
  declare password: CreateUserInput['password'];
  declare role: CreateUserInput['role'];
}
class UpdateUserDto {
  static schema = updateUserSchema;
  declare name: UpdateUserInput['name'];
  declare role: UpdateUserInput['role'];
  declare active: UpdateUserInput['active'];
}
class UpdateCompanyDto {
  static schema = updateCompanySchema;
  declare name: UpdateCompanyInput['name'];
  declare timeZone: UpdateCompanyInput['timeZone'];
}

@Controller()
@UseGuards(IdentityQueryGuard)
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  private headers(request: Request) {
    return {
      cookie: request.headers.cookie, origin: request.get('origin'), csrf: request.get('x-csrf-token'),
      reference: request.get('idempotency-key'), contentType: request.get('content-type'),
    };
  }
  private cookieOptions() {
    return {httpOnly: true, sameSite: 'lax' as const, secure: this.identity.origin.startsWith('https:'), path: '/'};
  }

  @Header('Cache-Control', 'no-store')
  @Post('sessions')
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Res({passthrough: true}) response: Response, @Req() request: Request) {
    this.identity.publicMutation(this.headers(request));
    const result = await this.identity.login(body);
    response.cookie(sessionCookie, result.token, this.cookieOptions());
    return {data: result.data};
  }

  @Header('Cache-Control', 'no-store')
  @Delete('sessions/current')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({passthrough: true}) response: Response) {
    await this.identity.logout(this.headers(request));
    response.clearCookie(sessionCookie, this.cookieOptions());
  }

  @Header('Cache-Control', 'no-store')
  @Get('sessions/current')
  async current(@Req() request: Request) {
    return {data: await this.identity.current(request.headers.cookie)};
  }

  @Header('Cache-Control', 'no-store')
  @Post('users')
  async createUser(@Req() request: Request, @Body() body: CreateUserDto, @Res({passthrough: true}) response: Response) {
    const result = await this.identity.createUser(this.headers(request), body);
    if (result.replayed) response.setHeader('Idempotent-Replayed', 'true');
    return {data: result.operation};
  }

  @Header('Cache-Control', 'no-store')
  @Patch('users/:id')
  async updateUser(@Req() request: Request, @Param('id') id: string, @Body() body: UpdateUserDto, @Res({passthrough: true}) response: Response) {
    const result = await this.identity.updateUser(this.headers(request), id, body);
    if (result.replayed) response.setHeader('Idempotent-Replayed', 'true');
    return {data: result.operation};
  }

  @Header('Cache-Control', 'no-store')
  @Get('company')
  async company(@Req() request: Request) {
    return {data: await this.identity.company(request.headers.cookie)};
  }

  @Header('Cache-Control', 'no-store')
  @Patch('company')
  async updateCompany(@Req() request: Request, @Body() body: UpdateCompanyDto, @Res({passthrough: true}) response: Response) {
    const result = await this.identity.updateCompany(this.headers(request), body);
    if (result.replayed) response.setHeader('Idempotent-Replayed', 'true');
    return {data: result.operation};
  }

  @Header('Cache-Control', 'no-store')
  @Get('operations/:reference')
  async operation(@Req() request: Request, @Param('reference') reference: string, @Res({passthrough: true}) response: Response) {
    const result = await this.identity.operation(request.headers.cookie, reference);
    response.status(result.status);
    return {data: result.data};
  }

  @Header('Cache-Control', 'no-store')
  @Get('users')
  async users(@Req() request: Request, @Query() query: Record<string, unknown>) {
    return this.identity.users(request.headers.cookie, query);
  }

  @Header('Cache-Control', 'no-store')
  @Get('public/config')
  async config() {
    return {data: await this.identity.config()};
  }

  @Header('Cache-Control', 'no-store')
  @Post('local-setup')
  async setup(@Body() body: RegistrationDto, @Req() request: Request) {
    this.identity.publicMutation(this.headers(request));
    return {data: await this.identity.setup(body)};
  }

  @Header('Cache-Control', 'no-store')
  @Post('registrations')
  async register(@Body() body: RegistrationDto, @Req() request: Request) {
    this.identity.publicMutation(this.headers(request));
    return {data: await this.identity.register(body)};
  }
}
