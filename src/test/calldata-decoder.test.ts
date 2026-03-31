import { describe, expect, it } from 'vitest';

import { decodeCalldataWithSignature } from '@/features/calldata-decoder/decode-service';

describe('calldata decoder', () => {
  it('decodes transfer(address,uint256)', () => {
    const calldata =
      '0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111' +
      '0000000000000000000000000000000000000000000000000000000000000032';

    const result = decodeCalldataWithSignature(calldata, 'transfer(address,uint256)');

    expect(result.selector).toBe('0xa9059cbb');
    expect(result.values[0]?.value).toBe('0x1111111111111111111111111111111111111111');
    expect(result.values[1]?.value).toBe('50');
  });

  it('decodes string dynamic argument', () => {
    const calldata =
      '0x2f745c590000000000000000000000000000000000000000000000000000000000000020' +
      '0000000000000000000000000000000000000000000000000000000000000005' +
      '68656c6c6f000000000000000000000000000000000000000000000000000000';

    const result = decodeCalldataWithSignature(calldata, 'setMessage(string)');
    expect(result.values[0]?.value).toBe('hello');
  });
});
