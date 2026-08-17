/**
 * __tests__/gameApi.test.ts
 * ------------------------
 * Regression coverage for VR game installation endpoint selection.
 */
import vrClient from '../src/api/vrClient';
import { fetchGameInstallations } from '../src/api/games';

jest.mock('../src/api/vrClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedClient = vrClient as jest.Mocked<typeof vrClient>;

describe('fetchGameInstallations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the active VR backend for headset installation lookups', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: [
        {
          id: 11,
          game_id: 1,
          headset_id: 4,
          headset_code: 'DZ1',
          headset_model: 'Meta Quest 3',
          install_date: '2025-01-01',
          expiry_date: '2099-01-01',
          installation_status: 'ACTIVE',
        },
      ],
    });

    const installations = await fetchGameInstallations(1, true);

    expect(installations).toHaveLength(1);
    expect(installations[0].headset_code).toBe('DZ1');
    expect(mockedClient.get).toHaveBeenCalledWith(
      'https://www.dspirezone.com/api/games/1/installations',
      { params: { active_only: true } },
    );
  });
});
