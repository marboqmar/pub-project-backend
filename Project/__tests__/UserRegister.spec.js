const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'passworD987654',
};

// When calling postUser, if no parameter is passed, user will default to validUser.
const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('User Registration', () => {
  it('returns 200 ok when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('saves user to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves username and email to database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('hashes the passwords in the database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('passworD987654');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'passworD987654',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'passworD987654',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have minimum 4 and maximum 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have minimum 4 and maximum 32 characters'}
    ${'email'}    | ${null}            | ${'E-mail cannot be null'}
    ${'email'}    | ${`mail.com`}      | ${'E-mail is not valid'}
    ${'email'}    | ${`user.mail.com`} | ${'E-mail is not valid'}
    ${'email'}    | ${`user@mail`}     | ${'E-mail is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'P4ssw'}         | ${'Password must be at least 6 characters long'}
    ${'password'} | ${'alllowercase'}  | ${'Password must have at least one uppercase, one lowercase and one number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password must have at least one uppercase, one lowercase and one number'}
    ${'password'} | ${'123456789'}     | ${'Password must have at least one uppercase, one lowercase and one number'}
    ${'password'} | ${'lowerandUPPER'} | ${'Password must have at least one uppercase, one lowercase and one number'}
    ${'password'} | ${'lowerand123'}   | ${'Password must have at least one uppercase, one lowercase and one number'}
    ${'password'} | ${'UPPERAND123'}   | ${'Password must have at least one uppercase, one lowercase and one number'}
  `(
    // Test description, which can access to the actual values of $field and $expectedMessage
    'returns $expectedMessage when $field is $value',
    async ({ field, value, expectedMessage }) => {
      // The following object stores all the valid fields
      const user = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'passworD987654',
      };
      user[field] = value;
      const response = await postUser(user);
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    },
  );

  it('returns errors for both when username and email are null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'passworD987654',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('returns E-mail in use when same email is already in use', async () => {
    // We are going to create a user with User.create and postUser without any parameters defaults to validUser, so with this we will create two users with the same details
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('E-mail in use');
  });
});
