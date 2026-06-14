import { registerAdapter } from '../lib/adapters/runner';
import { redditAdapter } from '../lib/adapters/reddit';

export default defineContentScript({
  matches: ['https://old.reddit.com/*', 'https://www.reddit.com/*'],
  async main() {
    registerAdapter(redditAdapter);
  },
});
