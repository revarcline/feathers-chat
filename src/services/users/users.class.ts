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

// type interface for our user (does not validate data)
interface UserData {
  _id?: string;
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  githubId: string;
}

export class Users extends Service<UserData> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options);
  }

  create(data: UserData, params?: Params) {
    // this is the information we want from the user signup data
    const { email, password, githubId, name } = data;
    // use existing avatar image or return gravatar for email
    const avatar = data.avatar || getGravatar(email);
    // complete user
    const userData = {
      email,
      name,
      password,
      githubId,
      avatar,
    };

    // call original 'create' method with existing 'params' and new data
    return super.create(userData, params);
  }
}
