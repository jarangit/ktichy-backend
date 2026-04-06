type TokenType = 'user' | 'device';

interface BaseJwtPayload {
  sub: string;
  tokenType: TokenType;
}

interface UserJwtPayload extends BaseJwtPayload {
  tokenType: 'user';
  email: string;
}

interface DeviceJwtPayload extends BaseJwtPayload {
  tokenType: 'device';
  store: string;
  station: string;
}

export type AppJwtPayload = UserJwtPayload | DeviceJwtPayload;
