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

// When calling postUser, if no parameter is passed, user will default to validUser and options will default to an empty object.
const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language); // Accept-language is an HTTP header
  }
  return agent.send(user);
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

  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'passworD987654',
    });

    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  const username_null = 'Username cannot be null';
  const username_size = 'Must have minimum 4 and maximum 32 characters';
  const email_null = 'E-mail cannot be null';
  const email_invalid = 'E-mail is not valid';
  const email_in_use = 'E-mail in use';
  const password_null = 'Password cannot be null';
  const password_size = 'Password must be at least 6 characters long';
  const password_pattern =
    'Password must have at least one uppercase, one lowercase and one number';

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${`mail.com`}      | ${email_invalid}
    ${'email'}    | ${`user.mail.com`} | ${email_invalid}
    ${'email'}    | ${`user@mail`}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ssw'}         | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
    ${'password'} | ${'123456789'}     | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'} | ${password_pattern}
    ${'password'} | ${'lowerand123'}   | ${password_pattern}
    ${'password'} | ${'UPPERAND123'}   | ${password_pattern}
  `(
    // Test description, which can access to the actual values of $field and $expectedMessage
    'returns $expectedMessage when $field is $value',
    async ({ field, expectedMessage, value }) => {
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

  it(`returns ${email_in_use} when same email is already in use`, async () => {
    // We are going to create a user with User.create and postUser without any parameters defaults to validUser, so with this we will create two users with the same details
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(email_in_use);
  });

  it('returns errors for both when username and email are null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'passworD987654',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});

describe('Internationalization', () => {
  const username_null = 'Nombre de usuario no puede ser nulo';
  const username_size =
    'Nombre de usuario tiene que tener mínimo 4 y máximo 32 caracteres';
  const email_null = 'E-mail no puede ser nulo';
  const email_invalid = 'E-mail inválido';
  const email_in_use = 'E-mail ya existe';
  const password_null = 'Contraseña no puede ser nula';
  const password_size = 'Contraseña tiene que tener por lo menos 6 caracteres';
  const password_pattern =
    'Contraseña tiene que tener por lo menos una mayúscula, una minúscula y un número';
  const user_create_success = 'Usuario creado';

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${`mail.com`}      | ${email_invalid}
    ${'email'}    | ${`user.mail.com`} | ${email_invalid}
    ${'email'}    | ${`user@mail`}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ssw'}         | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
    ${'password'} | ${'123456789'}     | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'} | ${password_pattern}
    ${'password'} | ${'lowerand123'}   | ${password_pattern}
    ${'password'} | ${'UPPERAND123'}   | ${password_pattern}
  `(
    // Test description, which can access to the actual values of $field and $expectedMessage
    'returns $expectedMessage when $field is $value when language is set as Spanish',
    async ({ field, value, expectedMessage }) => {
      // The following object stores all the valid fields
      const user = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'passworD987654',
      };
      user[field] = value;
      const response = await postUser(user, { language: 'es' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    },
  );

  it(`returns ${email_in_use} when same email is already in use when language is set as Spanish`, async () => {
    // We are going to create a user with User.create and postUser without any parameters defaults to validUser, so with this we will create two users with the same details
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'es' });
    expect(response.body.validationErrors.email).toBe(email_in_use);
  });

  it(`returns success message of ${user_create_success} when signup request is valid and language is set as Spanish`, async () => {
    const response = await postUser({ ...validUser }, { language: 'es' });
    expect(response.body.message).toBe(user_create_success);
  });
});
