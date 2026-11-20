// Browser half of dsh-prompt-book: a "quick prompt" picker that sits in the
// composer tool row (after the permission picker, before the submit button).
//
// Hand-written in the lazy-CJS bundle protocol (window.__ModuleLoader__.load):
// it requires only the seeded 'react', so there is no build step and no import
// from DSH client packages. The slot + insertion mechanics follow the
// dsh-prompt-chips plugin (MIT): captureInsertion() then insertText(text, span).
//
// Fourteen presets ship by default. Each row carries a pencil on hover that turns
// that single row into an editor in place; the header's plus adds a row the same
// way. There is no separate editor page and no footer of text actions. Everything
// is stored in this browser's localStorage only.
window.__ModuleLoader__.load({
  id: 'dsh-prompt-book',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    var react = null
    try {
      react = require('react')
    } catch {
      react = null
    }

    var STORAGE_KEY = 'dsh-quick-prompts.presets.v2'
    var LEGACY_KEY = 'dsh-quick-prompts.presets.v1'
    var STYLE_ID = 'dsh-prompt-book-style'
    var MENU_WIDTH = 520
    var MENU_GAP = 8

    var PRESETS = [
      {
        id: 'first-principles',
        label: '第一性原理',
        content: '从第一性原理出发，找到最本质原因，修复一下。',
      },
      {
        id: 'align-then-options',
        label: '对齐偏好再出三版',
        content: '先问一些不清晰的问题，对齐我的喜好，然后再出3版方案。',
      },
      {
        id: 'real-need',
        label: '底层需求审视',
        content:
          '不要默认我提出的问题定义就是正确的。你先分析我真正想解决的底层需求，判断我有没有把症状误认为原因、把手段误认为目标。如果存在更值得解决的问题，直接指出来。',
      },
      {
        id: 'second-order',
        label: '二阶三阶影响',
        content:
          '不要只考虑这个改动产生的直接效果。继续推演它的二阶、三阶影响，尤其关注对其他模块、用户行为、系统复杂度和长期维护成本的潜在影响。',
      },
      {
        id: 'cross-domain',
        label: '跨领域解法',
        content: '其他领域里有没有类似的方案，用跨领域的方式全面思考，找到最优解。',
      },
      {
        id: 'steelman-rebuttal',
        label: '反证与推翻',
        content:
          '先假设你当前认为最合理的方案是错误的。站在最强反对者的角度，寻找能够推翻它的证据、反例和边界情况。然后重新评估方案，看看有没有更好的解法。',
      },
      {
        id: 'git-archaeology',
        label: '历史包袱考古',
        content:
          '深入分析整个代码库的Git历史、关键PR和架构演变过程。找出哪些设计是有意为之，哪些是历史遗留，哪些是为了解决已经不存在的问题而引入的。识别可以安全移除的历史包袱。',
      },
      {
        id: 'newcomer-cost',
        label: '新人接手成本',
        content:
          '假设明天有一个完全不了解项目、但是能力很强的工程师来接手。请评估他理解整个项目需要付出的认知成本，找出那些命名混乱、抽象过度、职责不清晰、需要大量上下文才能理解的代码，并提出简化方案。',
      },
      {
        id: 'slow-prs',
        label: '慢 PR 排查',
        content:
          '全面分析最近XX天里的所有的PR，找出最慢的那几个，看看有没有导致卡顿、可以优化的地方。',
      },
      {
        id: 'postmortem',
        label: '返工根因复盘',
        content:
          '全面复盘最近XX时间的 Bug、返工、回滚和重复修改。不要只统计发生了什么，要分析这些问题背后有没有共同的根因。把能够预防的共性问题沉淀成项目规则、自动化或者Skill，避免我们反复支付同样的成本。',
      },
      {
        id: 'low-entropy',
        label: '低熵运行',
        content:
          '尽量保证低熵运行，确保任务中不留存非必要的上下文噪声、历史返工噪声，仅保留正向流程。',
      },
      {
        id: 'ux-shippable',
        label: 'UX 打磨到可交付',
        content:
          '从用户体验的视角，去对整体产品UI、UX设计做优化，去掉无用说明、改掉用户不懂的晦涩文字、最大程度简化用户操作，优化后使产品达到可交付的标准状态。',
      },
      {
        id: 'classic-variant',
        label: '跨领域经典变体',
        content:
          '目前存在的问题是否是其他领域经典问题的变体，有无成熟的解决方案，请进行跨领域的广度搜索核实这一点。',
      },
      {
        id: 'pm-language',
        label: '用产品语言解释',
        content:
          '用产品经理能听懂的话解释。先说这件事对产品、用户和边界的影响与取舍，再讲技术实现；不要堆纯技术术语，也不要把实现细节当成结论。如果一句话说不清，先给结论再展开。',
      },
    ]

    var CSS = [
      '.dsh-qp__trigger{',
      '  appearance:none;display:inline-flex;align-items:center;justify-content:center;',
      '  width:26px;height:26px;padding:0;margin:0 2px;border:0;',
      '  border-radius:var(--dsw-radius-sm);background:transparent;',
      '  color:var(--dsw-alias-label-secondary);cursor:pointer;',
      '  transition:background-color .12s ease,color .12s ease;',
      '}',
      '.dsh-qp__trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dsh-qp__trigger[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dsh-qp__trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}',
      '.dsh-qp__menu{',
      '  position:fixed;box-sizing:border-box;width:min(' + MENU_WIDTH + 'px,calc(100vw - 16px));',
      '  max-height:min(60vh,560px);display:flex;flex-direction:column;overflow:hidden;',
      '  padding:4px;z-index:200;',
      '  border-radius:var(--dsw-radius-lg);border:.5px solid var(--dsw-alias-border-l1);',
      '  background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-3));',
      '  box-shadow:var(--dsw-elevation-prominent);',
      '  -webkit-backdrop-filter:var(--dsw-menu-backdrop-filter);backdrop-filter:var(--dsw-menu-backdrop-filter);',
      '}',
      '.dsh-qp__head{display:flex;align-items:center;justify-content:space-between;gap:8px;',
      '  padding:2px 4px 4px 10px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);}',
      '.dsh-qp__head b{font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);}',
      '.dsh-qp__add{appearance:none;display:inline-flex;align-items:center;justify-content:center;',
      '  width:22px;height:22px;padding:0;border:0;border-radius:5px;background:transparent;',
      '  color:var(--dsw-alias-label-tertiary);cursor:pointer;',
      '  transition:background-color .12s ease,color .12s ease;}',
      '.dsh-qp__add:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dsh-qp__add:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}',
      '.dsh-qp__head-tools{display:flex;align-items:center;gap:2px;}',
      '.dsh-qp__add--on{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-danger,var(--dsw-alias-label-primary));}',
      '.dsh-qp__remove{appearance:none;flex:none;display:inline-flex;align-items:center;justify-content:center;',
      '  width:22px;height:22px;margin:6px 4px 0 0;padding:0;border:0;border-radius:5px;background:transparent;',
      '  color:var(--dsw-alias-label-tertiary);cursor:pointer;opacity:0;',
      '  transition:opacity .1s ease,background-color .12s ease,color .12s ease;}',
      '.dsh-qp__row:hover .dsh-qp__remove{opacity:1;}',
      // In delete mode every trash button is visible and red: the mode has to read
      // as a mode, otherwise the rows look unchanged and the minus does nothing.
      '.dsh-qp--remove .dsh-qp__remove{opacity:1;color:var(--dsw-alias-state-error-secondary,#ef4444);}',
      '.dsh-qp--remove .dsh-qp__remove:hover{color:var(--dsw-alias-state-error-primary,#ec1313);',
      '  background:var(--dsw-alias-interactive-bg-hover-danger,rgba(236,19,19,.05));}',
      '.dsh-qp__toast{display:flex;align-items:center;justify-content:center;gap:10px;margin:6px 0 2px;padding:6px 10px;',
      '  font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);}',
      '.dsh-qp__toast-text{min-width:0;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dsh-qp__toast-btn{appearance:none;flex:none;padding:3px 12px;border:0;border-radius:999px;',
      '  background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);',
      '  font:inherit;font-size:11px;line-height:16px;font-weight:500;cursor:pointer;',
      '  transition:opacity .12s ease;}',
      '.dsh-qp__toast-btn:hover{opacity:.86;}',
      '.dsh-qp__scroll{display:flex;flex-direction:column;gap:1px;overflow-y:auto;overscroll-behavior:contain;}',
      '.dsh-qp__row{display:flex;align-items:flex-start;gap:2px;border-radius:var(--dsw-radius-sm);}',
      '.dsh-qp__row:hover,.dsh-qp__row:focus-within{background:var(--dsw-alias-interactive-bg-hover);}',
      '.dsh-qp__item{',
      '  appearance:none;display:flex;align-items:flex-start;gap:8px;flex:1;min-width:0;box-sizing:border-box;',
      '  padding:6px 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;',
      '  color:inherit;font:inherit;text-align:left;cursor:pointer;',
      '}',
      '.dsh-qp__item:focus-visible{outline:none;}',
      '.dsh-qp__idx{flex:none;display:inline-flex;align-items:center;justify-content:center;',
      '  min-width:18px;height:18px;padding:0 3px;box-sizing:border-box;margin-top:1px;border-radius:5px;',
      '  background:var(--dsw-alias-interactive-bg-hover);',
      '  color:var(--dsw-alias-label-tertiary);font-size:10px;font-weight:600;line-height:1;',
      '  font-variant-numeric:tabular-nums;}',
      '.dsh-qp__body{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;}',
      '.dsh-qp__label{font-size:12px;font-weight:600;line-height:16px;color:var(--dsw-alias-label-primary);',
      '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.dsh-qp__text{font-size:11px;line-height:15px;color:var(--dsw-alias-label-tertiary);',
      '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.dsh-qp__grip{flex:none;display:inline-flex;align-items:center;justify-content:center;',
      '  width:14px;height:22px;margin:6px 0 0 3px;padding:0;color:var(--dsw-alias-label-tertiary);',
      '  opacity:0;cursor:grab;touch-action:none;border-radius:4px;',
      '  transition:opacity .1s ease,color .12s ease;}',
      '.dsh-qp__row:hover .dsh-qp__grip,.dsh-qp__row:focus-within .dsh-qp__grip{opacity:1;}',
      '.dsh-qp__grip:hover{color:var(--dsw-alias-label-secondary);}',
      '.dsh-qp__row{transition:background-color .12s ease,box-shadow .12s ease;}',
      '.dsh-qp__row--drag{background:var(--dsw-alias-interactive-bg-hover);',
      '  box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2),0 2px 6px rgba(0,0,0,.06);}',
      '.dsh-qp__row--drop{box-shadow:inset 0 2px 0 var(--dsw-alias-brand-primary);}',
      '.dsh-qp--drag{user-select:none;-webkit-user-select:none;cursor:grabbing;}',
      '.dsh-qp--drag .dsh-qp__grip{cursor:grabbing;}',
      '.dsh-qp--drag .dsh-qp__row:hover .dsh-qp__label,.dsh-qp--drag .dsh-qp__row:focus-within .dsh-qp__label,',
      '.dsh-qp--drag .dsh-qp__row:hover .dsh-qp__text,.dsh-qp--drag .dsh-qp__row:focus-within .dsh-qp__text{',
      '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.dsh-qp__row:hover .dsh-qp__label,.dsh-qp__row:focus-within .dsh-qp__label{white-space:normal;overflow:visible;}',
      '.dsh-qp__row:hover .dsh-qp__text,.dsh-qp__row:focus-within .dsh-qp__text{',
      '  white-space:normal;overflow:visible;text-overflow:clip;',
      '  -webkit-mask-image:none;mask-image:none;}',
      '.dsh-qp__edit{appearance:none;flex:none;display:inline-flex;align-items:center;justify-content:center;',
      '  width:22px;height:22px;margin:6px 4px 0 0;padding:0;border:0;border-radius:5px;background:transparent;',
      '  color:var(--dsw-alias-label-tertiary);cursor:pointer;opacity:0;',
      '  transition:opacity .1s ease,background-color .12s ease,color .12s ease;}',
      '.dsh-qp__row:hover .dsh-qp__edit,.dsh-qp__edit:focus-visible{opacity:1;}',
      '.dsh-qp__edit:hover{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);}',
      '.dsh-qp__editor{display:flex;flex-direction:column;gap:6px;margin:2px 0;padding:6px;',
      '  border-radius:var(--dsw-radius-sm);border:.5px solid var(--dsw-alias-border-l1);',
      '  background:var(--dsw-alias-bg-base);}',
      '.dsh-qp__input,.dsh-qp__area{',
      '  box-sizing:border-box;width:100%;font:inherit;font-size:12px;line-height:16px;padding:4px 7px;',
      '  border-radius:var(--dsw-radius-sm);border:.5px solid var(--dsw-alias-border-l2);',
      '  background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);outline:none;',
      '}',
      '.dsh-qp__input:focus,.dsh-qp__area:focus{border-color:var(--dsw-alias-brand-primary);}',
      '.dsh-qp__area{resize:none;min-height:44px;max-height:200px;overflow:hidden;}',
      '.dsh-qp__row-actions{display:flex;align-items:center;gap:6px;}',
      '.dsh-qp__row-actions-spacer{flex:1;}',
      '.dsh-qp__row-btn{appearance:none;font:inherit;font-size:11px;line-height:18px;padding:2px 9px;',
      '  border-radius:5px;border:.5px solid var(--dsw-alias-border-l1);background:transparent;',
      '  color:var(--dsw-alias-label-secondary);cursor:pointer;}',
      '.dsh-qp__row-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dsh-qp__row-btn--danger{border-color:transparent;color:var(--dsw-alias-label-tertiary);}',
      '.dsh-qp__row-btn--save{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff;}',
      '.dsh-qp__row-btn--save:hover{background:var(--dsw-alias-brand-primary);color:#fff;opacity:.9;}',
      '.dsh-qp__empty{padding:10px 8px 12px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);}',
    ].join('')

    function installStyles() {
      var el = document.getElementById(STYLE_ID)
      if (el === null) {
        el = document.createElement('style')
        el.id = STYLE_ID
        document.head.appendChild(el)
      }
      el.textContent = CSS
    }

    function removeStyles() {
      var el = document.getElementById(STYLE_ID)
      if (el !== null) el.remove()
    }

    // Grow a textarea to fit its content (capped), so long presets are never
    // visually clipped inside the row editor.
    function autoGrow(el) {
      if (el === null || el === undefined) return
      el.style.height = 'auto'
      var style = window.getComputedStyle(el)
      var vertical = parseFloat(style.borderTopWidth || '0') + parseFloat(style.borderBottomWidth || '0')
      var next = Math.min(el.scrollHeight + vertical + 2, 200)
      el.style.height = next + 'px'
      el.style.overflowY = el.scrollHeight + vertical + 2 > 200 ? 'auto' : 'hidden'
    }

    // A hovered / focused / editing row grows taller; if that pushes it past the
    // panel edge, scroll just enough to keep the whole row in view.
    function keepRowVisible(row) {
      if (row === null || row === undefined) return
      window.requestAnimationFrame(function () {
        var scroller = row.parentElement
        if (scroller === null || scroller === undefined) return
        var box = row.getBoundingClientRect()
        var view = scroller.getBoundingClientRect()
        if (box.bottom > view.bottom) scroller.scrollTop += box.bottom - view.bottom + 4
        else if (box.top < view.top) scroller.scrollTop -= view.top - box.top + 4
      })
    }

    // Soft-edge the scrollable panel so clipped rows read as "more content"
    // instead of a hard cut. Edges are only faded on the side that can scroll.
    function syncScrollFade(el) {
      if (el === null || el === undefined) return
      var top = el.scrollTop > 2
      var bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2
      var mask = ''
      if (top && bottom) {
        mask = 'linear-gradient(to bottom,transparent,#000 16px,#000 calc(100% - 16px),transparent)'
      } else if (top) {
        mask = 'linear-gradient(to bottom,transparent,#000 16px)'
      } else if (bottom) {
        mask = 'linear-gradient(to bottom,#000 calc(100% - 16px),transparent)'
      }
      el.style.webkitMaskImage = mask
      el.style.maskImage = mask
    }

    // v2 stores the whole editable list, so the list can grow and shrink.
    // v1 stored positional overrides of the built-in presets; migrate on read.
    function readList(key) {
      try {
        var raw = window.localStorage.getItem(key)
        if (raw === null) return null
        var parsed = JSON.parse(raw)
        return Object.prototype.toString.call(parsed) === '[object Array]' ? parsed : null
      } catch {
        return null
      }
    }

    function normalizeRow(row, index) {
      var isObject = row !== null && typeof row === 'object'
      var label = isObject && typeof row.label === 'string' ? row.label : ''
      var content = isObject && typeof row.content === 'string' ? row.content : ''
      var id = isObject && typeof row.id === 'string' && row.id !== '' ? row.id : 'row-' + index
      return { id: id, label: label, content: content }
    }

    function loadPresets() {
      var stored = readList(STORAGE_KEY)
      if (stored !== null) {
        return stored
          .map(normalizeRow)
          .filter(function (row) {
            return row.label !== '' || row.content !== ''
          })
      }
      var legacy = readList(LEGACY_KEY)
      return PRESETS.map(function (base, index) {
        var row = legacy !== null && legacy[index] !== null && typeof legacy[index] === 'object' ? legacy[index] : null
        var merged = { id: base.id, label: base.label, content: base.content }
        if (row !== null) {
          if (typeof row.label === 'string' && row.label.trim() !== '') merged.label = row.label
          if (typeof row.content === 'string' && row.content.trim() !== '') merged.content = row.content
        }
        return merged
      })
    }

    function savePresets(list) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            list.map(function (preset) {
              return { id: preset.id, label: preset.label, content: preset.content }
            }),
          ),
        )
        window.localStorage.removeItem(LEGACY_KEY)
      } catch {
        // Storage may be blocked; edits keep working for this session.
      }
    }

    function selectDraft(state) {
      return state !== null && state !== undefined && typeof state.draft === 'string' ? state.draft : ''
    }

    function QuickPrompts(props) {
      var useState = react.useState
      var useEffect = react.useEffect
      var useRef = react.useRef
      var h = react.createElement

      var openSlot = useState(false)
      var open = openSlot[0]
      var setOpen = openSlot[1]

      var anchorSlot = useState(null)
      var anchor = anchorSlot[0]
      var setAnchor = anchorSlot[1]

      var presetsSlot = useState(loadPresets)
      var presets = presetsSlot[0]
      var setPresets = presetsSlot[1]

      // null while browsing the list; { index, id, label, content, isNew } while
      // one row is edited in place. No separate editor page exists by design.
      var editSlot = useState(null)
      var editing = editSlot[0]
      var setEditing = editSlot[1]

      // Index of the row currently being dragged, or null. Kept in state (not a
      // ref) so the row can show a drop highlight while it moves.
      var dragSlot = useState(null)
      var dragIndex = dragSlot[0]
      var setDragIndex = dragSlot[1]
      var dragRef = useRef(null)

      // Delete mode: the header minus turns every row's pencil into a trash
      // button, so removing one entry is one click and does not open an editor.
      var removeSlot = useState(false)
      var removeMode = removeSlot[0]
      var setRemoveMode = removeSlot[1]

      // Last deletion, kept just long enough to offer an undo.
      var undoSlot = useState(null)
      var undo = undoSlot[0]
      var setUndo = undoSlot[1]

      var buttonRef = useRef(null)
      var menuRef = useRef(null)
      var itemRefs = useRef([])
      var labelRef = useRef(null)
      var areaRef = useRef(null)
      var presetsRef = useRef(presets)
      presetsRef.current = presets
      // Offsets captured right before a reorder, so the rows can animate from
      // where they were to where they landed (FLIP). offsetTop is used instead
      // of getBoundingClientRect because it ignores any transform mid-animation.
      var prevOffsetsRef = useRef(null)

      var useInput = props.useInput
      var draft = typeof useInput === 'function' ? useInput(selectDraft) : ''

      var editKey = editing === null ? '' : editing.isNew ? 'new' : String(editing.index)

      function close() {
        setOpen(false)
        setEditing(null)
        setRemoveMode(false)
        setUndo(null)
      }

      function toggle() {
        if (open) {
          close()
          return
        }
        var button = buttonRef.current
        if (button !== null && button !== undefined) {
          var rect = button.getBoundingClientRect()
          var viewportW = window.innerWidth
          var viewportH = window.innerHeight
          var width = Math.min(MENU_WIDTH, viewportW - 16)
          var left = Math.max(8, Math.min(rect.left, viewportW - width - 8))
          var spaceAbove = rect.top - MENU_GAP - 8
          var spaceBelow = viewportH - rect.bottom - MENU_GAP - 8
          var cap = Math.min(560, Math.round(viewportH * 0.6))
          // Prefer opening upwards (the composer sits at the bottom), but never
          // let the panel run past the viewport edge.
          var above = spaceAbove >= 240 || spaceAbove >= spaceBelow
          if (above) {
            setAnchor({
              style: {
                left: left + 'px',
                bottom: Math.max(8, viewportH - rect.top + MENU_GAP) + 'px',
                maxHeight: Math.min(cap, Math.max(200, spaceAbove)) + 'px',
              },
            })
          } else {
            setAnchor({
              style: {
                left: left + 'px',
                top: Math.max(8, rect.bottom + MENU_GAP) + 'px',
                maxHeight: Math.min(cap, Math.max(200, spaceBelow)) + 'px',
              },
            })
          }
        }
        setEditing(null)
        setOpen(true)
      }

      useEffect(
        function () {
          if (!open) return undefined
          var onPointerDown = function (event) {
            var menu = menuRef.current
            var button = buttonRef.current
            if (menu !== null && menu !== undefined && menu.contains(event.target)) return
            if (button !== null && button !== undefined && button.contains(event.target)) return
            close()
          }
          var onKeyDown = function (event) {
            if (event.key !== 'Escape') return
            event.preventDefault()
            event.stopPropagation()
            if (editing !== null) setEditing(null)
            else if (removeMode) setRemoveMode(false)
            else close()
          }
          // Reflowing the page under an open panel would leave it floating in the
          // wrong place, so it closes — except when the user is scrolling the
          // panel's own list, which must not dismiss it.
          var onReflow = function (event) {
            var menu = menuRef.current
            var target = event === undefined || event === null ? null : event.target
            if (menu !== null && menu !== undefined && target !== null && target !== undefined && target instanceof Node && menu.contains(target)) return
            close()
          }
          document.addEventListener('pointerdown', onPointerDown, true)
          document.addEventListener('keydown', onKeyDown, true)
          window.addEventListener('resize', onReflow)
          window.addEventListener('scroll', onReflow, true)
          return function () {
            document.removeEventListener('pointerdown', onPointerDown, true)
            document.removeEventListener('keydown', onKeyDown, true)
            window.removeEventListener('resize', onReflow)
            window.removeEventListener('scroll', onReflow, true)
          }
        },
        [open, editing, removeMode],
      )

      useEffect(
        function () {
          if (!open || editing !== null) return
          var first = itemRefs.current[0]
          if (first !== null && first !== undefined && typeof first.focus === 'function') first.focus()
        },
        [open, editing],
      )

      // Focus the field that is most likely being edited — the label for a brand
      // new row, the body for an existing one — but only when the edited row
      // changes, not on every keystroke (editKey stays stable).
      useEffect(
        function () {
          if (editing === null) return
          if (areaRef.current !== null && areaRef.current !== undefined) autoGrow(areaRef.current)
          var target = editing.isNew ? labelRef.current : areaRef.current
          if (target === null || target === undefined) target = labelRef.current
          if (target === null || target === undefined) return
          if (typeof target.focus === 'function') target.focus()
          if (target === areaRef.current && typeof target.setSelectionRange === 'function') {
            var length = typeof target.value === 'string' ? target.value.length : 0
            try {
              target.setSelectionRange(length, length)
            } catch {
              // Some browsers refuse on non-text inputs; focus is enough.
            }
          }
          var box = typeof target.closest === 'function' ? target.closest('.dsh-qp__editor') : null
          if (box !== null && box !== undefined) keepRowVisible(box)
        },
        [editKey],
      )

      // Reordering: pointer-driven, so it works with a trackpad on the first try
      // and does not depend on HTML5 drag-and-drop (which the panel's own scroll
      // and outside-pointerdown handlers would fight).
      function snapshotRows() {
        var menu = menuRef.current
        if (menu === null || menu === undefined) return
        var rows = menu.querySelectorAll('.dsh-qp__row')
        var map = {}
        var index = 0
        while (index < rows.length) {
          var id = rows[index].getAttribute('data-qp-id')
          if (id !== null && id !== undefined) map[id] = rows[index].offsetTop
          index += 1
        }
        prevOffsetsRef.current = map
      }

      // FLIP: after a reorder lands, slide every row from its old offset to the
      // new one. Without this a drop just teleports the list.
      function playReorder() {
        var before = prevOffsetsRef.current
        var menu = menuRef.current
        if (before === null || before === undefined || menu === null || menu === undefined) return
        prevOffsetsRef.current = null
        var rows = menu.querySelectorAll('.dsh-qp__row')
        var index = 0
        while (index < rows.length) {
          var row = rows[index]
          var id = row.getAttribute('data-qp-id')
          var was = before[id]
          if (was !== undefined && was !== null && typeof row.animate === 'function') {
            var dy = was - row.offsetTop
            if (Math.abs(dy) >= 1) {
              row.animate(
                [{ transform: 'translateY(' + dy + 'px)' }, { transform: 'translateY(0)' }],
                { duration: 180, easing: 'cubic-bezier(.22,.8,.28,1)' },
              )
            }
          }
          index += 1
        }
      }

      function startDrag(event, index) {
        if (typeof event.button === 'number' && event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        dragRef.current = { index: index, moved: false }
        setDragIndex(index)
      }

      function moveRow(from, to) {
        if (from === to || to < 0) return false
        var next = presetsRef.current.slice()
        if (from < 0 || from >= next.length || to >= next.length) return false
        var moved = next.splice(from, 1)[0]
        next.splice(to, 0, moved)
        snapshotRows()
        presetsRef.current = next
        savePresets(next)
        setPresets(next)
        return true
      }

      useEffect(function () {
        playReorder()
      }, [presets])

      useEffect(
        function () {
          if (undo === null) return undefined
          var timer = window.setTimeout(function () {
            setUndo(null)
          }, 5000)
          return function () {
            window.clearTimeout(timer)
          }
        },
        [undo],
      )

      useEffect(
        function () {
          if (dragIndex === null) return undefined
          var onMove = function (event) {
            var drag = dragRef.current
            if (drag === null || drag === undefined) return
            var menu = menuRef.current
            var scroller = menu !== null && menu !== undefined ? menu.querySelector('.dsh-qp__scroll') : null
            if (scroller !== null && scroller !== undefined) {
              var view = scroller.getBoundingClientRect()
              if (event.clientY < view.top + 22) scroller.scrollTop -= 12
              else if (event.clientY > view.bottom - 22) scroller.scrollTop += 12
            }
            // Which row is under the pointer? Measured with offsetHeight against
            // the scroll content instead of getBoundingClientRect, because the
            // rows are mid-FLIP-animation while dragging — their rects would
            // include the running translate and make the target flip-flop.
            var rows = itemRefs.current
            var target = -1
            if (scroller !== null && scroller !== undefined) {
              var contentTop = scroller.getBoundingClientRect().top - scroller.scrollTop
              var pointerY = event.clientY - contentTop
              var offset = 0
              var at = 0
              while (at < rows.length) {
                var rowEl = rows[at] !== null && rows[at] !== undefined ? rows[at].parentElement : null
                if (rowEl !== null && rowEl !== undefined) {
                  var height = rowEl.offsetHeight
                  if (pointerY >= offset && pointerY < offset + height) {
                    target = at
                    break
                  }
                  offset += height + 1
                }
                at += 1
              }
            }
            if (target === -1 || target === drag.index) return
            var from = drag.index
            drag.index = target
            drag.moved = true
            var next = presetsRef.current.slice()
            if (from < 0 || from >= next.length || target >= next.length) return
            var moved = next.splice(from, 1)[0]
            next.splice(target, 0, moved)
            snapshotRows()
            presetsRef.current = next
            setPresets(next)
            setDragIndex(target)
          }
          var onUp = function () {
            var drag = dragRef.current
            dragRef.current = null
            setDragIndex(null)
            if (drag !== null && drag !== undefined && drag.moved) savePresets(presetsRef.current)
          }
          window.addEventListener('pointermove', onMove, true)
          window.addEventListener('pointerup', onUp, true)
          window.addEventListener('pointercancel', onUp, true)
          return function () {
            window.removeEventListener('pointermove', onMove, true)
            window.removeEventListener('pointerup', onUp, true)
            window.removeEventListener('pointercancel', onUp, true)
          }
        },
        [dragIndex],
      )

      function insertPreset(preset) {
        var actions = props.inputActions
        if (actions === undefined || actions === null || preset === undefined || preset === null) {
          close()
          return
        }
        var text = preset.content
        if (typeof text !== 'string' || text.trim() === '') {
          close()
          return
        }
        var recorded = typeof draft === 'string'
        var prefix = recorded && draft.length > 0 && !/\n\s*$/.test(draft) ? '\n\n' : ''
        var applied = false
        try {
          var span = actions.captureInsertion()
          if (span !== undefined && span !== null) applied = actions.insertText(prefix + text, span) === true
        } catch {
          applied = false
        }
        if (!applied) {
          // Fall back to a whole-draft write: empty draft keeps it clean, a
          // populated one gets the preset appended as its own paragraph.
          if (recorded && draft.length > 0) actions.setDraft(draft.replace(/\s+$/, '') + '\n\n' + text)
          else actions.setDraft(text)
        }
        close()
        focusEditor()
      }

      // Insertion only writes the draft; the composer keeps focus, so the caret
      // has to be handed back to the editor afterwards — otherwise typing and
      // Enter (send) still need a click first.
      function findEditor() {
        var node = buttonRef.current
        var depth = 0
        while (node !== null && node !== undefined && depth < 8) {
          if (typeof node.querySelector === 'function') {
            var found = node.querySelector('[contenteditable="true"]')
            if (found !== null && found !== undefined && found.offsetParent !== null) return found
          }
          node = node.parentElement
          depth += 1
        }
        var all = document.querySelectorAll('[contenteditable="true"]')
        var index = 0
        while (index < all.length) {
          if (all[index].offsetParent !== null) return all[index]
          index += 1
        }
        return null
      }

      function caretToEnd(el) {
        if (el === null || el === undefined || typeof el.focus !== 'function') return
        try {
          el.focus()
          var selection = window.getSelection()
          if (selection === null || selection === undefined) return
          var range = document.createRange()
          range.selectNodeContents(el)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        } catch {
          // A sandboxed editor may refuse selection changes; focus alone is enough.
        }
      }

      function focusEditor() {
        var editor = findEditor()
        if (editor === null || editor === undefined) return
        caretToEnd(editor)
        // The menu unmounts in the same commit; re-assert once after paint in case
        // the composer reset the caret while it re-rendered the new draft.
        window.requestAnimationFrame(function () {
          var again = findEditor()
          if (again === null || again === undefined) return
          if (document.activeElement !== again) caretToEnd(again)
          else if (window.getSelection() !== null && window.getSelection().anchorNode === null) caretToEnd(again)
        })
      }

      function startAdd() {
        setRemoveMode(false)
        setEditing({
          index: presets.length,
          id: 'custom-' + Date.now().toString(36),
          label: '',
          content: '',
          isNew: true,
        })
      }

      function startEditRow(index) {
        var preset = presets[index]
        if (preset === undefined || preset === null) return
        setEditing({ index: index, id: preset.id, label: preset.label, content: preset.content, isNew: false })
      }

      function patchEdit(field, value) {
        setEditing(function (current) {
          if (current === null) return current
          var next = {
            index: current.index,
            id: current.id,
            label: current.label,
            content: current.content,
            isNew: current.isNew,
          }
          next[field] = value
          return next
        })
      }

      function saveEdit() {
        if (editing === null) return
        var label = typeof editing.label === 'string' ? editing.label.trim() : ''
        var content = typeof editing.content === 'string' ? editing.content.trim() : ''
        if (label === '' && content === '') {
          setEditing(null)
          return
        }
        if (label === '') label = content.slice(0, 12)
        var next = presets.slice()
        var row = { id: editing.id, label: label, content: content }
        if (editing.isNew) next.push(row)
        else next[editing.index] = row
        savePresets(next)
        setPresets(next)
        setEditing(null)
      }

      function removePreset(index) {
        var current = presetsRef.current
        if (index < 0 || index >= current.length) return
        var next = current.slice()
        var removed = next.splice(index, 1)[0]
        snapshotRows()
        presetsRef.current = next
        savePresets(next)
        setPresets(next)
        setUndo({ index: index, preset: removed })
      }

      function undoRemove() {
        if (undo === null) return
        var next = presetsRef.current.slice()
        var at = Math.min(undo.index, next.length)
        next.splice(at, 0, undo.preset)
        snapshotRows()
        presetsRef.current = next
        savePresets(next)
        setPresets(next)
        setUndo(null)
      }

      function deleteEditing() {
        if (editing === null) return
        if (editing.isNew) {
          setEditing(null)
          return
        }
        var next = presets.slice()
        next.splice(editing.index, 1)
        savePresets(next)
        setPresets(next)
        setEditing(null)
      }

      function moveFocus(delta) {
        var items = itemRefs.current.filter(function (el) {
          return el !== null && el !== undefined
        })
        if (items.length === 0) return
        var current = items.indexOf(document.activeElement)
        var next = current === -1 ? 0 : (current + delta + items.length) % items.length
        items[next].focus()
      }

      function onMenuKeyDown(event) {
        if (editing !== null) return
        if (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
          var rows = itemRefs.current
          var current = rows.indexOf(document.activeElement)
          if (current === -1) return
          var to = current + (event.key === 'ArrowDown' ? 1 : -1)
          if (to < 0 || to >= presets.length) return
          event.preventDefault()
          if (!moveRow(current, to)) return
          window.requestAnimationFrame(function () {
            var el = itemRefs.current[to]
            if (el !== null && el !== undefined && typeof el.focus === 'function') el.focus()
          })
          return
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          moveFocus(event.key === 'ArrowDown' ? 1 : -1)
          return
        }
        if (event.metaKey || event.ctrlKey || event.altKey) return
        if (removeMode) return
        if (event.key.length !== 1 || event.key < '0' || event.key > '9') return
        var index = event.key === '0' ? 9 : Number(event.key) - 1
        var preset = presets[index]
        if (preset === undefined) return
        event.preventDefault()
        insertPreset(preset)
      }

      // Icons are Lucide (ISC), drawn as strokes so they match the weight of the
      // composer's own toolbar icons. A bolt said "fast", not "saved prompts";
      // the notebook is the prompt book itself.
      var promptIcon = h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 15,
          height: 15,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.75,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('path', { d: 'M2 6h4' }),
        h('path', { d: 'M2 10h4' }),
        h('path', { d: 'M2 14h4' }),
        h('path', { d: 'M2 18h4' }),
        h('rect', { width: 16, height: 20, x: 6, y: 2, rx: 2 }),
        h('path', { d: 'M9.5 8h5' }),
        h('path', { d: 'M9.5 12h5' }),
        h('path', { d: 'M9.5 16h2' }),
      )

      var pencil = h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 14,
          height: 14,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.75,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('path', { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' }),
        h('path', { d: 'm15 5 4 4' }),
      )

      // Lucide `grip-vertical`, filled dots: at 14px a stroked hairline dot
      // disappears, so the dots are drawn as fills.
      var grip = h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 14,
          height: 14,
          fill: 'currentColor',
          stroke: 'none',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('circle', { cx: 9, cy: 6, r: 1.7 }),
        h('circle', { cx: 9, cy: 12, r: 1.7 }),
        h('circle', { cx: 9, cy: 18, r: 1.7 }),
        h('circle', { cx: 15, cy: 6, r: 1.7 }),
        h('circle', { cx: 15, cy: 12, r: 1.7 }),
        h('circle', { cx: 15, cy: 18, r: 1.7 }),
      )

      var plus = h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 14,
          height: 14,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('path', { d: 'M5 12h14' }),
        h('path', { d: 'M12 5v14' }),
      )

      var minus = h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 14,
          height: 14,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('path', { d: 'M5 12h14' }),
      )

      // Lucide `trash-2`. A trash can, not a minus: on a row the icon has to say
      // "this one goes away" without borrowing the header's mode toggle.
      var trash = h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 14,
          height: 14,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.75,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('path', { d: 'M3 6h18' }),
        h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }),
        h('path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }),
        h('path', { d: 'M10 11v6' }),
        h('path', { d: 'M14 11v6' }),
      )

      function rowNode(preset, index) {
        return h(
          'div',
          {
            key: preset.id,
            'data-qp-id': preset.id,
            className: 'dsh-qp__row' + (dragIndex === index ? ' dsh-qp__row--drag' : ''),
          },
          h(
            'span',
            {
              className: 'dsh-qp__grip',
              role: 'button',
              tabIndex: -1,
              title: '拖动排序（Alt + ↑/↓ 也可以移动）',
              'aria-label': '拖动排序',
              onPointerDown: function (event) {
                startDrag(event, index)
              },
            },
            grip,
          ),
          h(
            'button',
            {
              ref: function (el) {
                itemRefs.current[index] = el
              },
              type: 'button',
              role: 'menuitem',
              className: 'dsh-qp__item',
              // In delete mode the row body must not insert anything: a near miss
              // on the trash button would otherwise pollute the draft.
              title: removeMode ? '点右侧的垃圾桶删除' : '插入到输入框',
              onMouseEnter: function (event) {
                keepRowVisible(event.currentTarget.parentElement)
              },
              onFocus: function (event) {
                keepRowVisible(event.currentTarget.parentElement)
              },
              onClick: function () {
                if (removeMode) return
                insertPreset(preset)
              },
            },
            h('span', { className: 'dsh-qp__idx' }, String(index + 1)),
            h(
              'span',
              { className: 'dsh-qp__body' },
              h('span', { className: 'dsh-qp__label' }, preset.label),
              h(
                'span',
                { className: 'dsh-qp__text' },
                preset.content.trim() === '' ? '（还没填正文）' : preset.content.split('\n')[0],
              ),
            ),
          ),
          removeMode
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-qp__remove',
                  title: '删除这一条',
                  'aria-label': '删除「' + preset.label + '」',
                  onClick: function (event) {
                    event.preventDefault()
                    event.stopPropagation()
                    removePreset(index)
                  },
                },
                trash,
              )
            : h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-qp__edit',
                  title: '编辑这一条',
                  'aria-label': '编辑「' + preset.label + '」',
                  onClick: function (event) {
                    event.preventDefault()
                    event.stopPropagation()
                    startEditRow(index)
                  },
                },
                pencil,
              ),
        )
      }

      function editorNode() {
        return h(
          'div',
          { key: 'editor', className: 'dsh-qp__editor' },
          h('input', {
            ref: labelRef,
            type: 'text',
            className: 'dsh-qp__input',
            value: editing.label,
            placeholder: '标签，短一点',
            maxLength: 24,
            onChange: function (event) {
              patchEdit('label', event.currentTarget.value)
            },
            onKeyDown: function (event) {
              if (event.key === 'Enter') {
                event.preventDefault()
                saveEdit()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                setEditing(null)
              }
            },
          }),
          h('textarea', {
            ref: areaRef,
            className: 'dsh-qp__area',
            rows: 2,
            value: editing.content,
            placeholder: '正文，选中后整段插入输入框。留空也能先存着。',
            onChange: function (event) {
              autoGrow(event.currentTarget)
              patchEdit('content', event.currentTarget.value)
            },
          }),
          h(
            'div',
            { className: 'dsh-qp__row-actions' },
            editing.isNew
              ? null
              : h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-qp__row-btn dsh-qp__row-btn--danger',
                    onClick: deleteEditing,
                  },
                  '删除',
                ),
            h('span', { className: 'dsh-qp__row-actions-spacer' }),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-qp__row-btn',
                onClick: function () {
                  setEditing(null)
                },
              },
              '取消',
            ),
            h(
              'button',
              { type: 'button', className: 'dsh-qp__row-btn dsh-qp__row-btn--save', onClick: saveEdit },
              '保存',
            ),
          ),
        )
      }

      var listNodes = []
      presets.forEach(function (preset, index) {
        if (editing !== null && editing.isNew === false && editing.index === index) listNodes.push(editorNode())
        else listNodes.push(rowNode(preset, index))
      })
      if (editing !== null && editing.isNew) listNodes.push(editorNode())
      itemRefs.current.length = presets.length

      var listBody = h(
        react.Fragment,
        null,
        h(
          'div',
          { className: 'dsh-qp__head' },
          h('b', null, '快捷提示词'),
          h(
            'div',
            { className: 'dsh-qp__head-tools' },
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-qp__add',
                title: '添加一条',
                'aria-label': '添加一条提示词',
                onClick: startAdd,
              },
              plus,
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-qp__add' + (removeMode ? ' dsh-qp__add--on' : ''),
                title: removeMode ? '退出删除' : '删除某一条',
                'aria-label': removeMode ? '退出删除模式' : '进入删除模式',
                'aria-pressed': removeMode,
                onClick: function () {
                  setRemoveMode(!removeMode)
                  setEditing(null)
                },
              },
              minus,
            ),
          ),
        ),
        h(
          'div',
          {
            className: 'dsh-qp__scroll',
            ref: function (el) {
              syncScrollFade(el)
            },
            onScroll: function (event) {
              syncScrollFade(event.currentTarget)
            },
          },
          presets.length === 0 && editing === null
            ? h('div', { className: 'dsh-qp__empty' }, '还没有提示词。点右上角的 + 加一条。')
            : listNodes,
        ),
        undo === null
          ? null
          : h(
              'div',
              { className: 'dsh-qp__toast', role: 'status' },
              h('span', { className: 'dsh-qp__toast-text' }, '已删除「' + undo.preset.label + '」'),
              h(
                'button',
                { type: 'button', className: 'dsh-qp__toast-btn', onClick: undoRemove },
                '撤销',
              ),
            ),
      )

      var menu =
        open && anchor !== null && anchor !== undefined
          ? h(
              'div',
              {
                ref: menuRef,
                className:
                  'dsh-qp__menu' +
                  (dragIndex === null ? '' : ' dsh-qp--drag') +
                  (removeMode ? ' dsh-qp--remove' : ''),
                role: editing === null ? 'menu' : 'dialog',
                'aria-label': '快捷提示词',
                style: anchor.style,
                onKeyDown: onMenuKeyDown,
              },
              listBody,
            )
          : null

      return h(
        react.Fragment,
        null,
        h(
          'button',
          {
            ref: buttonRef,
            type: 'button',
            className: 'dsh-qp__trigger',
            title: '快捷提示词',
            'aria-label': '快捷提示词',
            'aria-haspopup': 'menu',
            'aria-expanded': open ? 'true' : 'false',
            onPointerDown: function (event) {
              // Keep the editor's caret alive so the preset lands where the user
              // was typing instead of at the end of the draft.
              event.preventDefault()
            },
            onClick: function (event) {
              event.preventDefault()
              event.stopPropagation()
              toggle()
            },
          },
          promptIcon,
        ),
        menu,
      )
    }

    function apply(ctx) {
      if (react === null) {
        console.error('[quick-prompts] react was not seeded; composer picker disabled')
        return
      }
      installStyles()
      try {
        // ctx.effect calls its argument and keeps the returned disposer, so the
        // removal must be deferred: pass a factory, not removeStyles itself.
        ctx.effect(function () {
          return removeStyles
        }, 'quick-prompts: styles')
      } catch {
        // Older shells may not expose ctx.effect; the style tag is harmless.
      }
      try {
        ctx.slots.inject('conversation.input.left', function* () {
          yield ctx.slots.register(
            { name: 'conversation.input.left', id: 'quick-prompts', order: 20 },
            QuickPrompts,
          )
        })
      } catch (error) {
        console.error('[quick-prompts] composer picker registration failed:', error)
      }
    }

    exports.apply = apply
    exports.inject = ['slots']
    return module.exports
  },
})
