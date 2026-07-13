const userModel = require('../../src/models/user.model');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../../src/controllers/user.controller');

jest.mock('../../src/models/user.model');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const sampleUser = {
  id: 1,
  first_name: 'Ada',
  last_name: 'Lovelace',
  city: 'Londres',
  address: 'Calle Mayor 12',
  profession: 'Matemática',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUsers', () => {
  test('returns 200 with the list of users', async () => {
    userModel.findAll.mockResolvedValue([sampleUser]);
    const res = mockResponse();

    await getUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([sampleUser]);
  });

  test('returns 500 when the model throws', async () => {
    userModel.findAll.mockRejectedValue(new Error('db down'));
    const res = mockResponse();

    await getUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db down' });
  });
});

describe('getUserById', () => {
  test('returns 200 with the user when it exists', async () => {
    userModel.findById.mockResolvedValue(sampleUser);
    const res = mockResponse();

    await getUserById({ params: { id: '1' } }, res);

    expect(userModel.findById).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(sampleUser);
  });

  test('returns 404 when the user does not exist', async () => {
    userModel.findById.mockResolvedValue(null);
    const res = mockResponse();

    await getUserById({ params: { id: '99' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });
});

describe('createUser', () => {
  test('returns 201 with the created user', async () => {
    userModel.create.mockResolvedValue(sampleUser);
    const res = mockResponse();
    const req = { body: { first_name: 'Ada', last_name: 'Lovelace' } };

    await createUser(req, res);

    expect(userModel.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(sampleUser);
  });

  test('returns 400 when first_name is missing', async () => {
    const res = mockResponse();

    await createUser({ body: { last_name: 'Lovelace' } }, res);

    expect(userModel.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when last_name is missing', async () => {
    const res = mockResponse();

    await createUser({ body: { first_name: 'Ada' } }, res);

    expect(userModel.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('updateUser', () => {
  test('returns 200 with the updated user', async () => {
    const updated = { ...sampleUser, city: 'Madrid' };
    userModel.update.mockResolvedValue(updated);
    const res = mockResponse();

    await updateUser({ params: { id: '1' }, body: { city: 'Madrid' } }, res);

    expect(userModel.update).toHaveBeenCalledWith('1', { city: 'Madrid' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 404 when the user does not exist', async () => {
    userModel.update.mockResolvedValue(null);
    const res = mockResponse();

    await updateUser({ params: { id: '99' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('deleteUser', () => {
  test('returns 204 when the user is deleted', async () => {
    userModel.remove.mockResolvedValue(true);
    const res = mockResponse();

    await deleteUser({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('returns 404 when the user does not exist', async () => {
    userModel.remove.mockResolvedValue(false);
    const res = mockResponse();

    await deleteUser({ params: { id: '99' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
