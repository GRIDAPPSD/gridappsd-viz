import { User } from './User';
import { AuthenticationStatusCode } from './AuthenticationStatusCode';

export interface AuthenticationResult {
  user: User;
  statusCode: AuthenticationStatusCode;
}
