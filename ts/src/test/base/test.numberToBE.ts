
import assert from 'assert';
import ccxt from '../../../ccxt.js';

function testNumberToBE () {

    const exchange = new ccxt.Exchange ({
        'id': 'sampleexchange',
    });

    assert ('GO_SKIP_START');

    // 1234567890 (decimal) = 0x499602D2 (hex)
    // BE: 00 00 00 00 49 96 02 D2
    const num1 = 1234567890;
    const padding1 = 8;
    const result1 = exchange.numberToBE (num1, padding1);

    // Check if result is Uint8Array
    assert (exchange.isBinaryMessage (result1));
    assert (exchange.binaryLength (result1) === padding1);
    const expectedBinary1 = exchange.base16ToBinary ('00000000499602d2');
    assert.deepStrictEqual (result1, expectedBinary1);


    // Test 2: Small number, small padding
    // 255 = 0xFF
    const num2 = 255;
    const padding2 = 1;
    const expectedBinary2 = exchange.base16ToBinary('ff');
    const result2 = exchange.numberToBE (num2, padding2);
    assert.deepStrictEqual (result2, expectedBinary2);

    // Test 3: Zero
    const num3 = 0;
    const padding3 = 4;
    const expectedBinary3 = exchange.base16ToBinary('00000000');
    const result3 = exchange.numberToBE (num3, padding3);
    assert.deepStrictEqual (result3, expectedBinary3);

    // 1 in 8 bytes
    const num4 = 1;
    const padding4 = 8;
    const expectedBinary4 = exchange.base16ToBinary('0000000000000001');
    const result4 = exchange.numberToBE (num4, padding4);
    assert.deepStrictEqual (result4, expectedBinary4);

    assert ('GO_SKIP_END');
}

export default testNumberToBE;
