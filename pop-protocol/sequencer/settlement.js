/* eslint-disable camelcase */
const { web3Provider } = require("../providers/web3Provider");

async function write_NFT_to_chain(
  account,
  nft_contract_obj,
  nft_position,
  nft_multiplicator
) {
  // const func = nft_contract_obj.functions.write(nft_position, nft_multiplicator);
  // const tx_params = get_tx_params(web3, account, 0, 25000000, true);
  // const tx = build_and_send_and_wait(web3, account, func, tx_params);
  // return tx;
  const chainId = 1;

  try {
    // start
    const privateKey = process.env.PRIVATE_KEY;

    // console.log("private key ", privateKey);
    // console.log("chain ", chainId);

    const web3Connection = web3Provider(chainId);

    const ownerAccount =
      web3Connection.eth.accounts.privateKeyToAccount(privateKey);

    const privateKeyOwner = ownerAccount.address;

    // 3. Adding Keys to Wallet
    web3Connection.eth.accounts.wallet.add(privateKey);

    // 3. Creating a trasaction
    const tx = nft_contract_obj.methods.write(nft_position, nft_multiplicator);
    const gas = await tx.estimateGas({ from: privateKeyOwner });
    const gasPriceData = await web3Connection.eth.getGasPrice();
    const gasPrice = gasPriceData?.toString();
    const data = tx.encodeABI();
    const nonce = await web3Connection.eth.getTransactionCount(privateKeyOwner);

    // 4. Creating a trasaction Data
    const txData = {
      from: privateKeyOwner,
      to: nft_contract_obj.options.address,
      data: data,
      gas,
      gasPrice,
      nonce,
    };

    // 5. Executing transaction
    console.log("starting trx");
    const receipt = await web3Connection.eth.sendTransaction(txData);

    console.log("trx receipt ", receipt);
    const result = {
      success: receipt?.status,
      hash: receipt?.blockHash,
      message: "success",
    };

    return result;
  } catch (error) {
    console.log("write_NFT_to_chain trx error ", error);
    return {
      success: false,
      hash: null,
      message: "failed",
    };
  }
}

module.exports = { write_NFT_to_chain };
