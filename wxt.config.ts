import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: '.output',
  manifest: {
    name: 'SigLens',
    short_name: 'SigLens',
    description:
      'EVM selector lookup, signature hashing, and interface parser for smart contract developers.',
    version: '0.1.0',
    permissions: ['storage'],
    host_permissions: ['https://api.4byte.sourcify.dev/*', 'https://www.4byte.directory/*'],
    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png'
    }
  }
});
