import { registerAdapter } from '../lib/adapters/runner';
import { xAdapter } from '../lib/adapters/x';

export default defineContentScript({
  matches: ['https://x.com/*'],
  async main() {
    registerAdapter(xAdapter);
  },
});
