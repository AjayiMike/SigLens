import { describe, expect, it } from 'vitest';

import { parseInterfaceToSelectors } from '@/features/interface-parser/parser';

const ERC20_SOURCE = `
interface IERC20 {
  function transfer(address to, uint256 amount) external returns (bool);
  function approve(address spender, uint256 amount) external returns (bool);
  function balanceOf(address owner) external view returns (uint256);
}
`;

describe('interface parser', () => {
  it('parses ERC20-style declarations', () => {
    const result = parseInterfaceToSelectors(ERC20_SOURCE);

    expect(result.errors).toEqual([]);
    expect(result.functions).toHaveLength(3);

    const bySignature = new Map(result.functions.map((entry) => [entry.signature, entry.selector]));
    expect(bySignature.get('transfer(address,uint256)')).toBe('0xa9059cbb');
    expect(bySignature.get('approve(address,uint256)')).toBe('0x095ea7b3');
    expect(bySignature.get('balanceOf(address)')).toBe('0x70a08231');
  });

  it('ignores duplicate declarations and comments', () => {
    const source = `
      // comment
      function foo(uint256 value) external;
      function foo(uint256 value) external;
    `;

    const result = parseInterfaceToSelectors(source);
    expect(result.functions).toHaveLength(1);
    expect(result.warnings.some((entry) => entry.includes('Duplicate function'))).toBe(true);
  });

  it('returns parse guidance when no functions are present', () => {
    const result = parseInterfaceToSelectors('contract A { event E(); }');
    expect(result.functions).toHaveLength(0);
    expect(result.errors[0]).toContain('No function declarations found');
  });
});
