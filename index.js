/**
 * 把操作者自己的《Assistant Operating Specification》作为一条系统提示词段落注入。
 *
 * 机制：`ctx.systemPrompt.section()` 注册一条全局段落，每个模型请求装配系统提示词时都会带上它。
 * 插件行启用 → 段落存在；插件行禁用 → 段落随 fiber 卸载一起消失，行为立刻回到默认。
 * 段落文本默认读同目录的 spec.md，也可以由行 config 的 text 覆盖。
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const name = 'operator-spec'

/** 没有 systemPrompt 服务的 profile 里本行保持不激活，而不是激活后抛错。 */
export const inject = ['systemPrompt']

/** 系统提示词里这条段落的唯一名字。 */
const SECTION_NAME = 'external:operator-spec'

/**
 * 默认排序位。system-prompt 自带段落的分布是：harness 身份 -1000、部署 persona 前缀 0、
 * 第一方工具/格式指导居中、环境事实 10000/10100、persona 后缀 10200。
 * 9000 落在“第一方指导之后、环境事实之前”，既压过默认语气，又让运行环境信息留在最后。
 */
const DEFAULT_ORDER = 9000

function readBundledSpec() {
  const path = fileURLToPath(new URL('./spec.md', import.meta.url))
  const text = readFileSync(path, 'utf8').trim()
  if (text === '') throw new Error(`[operator-spec] ${path} 内容为空`)
  return text
}

function resolveText(config) {
  const override = config.text
  if (typeof override === 'string' && override.trim() !== '') return override.trim()
  return readBundledSpec()
}

function resolveOrder(config) {
  const order = config.order
  if (order === undefined || order === null) return DEFAULT_ORDER
  if (typeof order !== 'number' || !Number.isFinite(order)) {
    throw new TypeError(`[operator-spec] config.order 必须是有限数字，收到 ${JSON.stringify(order)}`)
  }
  return order
}

export function apply(ctx, config = {}) {
  const text = resolveText(config)
  const order = resolveOrder(config)
  // complete: true 会用这一条段落顶替整个系统提示词；默认 false，即“追加一段”。
  const complete = config.complete === true

  ctx.effect(() => ctx.systemPrompt.section({
    name: SECTION_NAME,
    order,
    text,
    // 准则正文里的花括号一律按字面量保留，不参与 {{变量}} 插值。
    interpolate: false,
    ...(complete ? { complete: true } : {}),
  }), 'operator-spec: section')
}
