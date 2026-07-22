import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../src/auth/constants';

const jwtService = new JwtService({
  secret: jwtConstants.secret,
  signOptions: { expiresIn: '1h' },
});

export function buildToken(role: string, sub = '1', email = 'test@example.com'): string {
  return jwtService.sign({ sub, email, role });
}

export function authHeader(role: string, sub = '1', email = 'test@example.com') {
  return `Bearer ${buildToken(role, sub, email)}`;
}
