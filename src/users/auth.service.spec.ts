import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 9999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('Can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('Creates new user with salted and hashed password', async () => {
    const user = await service.signup('asdf@asdf.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('Throws an error if user signs up with already used email', async () => {
    await service.signup('ola@ola.com', 'apaps');
    await expect(service.signup('ola@ola.com', 'apaps')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Throws and error if signin is called with an unused email', async () => {
    await expect(service.signin('asd@a.com', 'passdflkj')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Throws and error if an invalid password is provided for signin', async () => {
    await service.signup('asdf@asdf.comm', 'otherpassword');
    await expect(service.signin('asdf@asdf.comm', 'password')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Returns user if email and password are correct for signin', async () => {
    await service.signup('ola@ola.com', 'mypassword');
    const user = await service.signin('ola@ola.com', 'mypassword');
    expect(user).toBeDefined();
  });
});
