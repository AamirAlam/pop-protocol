/* eslint-disable camelcase */

const { PerpetualOptionsProtocol } = require("../math/popMath");
const { Sequencer } = require("./execution");

// function Sequencer(web3) {
//   const name = "Sequencer";
//   const deployer = SourceFileLoader(
//     "Deployer",
//     "/home/ice/Projects/eb/pop_protocol/unit_testing/deployer.py"
//   ).load_module();
//   const settlement = SourceFileLoader(
//     "Settlement",
//     "/home/ice/Projects/eb/pop_protocol/sequencer/settlement.py"
//   ).load_module();
//   const contract_objects = null;
//   const trading_contract = null;
//   const latest_arrays = {};

//   function deploy_contracts(account) {
//     contract_objects = deployer.run_deploys(account);
//     trading_contract = contract_objects["Trading"];
//     console.log(
//       `trading contract owner: ${trading_contract.functions.owner().call()}`
//     );
//   }

//   function check_for_mints() {
//     try {
//       const events = fetch_events(
//         trading_contract.events.Mint,
//         web3.eth.blockNumber - 50
//       );
//       if (events.length > 0) {
//         for (const item of events) {
//           console.log(
//             `MonitorService: EVENT FOUND in block ${item.blockNumber}`
//           );
//         }
//       }
//     } catch (e) {
//       console.log(`MonitorService: error retrieving events on chain: ${e}`);
//     }
//   }

//   function request_onchain_price() {
//     const oracleABIs = require("defi_infrastructure/config/abi");
//     const chainlink_oracle_eth_to_usd = load_contract(
//       web3,
//       oracleABIs.chainlink_eth_to_usd,
//       "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
//     );
//     const price = chainlink_oracle_eth_to_usd.functions.latestAnswer().call();
//     return parseFloat(price / 10 ** 8);
//   }

//   function request_offchain_price() {
//     const price = coingecko_pricing("ethereum")[0];
//     return parseFloat(price);
//   }

//   function validate_price(onchain, offchain) {
//     const value = (Math.abs(onchain - offchain) / offchain) * 100.0;
//     return value < 25;
//   }

//   function price_check() {
//     const onchain = request_onchain_price();
//     const offchain = request_offchain_price();
//     if (!validate_price(onchain, offchain)) {
//       console.log(`onchain: ${onchain}, offchain: ${offchain}`);
//       return false;
//     }
//     return offchain;
//   }

//   //   function load_math_obj(n) {
//   //     const load_math = SourceFileLoader(
//   //       "PerpetualOptionsProtocol",
//   //       "/home/ice/Projects/eb/pop_protocol/math/pop_math.py"
//   //     ).load_module();
//   //     const math = load_math.PerpetualOptionsProtocol(n);
//   //     return math;
//   //   }

//   function simulate_mint() {
//     const math = PerpetualOptionsProtocol(1000);
//     const values = { r1: 50, r2: 100, s: 200, fee: 5 };
//     const [new_nft, collected_fee, transferred_fee] = math.mint(values);
//     return new_nft;
//   }

//   function mint_NFT(account) {
//     const decimals = 18;
//     const nft_values = simulate_mint();
//     const narray = nft_values.positions;
//     const array = [];
//     for (const i of narray) {
//       let num = parseInt(i * 10 ** decimals);
//       if (num === 0) {
//         num = Math.floor(Math.random() * (2 ** (256 - 1) - 1) + 1);
//       }
//       array.push(num);
//     }
//     const tx = settlement.write_NFT_to_chain(
//       account,
//       contract_objects["NFT"],
//       array,
//       array
//     );
//     latest_arrays["ETH"] = nft_values;
//     console.log(`NFT minted, array length: ${array.length}, tx: ${tx}`);
//   }

//   function simulate_burn(NFT) {
//     const math = PerpetualOptionsProtocol(1000);
//     const values = { nft_to_burn: NFT, fraction: 1, fee: 5 };
//     const [collected_fee, transferred_fee] = math.burn(values);
//     console.log(`NFT burned, fees: ${collected_fee}`);
//   }

//   return {
//     name,
//     deploy_contracts,
//     check_for_mints,
//     price_check,
//     mint_NFT,
//     simulate_burn,
//   };
// }

async function main() {
  //   const Web3 = require("web3");
  //   const web3 = new Web3(
  //     new Web3.providers.HttpProvider(ganache, { timeout: 100 })
  //   );
  //   const privateKey =
  //     "0xe0a8f44bae8acd33ed45cc686b25c32fd7b2df98546128aa31e35d57dcadea79";
  //   const account = web3.eth.accounts.privateKeyToAccount(privateKey);

  // simulating sequencer
  const trading_addr = "";
  const nft_addr = "";
  const executor = Sequencer(trading_addr, nft_addr);
  await executor.check_for_mints();
  await executor.price_check();
  executor.simulate_mint();
  executor.mint_NFT(account);
  executor.simulate_burn(executor.latest_arrays["ETH"]);
}

main();
