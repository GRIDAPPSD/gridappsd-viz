


const connect = {
  gossServiceUrl: 'ws://127.0.0.1:61614',
  username: 'system',
  password: 'manager',
};

describe('Goss connection', () => {
  test('connection url', () => {
    expect(connect.gossServiceUrl).toBe('ws://127.0.0.1:61614');
  });

  test('username', () => {
    expect(connect.username).toBe('system');
  });
});
test('password', () => {
  expect(connect.password).toBe('manager');
});