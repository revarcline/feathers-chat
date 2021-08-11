import crypto from 'crypto';
import { Params } from '@feathersjs/feathers';
import { Service, NedbServiceOptions } from 'feathers-nedb';
import { Application } from '../../declarations';

// Gravatar image service
const gravatarUrl = 'https://s.gravatar.com/avatar';
// size query (60 px)
const query = 's=60';
// returns gravatar image for email
const getGravatar = (email: string) => {
  // gravatar uses md5 hash of an all-lowercase email address to get image
  const hash = crypto
    .createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');
  return `${gravatarUrl}/${hash}?${query}`;
};

export class Users extends Service {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options);
  }
}
