/**
 * 「思考中文」World：往系统前缀里加一段「用简体中文思考」的规则。
 *
 * 思路照 DSH 的 dsh-think-chinese：提示词层面把推理语言钉住。它不翻译、不改界面，
 * 只改模型怎么想。没有工具、不推事件；挂上后每一次前缀重建（每轮请求）都会带上这段规则。
 *
 * 规则正文放在包里的 `ENV_PROMPT.md`，框架按部署覆盖 → 代码包 → 模块的顺序读取；
 * WebUI 的提示词页可以直接编辑它，下一轮生效。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ToolDef, World, WorldDefinition, WorldHost, WorldWebUiDecl } from 'cortico/core/types.ts';
import type { Language } from 'cortico/core/language.ts';

export const THINK_CHINESE_ID = 'think-chinese';

/**
 * 插件包自己的目录。
 *
 * 不能用 `WorldContext.packageDir`：那个字段是 **bot 的**代码包目录（cormini），
 * 拿它拼 ENV_PROMPT.md 会读到 `bots/cormini/ENV_PROMPT.md`，ENOENT 会让前缀装配整条失败。
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const ENV_PROMPT_FILE = join(HERE, '..', 'ENV_PROMPT.md');

/** 配置段：只认 enabled，没有别的旋钮。 */
interface ThinkChineseSection {
  enabled: boolean;
}

class ThinkChineseWorld implements World {
  readonly id = THINK_CHINESE_ID;
  private host: WorldHost | null = null;

  /** 模板没有变量：返回空对象，保留整份 ENV_PROMPT.md 的正文。 */
  envPromptVars(): Record<string, string> {
    return {};
  }

  /** 不给她工具：这个 World 只改提示词。 */
  tools(): ToolDef[] {
    return [];
  }

  async start(host: WorldHost): Promise<void> {
    this.host = host;
    try {
      host.log.info('思考中文：规则已进入系统前缀（每轮重建时生效）');
    } catch {
      /* 日志失败不影响启动 */
    }
  }

  async stop(): Promise<void> {
    try {
      this.host?.log.info('思考中文：已停止');
    } catch {
      /* ignore */
    }
    this.host = null;
  }

  webUi(language: Language = 'zh'): WorldWebUiDecl {
    const zh = language === 'zh' || language === 'zh-Hant';
    return {
      label: zh ? '思考中文' : 'Think in Chinese',
      lamps: [{
        label: zh ? '思考中文' : 'Think in Chinese',
        state: 'online',
        hint: zh
          ? '每一轮都把「用简体中文思考」写进系统前缀。'
          : 'Adds “think in Simplified Chinese” to the system prefix every round.',
      }],
      panels: [{
        id: 'live',
        title: zh ? '思考中文 · 规则' : 'Think in Chinese · rule',
        description: zh
          ? '下面这段规则会随每一轮请求进入系统前缀。想改措辞就编辑 ENV_PROMPT.md，下一轮生效；清空它等于关掉规则。'
          : 'This rule enters the system prefix every round. Edit ENV_PROMPT.md to change the wording; the next round picks it up. Clearing it disables the rule.',
        getMethods: ['rule'],
      }],
      invoke: async (panel, method) => {
        if (panel !== 'live') throw new Error(zh ? `未知面板：${panel}` : `Unknown panel: ${panel}`);
        if (method !== 'rule') throw new Error(zh ? `未知方法：${method}` : `Unknown method: ${method}`);
        const text = readFileSync(ENV_PROMPT_FILE, 'utf8').trim();
        return { text };
      },
      promptDocs: [{
        key: 'worlds.think-chinese.envPrompt',
        title: zh ? '思考中文 · 环境提示词' : 'Think in Chinese · environment prompt',
        description: zh
          ? '写进系统前缀的思考语言规则。改完下一轮生效；清空它会关掉规则。'
          : 'The reasoning-language rule added to the system prefix. Applies next round; clearing it disables the rule.',
        path: ENV_PROMPT_FILE,
        role: 'envPrompt',
      }],
    };
  }
}

export default {
  id: THINK_CHINESE_ID,
  label: '思考中文',
  /** 默认关闭：由部署配置 worlds.think-chinese.enabled 打开。 */
  defaults: () => ({ enabled: false }),
  create: () => new ThinkChineseWorld(),
} satisfies WorldDefinition<ThinkChineseSection>;
