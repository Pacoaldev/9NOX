import { CodeBuddyExecutor } from "./codebuddy-cn.js";

/**
 * CodeBuddy International (www.codebuddy.ai).
 * Shares channel verification headers, system prompt normalization, error parsing,
 * and OAuth token refresh with CodeBuddyExecutor (decolua/9router#5032).
 */
export class CodeBuddyIntlExecutor extends CodeBuddyExecutor {
  constructor() {
    super("codebuddy-intl");
  }
}

export default CodeBuddyIntlExecutor;
