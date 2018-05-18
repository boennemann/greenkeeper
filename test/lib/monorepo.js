const dbs = require('../../lib/dbs')
const removeIfExists = require('../helpers/remove-if-exists')

describe('lib monorepo', async () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })
  afterEach(async () => {
    const { npm } = await dbs()
    await Promise.all([
      removeIfExists(npm, '@avocado/dep', '@banana/dep', 'koeln', 'berlin', 'hamburg',
      'monorepo:11', 'monorepo:12', 'monorepo:22', 'monorepo:44', 'monorepo:55', 'monorepo:66')
    ])
  })

  test('isPartOfMonorepo true', async () => {
    jest.mock('../../lib/monorepo', () => {
      const lib = require.requireActual('../../lib/monorepo')
      lib.getMonorepoGroupNameForPackage = async (dep) => {
        return 'fruits'
      }
      return lib
    })

    const libMonorepo = require.requireMock('../../lib/monorepo')
    const isPartOfMonorepo = await libMonorepo.isPartOfMonorepo('@avocado/dep')
    expect(isPartOfMonorepo).toBeTruthy()
  })

  test('isPartOfMonorepo false', async () => {
    const { isPartOfMonorepo } = await require.requireActual('../../lib/monorepo')
    const result = await isPartOfMonorepo('some-dep')
    expect(result).toBeFalsy()
  })

  test('hasAllMonorepoUdates true', async () => {
    const { npm } = await dbs()
    await npm.put({
      _id: '@avocado/dep',
      distTags: {
        latest: '2.0.0'
      }
    })

    await npm.put({
      _id: '@banana/dep',
      distTags: {
        latest: '2.0.0'
      }
    })

    jest.mock('../../utils/monorepo-definitions', () => {
      return { 'fruits': ['@avocado/dep', '@banana/dep'] }
    })
    jest.mock('../../lib/monorepo', () => {
      const lib = require.requireActual('../../lib/monorepo')
      lib.getMonorepoGroupNameForPackage = async (dep) => {
        return 'fruits'
      }
      return lib
    })

    const libMonorepo = require.requireMock('../../lib/monorepo')
    const result = await libMonorepo.hasAllMonorepoUdates('@avocado/dep', '2.0.0')
    expect(result).toBeTruthy()
  })

  test('hasAllMonorepoUdates false', async () => {
    const { npm } = await dbs()
    await npm.put({
      _id: 'berlin',
      distTags: {
        latest: '2.0.0'
      }
    })

    await npm.put({
      _id: 'koeln',
      distTags: {
        latest: '2.0.0'
      }
    })

    await npm.put({
      _id: 'hamburg',
      distTags: {
        latest: '1.0.0'
      }
    })

    jest.mock('../../utils/monorepo-definitions', () => {
      return { 'cities': ['koeln', 'hamburg', 'berlin'] }
    })
    jest.mock('../../lib/monorepo', () => {
      const lib = require.requireActual('../../lib/monorepo')
      lib.getMonorepoGroupNameForPackage = (dep) => {
        return 'cities'
      }
      return lib
    })

    const libMonorepo = require.requireMock('../../lib/monorepo')
    const result = await libMonorepo.hasAllMonorepoUdates('berlin', '2.0.0')
    expect(result).toBeFalsy()
  })

  test('getMonorepoGroup', async () => {
    const { getMonorepoGroupNameForPackage } = require.requireActual('../../lib/monorepo')
    const result = await getMonorepoGroupNameForPackage('pouchdb-md5')
    expect(result).toBe('pouchdb')
  })

  test('pendingMonorepoReleases 11 and 44min', async () => {
    const { pendingMonorepoReleases } = require.requireActual('../../lib/monorepo')
    const { npm } = await dbs()
    await npm.put({
      _id: 'monorepo:11',
      distTags: {
        latest: '2.0.0'
      },
      updatedAt: new Date(new Date().getTime() - 11 * 60000).toJSON()
    })

    await npm.put({
      _id: 'monorepo:44',
      distTags: {
        latest: '1.0.0'
      },
      updatedAt: new Date(new Date().getTime() - 44 * 60000).toJSON()
    })
    const result = await pendingMonorepoReleases()
    expect(result).toHaveLength(1)
    expect(result[0]._id).toEqual('monorepo:44')
  })

  test('pendingMonorepoReleases 12 and 22min', async () => {
    const { pendingMonorepoReleases } = require.requireActual('../../lib/monorepo')
    const { npm } = await dbs()
    await npm.put({
      _id: 'monorepo:12',
      distTags: {
        latest: '2.0.0'
      },
      updatedAt: new Date(new Date().getTime() - 12 * 60000).toJSON()
    })

    await npm.put({
      _id: 'monorepo:22',
      distTags: {
        latest: '1.0.0'
      },
      updatedAt: new Date(new Date().getTime() - 22 * 60000).toJSON()
    })
    const result = await pendingMonorepoReleases()
    expect(result).toHaveLength(0)
  })

  test('pendingMonorepoReleases 55 and 66min', async () => {
    const { pendingMonorepoReleases } = require.requireActual('../../lib/monorepo')
    const { npm } = await dbs()
    await npm.put({
      _id: 'monorepo:55',
      distTags: {
        latest: '2.0.0'
      },
      updatedAt: new Date(new Date().getTime() - 55 * 60000).toJSON()
    })

    await npm.put({
      _id: 'monorepo:66',
      distTags: {
        latest: '1.0.0'
      },
      updatedAt: new Date(new Date().getTime() - 66 * 60000).toJSON()
    })
    const result = await pendingMonorepoReleases()
    expect(result).toHaveLength(2)
    expect(result[0]._id).toEqual('monorepo:66')
    expect(result[1]._id).toEqual('monorepo:55')
  })

  test('pendingMonorepoReleases without data', async () => {
    const { pendingMonorepoReleases } = require.requireActual('../../lib/monorepo')
    const result = await pendingMonorepoReleases()
    expect(result).toHaveLength(0)
  })
})
