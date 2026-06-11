import { runAdapter } from '../lib/adapters/runner';
import { xAdapter } from '../lib/adapters/x';

export default defineContentScript({
  matches: ['https://x.com/*'],
  async main() {
    await runAdapter(xAdapter);
  },
});
