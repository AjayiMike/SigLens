import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

import type { CommandEnvelope } from '@/infrastructure/messaging/commands';
import { handleCommand } from '@/infrastructure/messaging/handler';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: CommandEnvelope, _sender, sendResponse) => {
    void handleCommand(message)
      .then((response) => sendResponse(response))
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown background error.';
        sendResponse({
          ok: false,
          requestId: message.requestId ?? 'background-error',
          error: {
            code: 'INTERNAL_ERROR',
            message: errorMessage
          }
        });
      });
    return true;
  });
});
