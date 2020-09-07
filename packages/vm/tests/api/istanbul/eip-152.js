const tape = require('tape')
const BN = require('bn.js')
const Common = require('@ethereumjs/common').default
const blake2f = require('../../../dist/evm/precompiles/09-blake2f').default
const F = require('../../../dist/evm/precompiles/09-blake2f').F
const { ERROR } = require('../../../dist/exceptions')

// Test cases from:
// https://github.com/keep-network/go-ethereum/blob/1bccafe5ef54ba849e414ce7c90f7b7130634a9a/core/vm/contracts_test.go
const failingtestCases = [
  {
    input: '',
    err: ERROR.OUT_OF_RANGE,
    name: 'vector 0: empty input'
  },
  {
    input: '00000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001',
    err: ERROR.OUT_OF_RANGE,
    name: 'vector 1: less than 213 bytes input'
  },
  {
    input: '000000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001',
    err: ERROR.OUT_OF_RANGE,
    name: 'vector 2: more than 213 bytes input'
  },
  {
    input: '0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000002',
    err: ERROR.OUT_OF_RANGE,
    name: 'vector 3: malformed final block indicator flag'
  }
]

const testCases = [
  {
    input: '0000000048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001',
    expected: '08c9bcf367e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d282e6ad7f520e511f6c3e2b8c68059b9442be0454267ce079217e1319cde05b',
    name: 'vector 4'
  },
  {
    input: '0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001',
    expected: 'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
    name: 'vector 5'
  },
  {
    input: '0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000',
    expected: '75ab69d3190a562c51aef8d88f1c2775876944407270c42c9844252c26d2875298743e7f6d5ea2f2d3e8d226039cd31b4e426ac4f2d3d666a610c2116fde4735',
    name: 'vector 6'
  },
  {
    input: '0000000148c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001',
    expected: 'b63a380cb2897d521994a85234ee2c181b5f844d2c624c002677e9703449d2fba551b3a8333bcdf5f2f7e08993d53923de3d64fcc68c034e717b9293fed7a421',
    name: 'vector 7'
  },
  {
    input: '007A120048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001',
    expected: '6d2ce9e534d50e18ff866ae92d70cceba79bbcd14c63819fe48752c8aca87a4bb7dcc230d22a4047f0486cfcfb50a17b24b2899eb8fca370f22240adb5170189',
    name: 'vector 8'
  }
]

tape('Istanbul: EIP-152 Blake2f', async (t) => {
  const common = new Common({ chain: 'mainnet', hardfork: 'istanbul' })
  for (const testCase of failingtestCases) {
    t.comment(testCase.name)
    const res = blake2f({ data: Buffer.from(testCase.input, 'hex'), gasLimit: new BN(20), _common: common })
    t.equal(res.exceptionError.error, testCase.err)
  }

  for (const testCase of testCases) {
    t.comment(testCase.name)
    const res = blake2f({ data: Buffer.from(testCase.input, 'hex'), gasLimit: new BN(10000000), _common: common })
    t.equal(res.returnValue.toString('hex'), testCase.expected)
  }

  t.end()
})

// Test case from:
// https://github.com/keep-network/go-ethereum/blob/1bccafe5ef54ba849e414ce7c90f7b7130634a9a/crypto/blake2b/blake2b_f_test.go
const fTestCases = [{
  hIn: new Uint32Array([
    0xf2bdc948, 0x6a09e667, 0x84caa73b, 0xbb67ae85,
    0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
    0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c,
    0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19
  ]),
  m: new Uint32Array([
    0x00636261, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
  ]),
  t: new Uint32Array([3, 0, 0, 0]),
  f: true,
  rounds: 12,
  hOut: new Uint32Array([
    0x3FA580BA, 0x0D4D1C98, 0xB697276A, 0xE9F6129F,
    0x142F214C, 0xB7C45A68, 0x6FBB124B, 0xD1A2FFDB,
    0x39C5877D, 0x2D79AB2A, 0xDED552C2, 0x95CC3345,
    0xA88AD318, 0x5A92F1DB, 0xED8623B9, 0x239900D4
  ])
}]

tape('Blake2 F', async (t) => {
  for (const testCase of fTestCases) {
    F(testCase.hIn, testCase.m, testCase.t, testCase.f, testCase.rounds)
    t.deepEqual(testCase.hIn, testCase.hOut)
  }

  t.end()
})
