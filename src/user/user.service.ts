import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {

  users : any[] = [];

  create(data: any) {
    this.users.push(data);
    return data;
  }

  findAll() {
    return this.users;
  }
}
