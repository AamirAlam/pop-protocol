function zeros(length) {
  return new Array(length).fill(0);
}

function linspace(start, stop, num) {
  const step = (stop - start) / (num - 1);
  const arr = [];
  for (let i = 0; i < num; i++) {
    arr.push(start + i * step);
  }
  return arr;
}

function sum(arr) {
  return arr.reduce((acc, val) => acc + val, 0);
}

function sqrt(val) {
  return Math.sqrt(val);
}

function OutOfBoundsError(message) {
  const error = {}; //new Error(message);
  error.name = "OutOfBoundsError";
  return error;
}

function NFT(positions, multiplicator) {
  return { positions, multiplicator };
}

function PerpetualOptionsProtocol(startPrice, endPrice, arrayLength) {
  const qWeightsArray = zeros(arrayLength);
  const multiplicatorArray = linspace(1, 1, arrayLength);

  const priceArray = linspace(startPrice, endPrice, arrayLength);
  const priceStepSize = (endPrice - startPrice) / (arrayLength - 1);

  function _multiplicator(weightsArray) {
    const sumOfWeightsSquared = sum(weightsArray.map((w) => w ** 2));
    const mValue = sqrt(sumOfWeightsSquared);
    return mValue;
  }

  function lambdaCalculation(r1, r2, s, fee) {
    const factor = r2 - r1 + 1;
    const mValue = _multiplicator(qWeightsArray);

    const sumQArray = sum(qWeightsArray.slice(r1, r2));
    const numerator =
      -sumQArray +
      sqrt(
        sumQArray ** 2 + factor * ((mValue + s * (1 - fee)) ** 2 - mValue ** 2)
      );
    const lambdaOutput = numerator / factor;
    return lambdaOutput;
  }

  function mint(r1, r2, s, fee) {
    const positions = zeros(qWeightsArray.length);
    const multiplicator = multiplicatorArray.slice();
    const newNFT = NFT(positions, multiplicator);

    for (let i = r1; i < r2; i++) {
      newNFT.positions[i] = lambdaCalculation(r1, r2, s, fee);
    }

    const collectedFee = s * fee;
    const transferredFee = s * (1 - fee);

    return [newNFT, collectedFee, transferredFee];
  }

  function burn(nftToBurn, fraction, fee) {
    const qDashedWeightsArray = nftToBurn.positions.map(
      (pos, i) =>
        (fraction * pos * multiplicatorArray[i]) / nftToBurn.multiplicator[i]
    );

    qWeightsArray.forEach((_, i) => {
      qWeightsArray[i] -= qDashedWeightsArray[i];
    });

    const multiplicatorSum = _multiplicator(
      qWeightsArray.map((w, i) => w + qDashedWeightsArray[i])
    );
    const multiplicatorQ = _multiplicator(qWeightsArray);
    const multiplicatorDiff = multiplicatorSum - multiplicatorQ;

    const collectedFee = multiplicatorDiff * fee;
    const transferredFee = multiplicatorDiff * (1 - fee);

    return [collectedFee, transferredFee];
  }

  function lambdaPriceFeedCalculation(currentTick, alpha) {
    const mValue = _multiplicator(qWeightsArray);
    const sumQSquared = sum(qWeightsArray.map((w) => w ** 2));
    const qCurrentTick = qWeightsArray[currentTick];

    if (qCurrentTick === 0.0) {
      //   throw new Error(
      //     "The weight of q at the current tick is zero, but we're trying to divide by it."
      //   );
    }

    const mValueSquared = mValue ** 2;
    const alphaSquared = alpha ** 2;
    const qCurrentTickSquared = qCurrentTick ** 2;
    const lambdaValue = sqrt(
      mValueSquared - alphaSquared * (sumQSquared - qCurrentTickSquared)
    );
    return lambdaValue / qCurrentTick;
  }

  function priceFeed(priceFeedValue, alpha) {
    if (priceFeedValue < startPrice || priceFeedValue > endPrice) {
      throw new OutOfBoundsError(
        `Current ${priceFeedValue} is out of bounds: ${startPrice} / ${endPrice}`
      );
    }

    const currentTick = Math.min(
      Math.floor((priceFeedValue - startPrice) / priceStepSize),
      arrayLength - 1
    );

    const lambdaValue = lambdaPriceFeedCalculation(currentTick, alpha);

    qWeightsArray.forEach((_, i) => {
      qWeightsArray[i] *= alpha;
    });

    qWeightsArray[currentTick] *= lambdaValue;

    multiplicatorArray.forEach((_, i) => {
      multiplicatorArray[i] *= alpha;
    });

    multiplicatorArray[currentTick] *= lambdaValue;
  }

  return {
    mint,
    burn,
    priceFeed,
    multiplicatorArray,
    lambdaCalculation,
    lambdaPriceFeedCalculation,
  };
}

// const testPerpetuals = PerpetualOptionsProtocol(0.0, 10.0, 11);
// const output = testPerpetuals.console.log("MINT OUTPUT");
// console.log(output);
// // // const burnOutput = testPerpetuals.burn(output[0], 1.0, 0.5);
// // // console.log("BURN OUTPUT");
// // // console.log(burnOutput);
// // testPerpetuals.priceFeed(1.2, 0.5);

module.exports = { PerpetualOptionsProtocol };
//a