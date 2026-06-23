require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local Ethereum network used by the demo. "hardhat node" listens here.
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};
