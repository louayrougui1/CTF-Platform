// google.strategy.ts
import { Inject, Injectable } from '@nestjs/common';
import googleOAuthConfig from '../config/google-oauth.config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleOAuthConfig.KEY)
    private readonly googleConfig: ConfigType<typeof googleOAuthConfig>,
  ) {
    super({
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    console.log(profile);
    const user = {
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      picture: profile.photos?.[0]?.value,
    };
    done(null, user);
  }
}
