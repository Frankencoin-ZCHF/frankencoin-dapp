# new address

```
geth --datadir /data account new
```

# Extract privKey

```
var keythereum = require("keythereum");
var datadir = "/data";
var address= "0x4c48e7ddcbb5a7eb45bf54ae9e826015993526a0";
const password = "asdfasdf";

var keyObject = keythereum.importFromFile(address, datadir);
var privateKey = keythereum.recover(password, keyObject);
console.log(privateKey.toString('hex'));
```

# Run private chain

```
geth --datadir /data --password /data/password.txt --dev --dev.period 10 --networkid 1337 --nodiscover --http --http.addr "0.0.0.0" --http.vhosts "*" --http.corsdomain "*"
```

# Test

```
curl localhost:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'

curl https://ethereum3.3dotshub.com \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_getBalance","params":["0x4c48e7ddcbb5a7eb45bf54ae9e826015993526a0", "latest"],"id":1,"jsonrpc":"2.0"}'


curl https://ethereum3.3dotshub.com \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}'
```
