const ethers = await import("npm:ethers@6.10.0");

const request = Functions.makeHttpRequest({
    url: `https://www.googleapis.com/oauth2/v3/certs`,
    headers: {
        "Content-Type": "application/json",
    },
});

const response = await request;

if (!response.error) {
    console.log(response.data);
} else {
    console.log("Response Error");
}

/* response.data
{
    "keys": [
        {
            "e": "AQAB",
            "n": ">256 bytes string",
            "kid": "323b214ae6975a0f034ea77354dc0c25d03642dc",
            "alg": "RS256",
            "kty": "RSA",
            "use": "sig"
        },
        {
            "alg": "RS256",
            "n": ">256 bytes string",
            "kty": "RSA",
            "kid": "6719678351a5faedc2e70274bbea62da2a8c4a12",
            "e": "AQAB",
            "use": "sig"
        },
    ]
}
*/


// const types = ['tuple(string e, bytes n, string kid, string alg, string kty, string use)[]'];
const types = ['bytes n'];
// n takes 320 bytes! > 256 bytes limit
// should use other way to upload n on-chain
// e.g. hash(n)
const values = [ethers.decodeBase64(response.data.keys[0].n)];
console.log(`key[0].n ${values}`);

// const values = [response.data.keys.map(key => [key.e, ethers.decodeBase64(key.n), key.kid, key.alg, key.kty, key.use])];

const encoded = ethers.AbiCoder.defaultAbiCoder().encode(types, values);
const length = ethers.dataLength(encoded);
console.log(`encoded length in bytes: ${length}`);
// return the encoded data as Uint8Array
return ethers.getBytes(encoded);