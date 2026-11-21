# DSH OperatorSpec

把一份「操作者行为准则」变成 DeepSeek Harness 的系统提示词段落。插件启用期间，本 profile 里每个会话、每次模型请求都会带上这段准则；停用后段落随插件卸载消失，行为回到 DSH 默认。

这是给 [DeepSeek Harness](https://github.com/deepseek-ai) 用的 Host 侧插件（bundle），没有前端代码。---也就是说，这是个可以解除某周限制的插件。

## 效果

DSH 的 `@deepseek-ai/dsh-system-prompt` 把系统提示词拆成按 `order` 排序的若干段落：harness 身份 `-1000`、部署 persona 前缀 `0`、第一方工具/格式指导居中、环境事实 `10000/10100`、persona 后缀 `10200`。

本插件注册一条 `external:operator-spec` 段落，默认 `order: 9000`——压过默认语气，但把运行环境信息留在最后。正文默认读包内 `spec.md`，逐字注入，不做变量插值。

## 安装

1. 把仓库放到 DSH 的插件目录，例如 `~/dsh-plugins/OperatorSpec`。
2. 打开 Web GUI 的 **插件** 面板 → **添加插件** → 选择该目录。
3. 装好后在插件列表里启用「操作者行为准则」。

插件行是 profile 级开关，对所有会话生效，包括已经开着的会话（下一条消息就带上新提示词）。

## 配置

改行 config 即可，不必改代码：

```yaml
- insert:
    - id: operator-spec
      name: '@local/operator-spec'
      config:
        text: '用这段正文替代 spec.md'
        order: 9000
        complete: false
```

| 字段 | 默认 | 说明 |
|---|---|---|
| `text` | 空 | 非空时覆盖 `spec.md` 的正文 |
| `order` | `9000` | 段落在系统提示词里的排序位，任意有限数字 |
| `complete` | `false` | `true` 时这条段落顶替**整个**系统提示词；已有其它 `complete` 段落会导致装配报错 |

改 `spec.md` 后需要在插件面板里停用再启用（或重启 DSH），段落才会重新读取。

## 边界与代价

- 它改变的是**模型收到的指令**（行为准则、语气、拒绝策略这一层）。
- 它**不**绕过服务商侧的内容审核，也不改变模型本身的训练行为。被上游拦掉的输出，插件无从干预。
- 正文每次都随请求重复发送：`spec.md` 约 20 KB，量级是每请求数 k token 的固定开销。
- 修改 `order` 或正文会让提示词前缀缓存失效一次。

## 目录结构

| 文件 | 作用 |
|---|---|
| `index.js` | 插件入口，注册 `external:operator-spec` 段落 |
| `spec.md` | 默认准则正文，启用时逐字注入 |
| `cordis.patch.yml` | 插入 `operator-spec` 行 |
| `locale/en.json`、`locale/zh.json` | 插件面板里的标题与描述 |
| `icon.svg` | 插件图标 |

## 换成你自己的准则

仓库里的 `spec.md` 是作者自己的准则，只作默认值用。直接替换成你自己的文档即可——它只是一段静态提示词，段落名、排序、注入方式都不用改。

## English

A DeepSeek Harness host-side bundle that injects an operator-authored operating specification as one ordered system-prompt section, applied to every session while the plugin is enabled.

Install: clone the repo, then in the Web GUI open **Plugins** → **Add plugin** and pick the directory. Enable the row to apply the section, disable it to remove it immediately.

Config: `text` (override the bundled `spec.md`), `order` (section sort position, default `9000`), `complete` (`true` replaces the whole system prompt; a second effective complete section fails assembly).

It changes the instructions the model receives only. It does not bypass provider-side moderation or a model's own behavior, and the section is re-sent on every request.

## License

MIT
