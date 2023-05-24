/* eslint-disable camelcase */
function NFT(positions, multiplicator) {
  return {
    positions: positions,
    multiplicator: multiplicator,
  };
}

function PerpetualOptionsProtocol(n) {
  const protocol = {
    name: "PerpetualOptionsProtocol",
    n: n,
    q_weights_array: Array(n).fill(0),
    multiplicator_array: Array(n).fill(1),
  };

  protocol._multiplicator = function (weights_array) {
    return Math.sqrt(
      weights_array.reduce(function (sum, weight) {
        return sum + Math.pow(weight, 2);
      }, 0)
    );
  };

  protocol.lambda_calculation = function (r1, r2, s, fee) {
    const factor = r2 - r1 + 1;
    const M = protocol._multiplicator(protocol.q_weights_array);

    const numerator =
      -protocol.q_weights_array
        .slice(r1, r2 + 1)
        .reduce(function (sum, weight) {
          return sum + weight;
        }, 0) +
      Math.sqrt(
        Math.pow(
          protocol.q_weights_array
            .slice(r1, r2 + 1)
            .reduce(function (sum, weight) {
              return sum + weight;
            }, 0),
          2
        ) +
          factor * (Math.pow(M + s * (1 - fee), 2) - Math.pow(M, 2))
      );

    const lambda_output = numerator / factor;
    return lambda_output;
  };

  protocol.mint = function (r1, r2, s, fee) {
    const new_nft = NFT(
      Array(protocol.q_weights_array.length).fill(0),
      protocol.multiplicator_array.slice()
    );

    for (let i = r1; i < r2; i++) {
      new_nft.positions[i] = protocol.lambda_calculation(r1, r2, s, fee);
    }

    const collected_fee = s * fee;
    const transferred_fee = s * (1 - fee);

    return [new_nft, collected_fee, transferred_fee];
  };

  protocol.burn = function (nft_to_burn, fraction, fee) {
    const q_dashed_weights_array = nft_to_burn.positions.map(function (
      position,
      i
    ) {
      return (
        (fraction * position * protocol.multiplicator_array[i]) /
        nft_to_burn.multiplicator[i]
      );
    });

    protocol.q_weights_array = protocol.q_weights_array.map(function (
      weight,
      i
    ) {
      return weight - q_dashed_weights_array[i];
    });

    const multiplicator_sum = protocol._multiplicator(
      protocol.q_weights_array.map(function (weight, i) {
        return weight + q_dashed_weights_array[i];
      })
    );

    const multiplicator_q = protocol._multiplicator(protocol.q_weights_array);
    const multiplicator_diff = multiplicator_sum - multiplicator_q;

    const collected_fee = multiplicator_diff * fee;
    const transferred_fee = multiplicator_diff * (1 - fee);

    return [collected_fee, transferred_fee];
  };

  protocol.price_feed = function () {
    throw new Error("NotImplementedError");
  };

  return protocol;
}

// test scripts
var test_perps = new PerpetualOptionsProtocol(100);
var output = test_perps.mint(5, 10, 20, 0.5);
console.log("OUTPUT");
console.log(output);
var burn_output = test_perps.burn(output[0], 1.0, 0.5);
console.log("BURNING OUTPUT");
console.log(burn_output);

module.exports = { PerpetualOptionsProtocol, NFT };
