const fs = require("fs");
const path = require("path");
const {
  SecretsManager,
  simulateScript,
  buildRequestCBOR,
  ReturnType,
  decodeResult,
  Location,
  CodeLanguage,
} = require("@chainlink/functions-toolkit");
const automatedFunctionsConsumerAbi = require("../abi/automatedFunctions.json");
const ethers = require("ethers");
require("@chainlink/env-enc").config();

const consumerAddress = process.env.CONSUMER_ADDR;
const subscriptionId = process.env.SUB_ID; // REPLACE this with your subscription ID

const updateRequest = async () => {
  // hardcoded for Fuji
  const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
  const donId = "fun-avalanche-fuji-1";
  const explorerUrl = "https://testnet.snowtrace.io";
  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/"
  ];

  // Initialize functions settings
  const source = fs
    .readFileSync(path.resolve(__dirname, "source.js"))
    .toString();

  const args = ["bitcoin", "bitcoin", "btc-bitcoin"];
  const gasLimit = 300000;

  // Initialize ethers signer and provider to interact with the contracts onchain
  const privateKey = process.env.PRIVATE_KEY; // fetch PRIVATE_KEY
  if (!privateKey)
    throw new Error(
      "private key not provided - check your environment variables"
    );

  const rpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL; // fetch Sepolia RPC URL

  if (!rpcUrl)
    throw new Error(`rpcUrl not provided  - check your environment variables`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider); // create ethers signer for signing transactions

  ///////// START SIMULATION ////////////

  console.log("Start simulation...");

  const response = await simulateScript({
    source: source,
    args: args,
    bytesArgs: [], // bytesArgs - arguments can be encoded off-chain to bytes.
  });

  console.log("Simulation result", response);
  const errorString = response.errorString;
  if (errorString) {
    console.log(`❌ Error during simulation: `, errorString);
  } else {
    const returnType = ReturnType.uint256;
    const responseBytesHexstring = response.responseBytesHexstring;
    if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
      const decodedResponse = decodeResult(
        response.responseBytesHexstring,
        returnType
      );
      console.log(`✅ Decoded response to ${returnType}: `, decodedResponse);
    }
  }

  //////// MAKE REQUEST ////////

  console.log("\nMake request...");

  const automatedFunctionsConsumer = new ethers.Contract(
    consumerAddress,
    automatedFunctionsConsumerAbi,
    signer
  );

  // Encode request
  const functionsRequestBytesHexString = buildRequestCBOR({
    codeLocation: Location.Inline, // Location of the source code - Only Inline is supported at the moment
    codeLanguage: CodeLanguage.JavaScript, // Code language - Only JavaScript is supported at the moment
    source: source, // soure code
    args: args,
    bytesArgs: [], // bytesArgs - arguments can be encoded off-chain to bytes.
  });

  // Update request settings
  const transaction = await automatedFunctionsConsumer.updateRequest(
    functionsRequestBytesHexString,
    subscriptionId,
    gasLimit,
    ethers.utils.formatBytes32String(donId) // jobId is bytes32 representation of donId
  );

  // Log transaction details
  console.log(
    `\n✅ Automated Functions request settings updated! Transaction hash ${transaction.hash} - Check the explorer ${explorerUrl}/tx/${transaction.hash}`
  );
};

updateRequest().catch((e) => {
  console.error(e);
  process.exit(1);
});
