import { BasePage } from './base-page';
import { currentTime } from '../utils/time-utility';

// Login is implemented as a stub for guest shopping; real login requires handling captcha/2FA.
export class LoginPage extends BasePage {
  constructor(page: any) { super(page); }

  async login(username: string, password: string) {
    console.log(`${await currentTime()} - [LoginPage] stub login - not performing real auth in this scaffold`);
    // If you want, implement real login using locator-utility and environment vars.
  }
}
