window.TWBA_SCENARIOS = [
  {
    id: "top",
    title: "球在弧顶正中",
    principle: "2-3起手时，1号稍前压迫，后四人保持互相补位距离，先建立整体重心。",
    ball: { x: 50, y: 20 },
    offense: [
      { id: "O1", label: "持球", x: 50, y: 20 },
      { id: "O2", label: "左45", x: 24, y: 39 },
      { id: "O3", label: "右45", x: 76, y: 39 },
      { id: "O4", label: "左底", x: 12, y: 79 },
      { id: "O5", label: "右底", x: 88, y: 79 }
    ],
    defenders: {
      "1": { x: 48, y: 28, status: "pressure" },
      "2": { x: 62, y: 34, status: "contain" },
      "3": { x: 27, y: 67, status: "baseline" },
      "4": { x: 73, y: 67, status: "baseline" },
      "5": { x: 50, y: 61, status: "middle" }
    },
    arrows: [
      { from: { x: 48, y: 35 }, to: { x: 48, y: 27 }, type: "rotation", roles: ["1"], label: "1号前压" },
      { from: { x: 50, y: 66 }, to: { x: 50, y: 57 }, type: "help", roles: ["5"], label: "5号守中" }
    ],
    zones: [
      { id: "middle", label: "中路", x: 37, y: 34, width: 26, height: 40, type: "middle" },
      { id: "baseline", label: "底线保护", x: 18, y: 66, width: 64, height: 24, type: "last" }
    ],
    responsibilities: {
      "1": {
        where: "站在弧顶持球人前方半步到一步，身体略侧向，压住正面突破。",
        watch: "先看球，再扫两侧第一传和持球人启动脚。",
        why: "让持球人不能舒服观察全场，迫使进攻先把球传到边线区域。"
      },
      "2": {
        where: "站在弧顶右侧与罚球线延长线之间，保持能补中也能扑翼侧。",
        watch: "看球、右侧45度和高位接应。",
        why: "稳定上线第二层，避免1号前压后中路被直接打穿。"
      },
      "3": {
        where: "站在1号同侧短角到低位之间，离篮下保持一步半补位距离。",
        watch: "看同侧底角、篮下切入和球的第一传。",
        why: "守住底线入口，并准备在球到底角时外扩压迫。"
      },
      "4": {
        where: "站在异侧短角到低位之间，位置略向篮筐内收。",
        watch: "看异侧底角、篮下背切和弱侧篮板。",
        why: "弱侧底线人要优先保护篮下，再决定是否扑外线。"
      },
      "5": {
        where: "站在限制区上沿附近，正对球和篮筐。",
        watch: "看高位接球、中路切入和篮下人。",
        why: "5号是中路闸门，必须保证后排三人没有被拉散。"
      }
    },
    coachNotes: "起手不是五个人站点，而是五个人保持可补位距离。"
  },
  {
    id: "one-side-wing",
    title: "球到1号同侧45度",
    principle: "1号上前压球，全队向强侧旋转，形成从持球人看来接近1-3-1的防守重心。",
    ball: { x: 27, y: 38 },
    offense: [
      { id: "O1", label: "持球", x: 27, y: 38 },
      { id: "O2", label: "弧顶", x: 50, y: 22 },
      { id: "O3", label: "底角", x: 12, y: 79 },
      { id: "O4", label: "弱45", x: 78, y: 40 },
      { id: "O5", label: "弱底", x: 88, y: 79 }
    ],
    defenders: {
      "1": { x: 29, y: 44, status: "pressure" },
      "2": { x: 46, y: 43, status: "middle-line" },
      "3": { x: 24, y: 62, status: "middle-line" },
      "4": { x: 61, y: 75, status: "last-line" },
      "5": { x: 48, y: 61, status: "middle-line" }
    },
    arrows: [
      { from: { x: 48, y: 30 }, to: { x: 29, y: 44 }, type: "rotation", roles: ["1"], label: "压向强侧" },
      { from: { x: 62, y: 34 }, to: { x: 46, y: 43 }, type: "rotation", roles: ["2"], label: "横移补中" },
      { from: { x: 27, y: 67 }, to: { x: 24, y: 62 }, type: "rotation", roles: ["3"], label: "上提成线" },
      { from: { x: 73, y: 67 }, to: { x: 61, y: 75 }, type: "help", roles: ["4"], label: "弱侧收缩" },
      { from: { x: 50, y: 61 }, to: { x: 48, y: 61 }, type: "help", roles: ["5"], label: "中路偏强侧" },
      { from: { x: 50, y: 22 }, to: { x: 27, y: 38 }, type: "pass", roles: ["1", "2"], label: "传球方向" }
    ],
    zones: [
      { id: "strong-side", label: "强侧压迫", x: 0, y: 30, width: 42, height: 70, type: "strong" },
      { id: "middle-line", label: "中间三人", x: 22, y: 40, width: 34, height: 30, type: "middle" },
      { id: "last-line", label: "最后保护", x: 52, y: 66, width: 28, height: 24, type: "last" }
    ],
    responsibilities: {
      "1": {
        where: "上前到持球人斜前方，压住中路突破，让球更难回到弧顶。",
        watch: "看球、持球人脚步和弧顶回传线。",
        why: "1号的压力决定全队能否把球赶向边线，而不是让进攻从中路重新组织。"
      },
      "2": {
        where: "横移到中间三人线外侧，既能补弧顶也能卡高位。",
        watch: "看弧顶回传、高位接应和弱侧转移。",
        why: "2号不能跟球过深，否则反向转移会直接打到空位。"
      },
      "3": {
        where: "从底线向上提到强侧腰位，和1号、5号形成夹击与补位角度。",
        watch: "看底角、短角和持球人底线突破。",
        why: "3号上提后，强侧不是单人防守，而是边线压迫区域。"
      },
      "4": {
        where: "从弱侧底线收缩到篮下偏弱侧，作为最后一层。",
        watch: "看篮下、弱侧底角和背切。",
        why: "当整体向强侧旋转时，4号必须先保护篮筐，不能站死在外线。"
      },
      "5": {
        where: "站在限制区中上部，略向强侧移动。",
        watch: "看高位、篮下和强侧突破。",
        why: "5号负责把中路关住，让1号和3号敢于给持球人压力。"
      }
    },
    coachNotes: "这是核心画面：从持球人角度看，最前是1号，中间是2、5、3，最后是4。"
  },
  {
    id: "one-side-corner",
    title: "球到1号同侧底角",
    principle: "底角可以压迫，但3号外扩后，5号和4号必须补掉其身后的篮下空当。",
    ball: { x: 12, y: 79 },
    offense: [
      { id: "O1", label: "持球", x: 12, y: 79 },
      { id: "O2", label: "45度", x: 27, y: 38 },
      { id: "O3", label: "高位", x: 50, y: 50 },
      { id: "O4", label: "弱底", x: 88, y: 79 }
    ],
    defenders: {
      "1": { x: 24, y: 55, status: "trap-angle" },
      "2": { x: 46, y: 46, status: "deny-high" },
      "3": { x: 16, y: 75, status: "corner-pressure" },
      "4": { x: 60, y: 79, status: "last-line" },
      "5": { x: 42, y: 73, status: "rim" }
    },
    arrows: [
      { from: { x: 24, y: 62 }, to: { x: 16, y: 75 }, type: "rotation", roles: ["3"], label: "3号扑底角" },
      { from: { x: 29, y: 44 }, to: { x: 24, y: 55 }, type: "help", roles: ["1"], label: "1号堵回传" },
      { from: { x: 48, y: 61 }, to: { x: 42, y: 73 }, type: "help", roles: ["5"], label: "5号补篮下" },
      { from: { x: 61, y: 75 }, to: { x: 60, y: 79 }, type: "help", roles: ["4"], label: "4号最后保护" },
      { from: { x: 27, y: 38 }, to: { x: 12, y: 79 }, type: "pass", roles: ["1", "3"], label: "传到底角" }
    ],
    zones: [
      { id: "corner-trap", label: "底角压迫", x: 0, y: 67, width: 28, height: 31, type: "strong" },
      { id: "rim-cover", label: "篮下补位", x: 35, y: 69, width: 37, height: 24, type: "middle" }
    ],
    responsibilities: {
      "1": {
        where: "从压球位回收到45度与底角之间，堵回传并准备夹击。",
        watch: "看底角持球人、45度回传和突破启动。",
        why: "1号回收后，底角持球人不容易把球轻松传回上线。"
      },
      "2": {
        where: "站在罚球线延长线附近，卡住高位和弧顶回传。",
        watch: "看高位接球、弧顶空位和横传。",
        why: "如果2号太靠边，高位会成为进攻最舒服的出口。"
      },
      "3": {
        where: "外扩到持球人正前或斜前方，手臂封底线传球和突破。",
        watch: "看球、底线突破和短角人。",
        why: "底角空间小，3号可以主动施压，但身后必须有人补。"
      },
      "4": {
        where: "从弱侧底线收进篮下偏弱侧，准备补背后和弱侧篮板。",
        watch: "看篮下切入、弱侧底角和投篮篮板。",
        why: "3号外扩后，4号是篮下最后保护，先保近筐。"
      },
      "5": {
        where: "向强侧篮下移动，顶住篮下接应和底线突破。",
        watch: "看持球人突破路线、篮下人和高位下顺。",
        why: "5号补到篮下，才能让3号放心扑出到底角。"
      }
    },
    coachNotes: "底角压迫和篮下补位必须同时发生，慢一步就会漏短角或篮下。"
  },
  {
    id: "opposite-wing",
    title: "球快速转移到另一侧45度",
    principle: "反向转移时先保护中路和篮下，再完成新的强弱侧分配。",
    ball: { x: 76, y: 39 },
    offense: [
      { id: "O1", label: "持球", x: 76, y: 39 },
      { id: "O2", label: "弧顶", x: 50, y: 22 },
      { id: "O3", label: "底角", x: 88, y: 78 },
      { id: "O4", label: "弱45", x: 22, y: 41 },
      { id: "O5", label: "弱底", x: 12, y: 79 }
    ],
    defenders: {
      "1": { x: 48, y: 48, status: "recover" },
      "2": { x: 72, y: 45, status: "delay" },
      "3": { x: 39, y: 76, status: "last-line" },
      "4": { x: 76, y: 63, status: "middle-line" },
      "5": { x: 53, y: 62, status: "middle" }
    },
    arrows: [
      { from: { x: 24, y: 55 }, to: { x: 48, y: 48 }, type: "rotation", roles: ["1"], label: "1号回中" },
      { from: { x: 46, y: 43 }, to: { x: 72, y: 45 }, type: "rotation", roles: ["2"], label: "2号先顶" },
      { from: { x: 60, y: 79 }, to: { x: 39, y: 76 }, type: "help", roles: ["3"], label: "3号回弱侧" },
      { from: { x: 61, y: 75 }, to: { x: 76, y: 63 }, type: "rotation", roles: ["4"], label: "4号接强侧" },
      { from: { x: 27, y: 38 }, to: { x: 76, y: 39 }, type: "pass", roles: ["1", "2", "5"], label: "快速转移" }
    ],
    zones: [
      { id: "middle-first", label: "先保中路", x: 35, y: 40, width: 30, height: 36, type: "middle" },
      { id: "new-strong", label: "新强侧", x: 62, y: 32, width: 38, height: 66, type: "strong" }
    ],
    responsibilities: {
      "1": {
        where: "从原强侧回落到中路协防位置，不追球到另一侧最深处。",
        watch: "看中路、高位和新的持球人突破方向。",
        why: "1号回落可以保护被快速转移拉开的中间空隙。"
      },
      "2": {
        where: "第一时间顶到新持球人的斜前方，先延误再等队友归位。",
        watch: "看球、突破和底角传球。",
        why: "2号先顶上可以避免对方转移后一接球就投或突。"
      },
      "3": {
        where: "从原强侧底线收成弱侧最后保护。",
        watch: "看篮下、弱侧背切和长篮板。",
        why: "反向转移时原强侧人不能停在边线，必须跟着阵型回收。"
      },
      "4": {
        where: "向新强侧上提，准备处理底角和短角。",
        watch: "看新强侧底角、短角和底线突破。",
        why: "4号成为新强侧底线防守人，要接上下一拍轮转。"
      },
      "5": {
        where: "留在中路偏篮下位置，脚步小幅横移。",
        watch: "看高位、中路切入和篮筐。",
        why: "5号不能被横传拉出篮下，先守住最危险区域。"
      }
    },
    coachNotes: "反向轮转不是各回原点，而是先封最危险的中路和近筐。"
  },
  {
    id: "high-post",
    title: "球进入罚球线 / 高位",
    principle: "高位接球必须立刻收缩，中路不能让进攻舒服面筐。",
    ball: { x: 50, y: 51 },
    offense: [
      { id: "O1", label: "高位", x: 50, y: 51 },
      { id: "O2", label: "左45", x: 24, y: 40 },
      { id: "O3", label: "右45", x: 76, y: 40 },
      { id: "O4", label: "短角", x: 22, y: 78 },
      { id: "O5", label: "短角", x: 78, y: 78 }
    ],
    defenders: {
      "1": { x: 39, y: 45, status: "pinch" },
      "2": { x: 61, y: 45, status: "pinch" },
      "3": { x: 31, y: 75, status: "short-corner" },
      "4": { x: 69, y: 75, status: "short-corner" },
      "5": { x: 50, y: 58, status: "high-post" }
    },
    arrows: [
      { from: { x: 50, y: 64 }, to: { x: 50, y: 56 }, type: "rotation", roles: ["5"], label: "5号顶高位" },
      { from: { x: 29, y: 44 }, to: { x: 39, y: 45 }, type: "help", roles: ["1"], label: "1号夹中" },
      { from: { x: 72, y: 45 }, to: { x: 61, y: 45 }, type: "help", roles: ["2"], label: "2号夹中" },
      { from: { x: 24, y: 62 }, to: { x: 31, y: 75 }, type: "help", roles: ["3"], label: "3号保短角" },
      { from: { x: 76, y: 63 }, to: { x: 69, y: 75 }, type: "help", roles: ["4"], label: "4号保短角" }
    ],
    zones: [
      { id: "high-post-danger", label: "高位危险区", x: 39, y: 43, width: 22, height: 20, type: "strong" },
      { id: "rim-line", label: "篮下保护", x: 28, y: 70, width: 44, height: 22, type: "middle" }
    ],
    responsibilities: {
      "1": {
        where: "从上线向内收，站在高位持球人的左前侧，挡住向同侧外线和篮下的直传。",
        watch: "看球、同侧45度和持球人转身。",
        why: "上线收缩可以压缩高位视野，让高位不能轻松做二传。"
      },
      "2": {
        where: "从另一侧上线向内夹，和1号形成左右干扰。",
        watch: "看球、弱侧45度和横传。",
        why: "2号收缩后，高位持球人很难直接转身面筐或送弱侧空切。"
      },
      "3": {
        where: "站到同侧短角与篮下之间，身体朝球也能碰到身后人。",
        watch: "看短角、篮下切入和底线传球。",
        why: "5号顶高位时，底线人要先补篮下边缘。"
      },
      "4": {
        where: "站到弱侧短角与篮下之间，向篮筐收一步。",
        watch: "看弱侧短角、背切和篮板。",
        why: "高位最容易打弱侧背后，4号必须提前收。"
      },
      "5": {
        where: "顶到高位持球人正前，脚下稳住，不被一步过掉。",
        watch: "看球、持球人中轴脚和篮下接应。",
        why: "高位是2-3联防最危险区域，5号必须先让对方停下来。"
      }
    },
    coachNotes: "高位一接球，全队要从扩张轮转切换为收缩夹中。"
  },
  {
    id: "shot-rebound",
    title: "投篮出手 / 篮板",
    principle: "投篮一出手，所有人从看球轮转切换为找人卡位，先保护篮板。",
    ball: { x: 70, y: 28 },
    offense: [
      { id: "O1", label: "投手", x: 70, y: 28 },
      { id: "O2", label: "冲抢", x: 28, y: 63 },
      { id: "O3", label: "冲抢", x: 72, y: 70 },
      { id: "O4", label: "弱侧", x: 18, y: 78 }
    ],
    defenders: {
      "1": { x: 57, y: 40, status: "long-rebound" },
      "2": { x: 73, y: 45, status: "contest" },
      "3": { x: 34, y: 77, status: "box-out" },
      "4": { x: 66, y: 79, status: "box-out" },
      "5": { x: 50, y: 78, status: "rim-box" }
    },
    arrows: [
      { from: { x: 72, y: 45 }, to: { x: 70, y: 28 }, type: "rotation", roles: ["2"], label: "干扰出手" },
      { from: { x: 48, y: 48 }, to: { x: 57, y: 40 }, type: "help", roles: ["1"], label: "长篮板" },
      { from: { x: 31, y: 75 }, to: { x: 34, y: 77 }, type: "help", roles: ["3"], label: "卡底线" },
      { from: { x: 69, y: 75 }, to: { x: 66, y: 79 }, type: "help", roles: ["4"], label: "卡弱侧" },
      { from: { x: 50, y: 58 }, to: { x: 50, y: 78 }, type: "help", roles: ["5"], label: "找中路人" }
    ],
    zones: [
      { id: "rebound", label: "篮板区", x: 27, y: 68, width: 46, height: 25, type: "middle" },
      { id: "long-board", label: "长篮板", x: 42, y: 30, width: 34, height: 20, type: "last" }
    ],
    responsibilities: {
      "1": {
        where: "站到上线偏中位置，身体先卡住可能冲长篮板的人。",
        watch: "看投手落点、长篮板和第一传。",
        why: "联防出手后上线容易只看球，1号要负责长篮板和转换第一拍。"
      },
      "2": {
        where: "在投手前方完成干扰后，落地立刻找身边人卡位。",
        watch: "看投手、篮板弹出方向和外线二次投篮。",
        why: "干扰出手只是第一步，漏掉投手跟进会送二次进攻。"
      },
      "3": {
        where: "站在底线左侧冲抢路线前，先碰人再转身看球。",
        watch: "看底线冲抢、弱侧切入和篮板落点。",
        why: "联防没有天然对位，3号必须主动找到最近威胁。"
      },
      "4": {
        where: "站在弱侧篮下外沿，卡住背后冲抢和底角跟进。",
        watch: "看弱侧人、篮筐和长篮板反弹。",
        why: "多数远投篮板会弹到弱侧，4号不能只盯球。"
      },
      "5": {
        where: "站在篮筐正前，先找中路大个或冲抢人做身体接触。",
        watch: "看最近进攻人、篮板落点和二次补篮。",
        why: "5号是篮板核心，投篮后必须从护筐切换为卡位。"
      }
    },
    coachNotes: "联防最容易漏篮板，因为不是人盯人；出手瞬间每个人都要先找人。"
  }
];
