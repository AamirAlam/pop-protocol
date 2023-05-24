const { PerpetualOptionsProtocol } = require('../math/popMath');
const { web3Provider } = require('../providers/web3Provider');
const settlement = require('./settlement');
const tradingABI = ""//require('/abi_path')
const nftABI = ""//require('/nft_abi_path')
const chainLinkABI = ""//require('/_abi_path')

function Sequencer(trading_addr, nft_addr) {
    const name = 'Sequencer';
    const math = PerpetualOptionsProtocol(1000);
    const latest_arrays = {};
    let last_checked_block = null;
    let stop_sequencer = false;
    const chainId = 1;
    const web3 = web3Provider(chainId);

    const trading_contract = new web3.eth.Contract(tradingABI, trading_addr);

    const nft_contract = new web3.eth.Contract(nftABI, nft_addr);

    async function check_for_mints(timestamp) {
        try {
            // todo: fix fetch mint events for contract
            // const events = fetch_events(trading_contract.events.Mint, {
            //     from_block: web3.eth.blockNumber - 5
            // });

            const events = [];


            if (events.length) {
                for (const item of events) {
                    console.log(`${timestamp} MonitorService: MINT FOUND in block ${item.blockNumber}`);
                }
            } else {
                console.log(`${timestamp} MonitorService: no mints found in block ${web3.eth.blockNumber}`);
            }
        } catch (e) {
            console.log(`${timestamp} MonitorService: error retrieving events on chain: ${e}`);
        }
    }

    async function check_for_burns(timestamp) {
        try {
            // todo: fix fetch mint events for contract
            // const events = fetch_events(trading_contract.events.Burn, {
            //     from_block: web3.eth.blockNumber - 5
            // });
            const events = [];
            if (events.length) {
                for (const item of events) {
                    console.log(`${timestamp} MonitorService: BURN FOUND in block ${item.blockNumber}`);
                }
            } else {
                console.log(`${timestamp} MonitorService: no burns found in block ${web3.eth.blockNumber}`);
            }
        } catch (e) {
            console.log(`${timestamp} MonitorService: error retrieving events on chain: ${e}`);
        }
    }

    async function request_onchain_price() {
        const address = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
        const abi = chainLinkABI
        const chainlink_oracle_eth_to_usd = new web3.eth.Contract(abi, address)

        const price = await chainlink_oracle_eth_to_usd.methods.latestAnswer().call();
        return parseFloat(price) / 10 ** 8;
    }

    async function request_offchain_price() {
        const price = fetchPriceFromCoinGecko('ethereum')
        return parseFloat(price);
    }

    function validate_price(onchain, offchain) {
        const value = (Math.abs(onchain - offchain) / offchain) * 100.0;
        if (value < 25) {
            return true;
        } else {
            return false;
        }
    }

    async function price_check() {
        const onchain = await request_onchain_price();
        const offchain = await request_offchain_price();
        if (!validate_price(onchain, offchain)) {
            console.log(`onchain: ${onchain}, offchain: ${offchain}`);
            return false;
        }
        return offchain;
    }

    function simulate_mint() {
        const values = { r1: 50, r2: 100, s: 200, fee: 0.005 };
        const [new_nft, collected_fee, transferred_fee] = math.mint(values);
        return new_nft;
    }

    function mint_NFT(account) {
        const decimals = 18;
        const nft_values = simulate_mint();
        const narray = nft_values.positions;
        const array = [];
        for (const i of narray) {
            let num = parseInt(i * 10 ** decimals);
            if (num === 0) {
                num = Math.floor(Math.random() * (2 ** (256 - 1) - 1) + 1);
            }
            array.push(num);
        }
        const tx = settlement.write_NFT_to_chain(account, nft_contract, array, array);
        latest_arrays['ETH'] = nft_values;
        console.log(`NFT minted, array length: ${array.length}, tx: ${tx}`);
    }

    function simulate_burn(NFT) {
        const values = { nft_to_burn: NFT, fraction: 1, fee: 0.005 };
        const [collected_fee, transferred_fee] = math.burn(values);
        console.log(`NFT burned, fees: ${collected_fee}`);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function sequencer_loop() {
        while (true) {
            if (stop_sequencer) {
                console.log(`${name} received a stop, quitting.....`);
                // quit();
                break;
            }
            console.log(`${name} checking for events from ${trading_contract.address}.....`);
            const timestamp = new Date().toLocaleTimeString();
            await check_for_burns(timestamp);
            await check_for_mints(timestamp);
            last_checked_block = await web3.eth.blockNumber;
            console.log("");
            sleep(10000);//10 sec
        }
    }

    return {
        check_for_mints,
        check_for_burns,
        request_onchain_price,
        request_offchain_price,
        validate_price,
        price_check,
        simulate_mint,
        mint_NFT,
        simulate_burn,
        sequencer_loop,
    };
}

async function test() {
    //     const node = process.env.ganache;
    // const web3 = new Web3(new HTTPProvider(endpoint_uri = node, request_kwargs: { timeout: 100 }));
    // const account = web3.eth.account.from_key("0xe0a8f44bae8acd33ed45cc686b25c32fd7b2df98546128aa31e35d57dcadea79");
    // const executor = Sequencer(
    //     web3,
    //     "0x5f9e3035596f0d321bc8548b8b1f7906229f43aa",
    //     "0x63345b69faaa6256fa717cf316888997df3e8141"
    // );

}


module.exports = { Sequencer }