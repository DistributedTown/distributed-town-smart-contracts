# Truffle

## Deployment

`truffle migrate --network regtest`
_run it twice to avoid truff issue #2224 _

## Network Config

In order to use `--network regtest` in above commands, you need to make sure in truffle-config.js the networks setting include regtest

```js
networks: {
    regtest: {
      provider: new PrivateKeyProvider(privateKey, "http://127.0.0.1:4444"),
      host: "127.0.0.1",
      port: 4444,
      network_id: 33,
    }
},
```
