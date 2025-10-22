<template>
  <div class="p-2 md:p-4 space-y-3">
    <!-- 頁首 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">選單與頁面樹</div>
      <div class="flex items-center gap-2">
        <el-button @click="reload" :loading="loading">重新載入</el-button>
        <el-button type="primary" @click="save" :loading="saving">儲存</el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <!-- 左側：樹 -->
      <el-card shadow="never" class="border! border-gray-200! lg:col-span-5">
        <div class="flex items-center gap-2 mb-2">
          <el-input
            v-model="filterText"
            placeholder="搜尋名稱 / 路徑"
            clearable
            class="flex-1"
          />
          <el-button @click="expandAll(true)">展開</el-button>
          <el-button @click="expandAll(false)">收合</el-button>
          <el-button type="success" @click="addRoot">新增根節點</el-button>
        </div>

        <el-tree
          ref="treeRef"
          :data="tree"
          node-key="id"
          draggable
          :allow-drop="allowDrop"
          :props="treeProps"
          :expand-on-click-node="false"
          highlight-current
          :filter-node-method="filterNode"
          @node-click="onNodeClick"
          @node-drop="onNodeDrop"
          class="tree-xl"
          :indent="28"
        >
          <template #default="{ node, data }">
            <div class="flex items-center gap-5 w-full">
              <el-tag
                size="large"
                :type="typeTagType(data.type)"
                class="min-w-[64px] text-center px-2"
              >
                {{ TYPE_LABELS[data.type] }}
              </el-tag>

              <span class="font-semibold text-[16px] md:text-[18px]">{{
                data.label
              }}</span>

              <span
                v-if="data.visible === false"
                class="text-[15px] md:text-[16px] text-slate-400"
                >(隱藏)</span
              >

              <span class="text-[15px] md:text-[16px] text-slate-500 ml-auto">
                {{ previewPath(data.id) }}
              </span>

              <el-dropdown trigger="click">
                <span class="el-dropdown-link px-1">
                  <el-icon class="text-[18px]"><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="addSibling(node, data)"
                      >新增同層</el-dropdown-item
                    >
                    <el-dropdown-item @click="addChild(data)">新增子層</el-dropdown-item>
                    <el-dropdown-item
                      divided
                      @click="removeNode(node, data)"
                      class="text-red-600"
                    >
                      刪除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-tree>
      </el-card>

      <!-- 右側：編輯表單 -->
      <el-card shadow="never" class="border! border-gray-200! lg:col-span-7 form-xl-card">
        <div v-if="!active" class="text-slate-500 text-[16px] md:text-[18px]">
          請在左側選取一個節點進行編輯
        </div>

        <el-form
          v-else
          :model="active"
          label-width="128px"
          class="form-xl space-y-3 md:space-y-4"
        >
          <el-form-item label="名稱">
            <el-input
              v-model="active.label"
              size="large"
              placeholder="顯示於選單的文字"
            />
          </el-form-item>

          <el-form-item label="型態">
            <el-radio-group v-model="active.type" size="large">
              <el-radio label="section">目錄（不可點）</el-radio>
              <el-radio label="page">內頁</el-radio>
              <el-radio label="link">外部連結</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="路徑片段" v-if="active.type !== 'link'">
            <el-input
              v-model="active.slug"
              size="large"
              placeholder="例如: latest-news、about"
            />
          </el-form-item>

          <el-form-item label="外部連結 URL" v-if="active.type === 'link'">
            <el-input
              v-model="active.url"
              size="large"
              placeholder="https://example.com"
            />
          </el-form-item>

          <el-form-item label="顯示">
            <el-switch v-model="active.visible" size="large" />
            <el-checkbox v-model="active.blank" size="large" class="ml-4"
              >新視窗開啟</el-checkbox
            >
          </el-form-item>

          <el-divider />

          <div class="text-[16px] md:text-[18px] text-slate-500">
            完整路徑：<span class="font-mono">{{ previewPath(active.id) }}</span>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { MoreFilled } from "@element-plus/icons-vue";

/* ---------- 常數 ---------- */
const LS_KEY = "site.menu.tree.v1";
const TYPE_LABELS = { section: "目錄", page: "內頁", link: "外部" };
const SUGGEST_KWS = ["鹿谷", "鄉公所", "政令宣導", "便民服務", "最新消息"];

/* ---------- 樹資料與狀態 ---------- */
const tree = ref([]); // 整棵樹
const loading = ref(false);
const saving = ref(false);
const activeId = ref(""); // 當前選取節點 id
const filterText = ref("");

const treeProps = { label: "label", children: "children" };
const active = computed({
  get: () => findById(tree.value, activeId.value),
  set: (v) => void v,
});

/* ---------- 初始化（Sitemap -> 初始資料） ---------- */
function seedIfEmpty() {
  if (localStorage.getItem(LS_KEY)) return;
  const seed = [
    {
      label: "熱門消息",
      type: "section",
      slug: "activities",
      visible: true,
      children: [
        { label: "最新消息", type: "page", slug: "latest" },
        { label: "新聞稿", type: "page", slug: "press" },
        { label: "招標公告", type: "page", slug: "tenders" },
        { label: "徵才公告", type: "page", slug: "jobs" },
        { label: "活動訊息", type: "page", slug: "events" },
      ],
    },
    {
      label: "關於鹿谷",
      type: "section",
      slug: "about",
      children: [
        { label: "鹿谷簡介", type: "page", slug: "intro" },
        { label: "公所介紹", type: "page", slug: "office" },
        { label: "觀光景點", type: "page", slug: "attractions" },
        { label: "特產介紹", type: "page", slug: "products" },
        { label: "交通運輸", type: "page", slug: "transportation" },
        { label: "行政區域", type: "page", slug: "districts" },
        { label: "各課室業務", type: "page", slug: "departments" },
        { label: "課室分機", type: "page", slug: "extensions" },
        { label: "行政區域圖", type: "page", slug: "maps" },
        { label: "鄉志", type: "page", slug: "chronicle" },
      ],
    },
    {
      label: "法規政策",
      type: "section",
      slug: "policies",
      children: [
        { label: "政策相關", type: "page", slug: "policy" },
        { label: "年度經費", type: "page", slug: "budget" },
        { label: "資訊公開", type: "page", slug: "open" },
        { label: "廉政園地", type: "page", slug: "ethics" },
        { label: "施工工程", type: "page", slug: "projects" },
        { label: "最新債務訊息", type: "page", slug: "debt" },
        { label: "災後復建審議", type: "page", slug: "rebuild" },
        { label: "永續提升人行安全計畫", type: "page", slug: "pedestrian" },
      ],
    },
    {
      label: "便民服務",
      type: "section",
      slug: "services",
      children: [
        { label: "社會福利", type: "page", slug: "welfare" },
        { label: "防災專區", type: "page", slug: "disaster" },
        { label: "兵役資訊", type: "page", slug: "military" },
        { label: "鄉立幼兒園", type: "page", slug: "kindergarten" },
        { label: "鹿谷鄉立圖書館", type: "page", slug: "library" },
        { label: "鹿谷鄉銘恩堂", type: "page", slug: "memorial" },
        { label: "相關連結", type: "page", slug: "links" },
        { label: "常見問題", type: "page", slug: "faq" },
        {
          label: "公職人員利益衝突迴避法身分關係公開專區",
          type: "page",
          slug: "conflict",
        },
      ],
    },
    {
      label: "代表會",
      type: "section",
      slug: "council",
      children: [
        { label: "鄉民代表會", type: "page", slug: "intro" },
        { label: "出國考察報告", type: "page", slug: "reports" },
        { label: "代表會活動", type: "page", slug: "events" },
        { label: "會議資訊", type: "page", slug: "meetings" },
      ],
    },
    {
      label: "線上服務交流",
      type: "section",
      slug: "online",
      children: [
        { label: "問卷調查", type: "page", slug: "surveys" },
        { label: "線上投票", type: "page", slug: "votes" },
        { label: "表單下載", type: "page", slug: "downloads" },
        { label: "活動報名", type: "page", slug: "registrations" },
        { label: "路燈報修", type: "link", url: "https://lamp.example.com" },
        { label: "道路報修", type: "page", slug: "road-repair" },
        { label: "反射鏡報修", type: "page", slug: "mirror-repair" },
        { label: "災害通報", type: "page", slug: "disaster-report" },
        { label: "災害通報查詢", type: "page", slug: "disaster-query" },
      ],
    },
  ];

  // 遞迴補齊欄位與 id
  const enrich = (items, parentId = "") =>
    items.map((it) => ({
      id: cryptoRandomId(),
      label: it.label,
      type: it.type || "page",
      slug: it.slug || "",
      url: it.url || "",
      visible: it.visible !== false,
      blank: !!it.blank,
      seo: { title: "", desc: "", keywords: [] },
      parentId,
      children: it.children ? enrich(it.children) : [],
    }));
  const full = enrich(seed);
  localStorage.setItem(LS_KEY, JSON.stringify(full));
}

function cryptoRandomId() {
  // 瀏覽器都有 crypto；如在部分環境取不到，退回 Math.random
  try {
    return (
      "n_" +
      Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return "n_" + Math.random().toString(36).slice(2, 10);
  }
}

/* ---------- 載入/儲存 ---------- */
async function reload() {
  loading.value = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    tree.value = raw ? JSON.parse(raw) : [];
    // 預設選第一個
    if (!activeId.value && tree.value[0]) activeId.value = tree.value[0].id;
  } finally {
    loading.value = false;
  }
}
async function save() {
  saving.value = true;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(tree.value));
    ElMessage.success("已儲存");
  } finally {
    saving.value = false;
  }
}

/* ---------- Tree 操作 ---------- */
const treeRef = ref();

function allowDrop(draggingNode, dropNode, type) {
  // 不允許把父丟到子（循環）；ElTree 會做基本保護，這裡主要限制：link 不可有子
  if (type === "inner" && dropNode.data.type === "link") return false;
  return true;
}

function onNodeClick(data) {
  activeId.value = data.id;
}

function onNodeDrop() {
  // 拖曳結束後，重新同步 parentId（ElTree 只改 children）
  resyncParentIds(tree.value, "");
}

function resyncParentIds(list, pid) {
  for (const n of list) {
    n.parentId = pid || "";
    if (n.children?.length) resyncParentIds(n.children, n.id);
  }
}

function addRoot() {
  const n = newNode();
  tree.value.push(n);
  activeId.value = n.id;
}
function addSibling(node, data) {
  const parent = node.parent;
  const arr = parent?.data?.children || tree.value;
  const idx = arr.findIndex((x) => x.id === data.id);
  const n = newNode();
  arr.splice(idx + 1, 0, n);
  resyncParentIds(tree.value, "");
  activeId.value = n.id;
}
function addChild(data) {
  if (!data.children) data.children = [];
  if (data.type === "link") {
    ElMessage.warning("外部連結不可新增子層");
    return;
  }
  const n = newNode();
  data.children.push(n);
  resyncParentIds(tree.value, "");
  activeId.value = n.id;
}
async function removeNode(node, data) {
  await ElMessageBox.confirm(`確定刪除「${data.label}」？`, "提示", { type: "warning" });
  const parent = node.parent;
  const arr = parent?.data?.children || tree.value;
  const idx = arr.findIndex((x) => x.id === data.id);
  if (idx >= 0) arr.splice(idx, 1);
  activeId.value = "";
}

function newNode() {
  return {
    id: cryptoRandomId(),
    label: "未命名節點",
    type: "page",
    slug: "",
    url: "",
    visible: true,
    blank: false,
    seo: { title: "", desc: "", keywords: [] },
    parentId: "",
    children: [],
  };
}

/* ---------- 搜尋/展開 ---------- */
function filterNode(value, data) {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    data.label.toLowerCase().includes(v) || previewPath(data.id).toLowerCase().includes(v)
  );
}
function expandAll(isOpen) {
  const t = treeRef.value;
  if (!t) return;
  const walker = (nodes) => {
    nodes.forEach((n) => {
      t.setExpanded(n, isOpen);
      if (n.childNodes?.length) walker(n.childNodes);
    });
  };
  walker(t.store.root.childNodes);
}

/* ---------- Path 預覽 ---------- */
function previewPath(id) {
  const chain = [];
  collectPath(tree.value, id, chain);
  const parts = chain
    .filter((x) => x.type !== "link")
    .map((x) => x.slug || slugify(x.label));
  return "/" + parts.join("/");
}
function collectPath(list, id, out, parentHit = false) {
  for (const n of list) {
    if (n.id === id || parentHit) {
      out.unshift(n);
      if (n.parentId) collectPath(list, n.parentId, out, false);
      return true;
    }
    if (n.children?.length) {
      const hit = collectPath(n.children, id, out, false);
      if (hit) return true;
    }
  }
  return false;
}
function slugify(s = "") {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}

/* ---------- 其他 ---------- */
function findById(list, id) {
  if (!id) return null;
  for (const n of list) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const f = findById(n.children, id);
      if (f) return f;
    }
  }
  return null;
}
function typeTagType(t) {
  if (t === "section") return "success";
  if (t === "link") return "warning";
  return ""; // page
}

/* ---------- 生命周期 ---------- */
onMounted(async () => {
  seedIfEmpty();
  await reload();
});
</script>

<style scoped>
/* 放大整棵樹的字級與每列高度（控制上下間距） */
.tree-xl {
  font-size: 16px; /* 手機字級 */
  --el-tree-node-content-height: 44px; /* 每個節點高度：預設約 26px，這裡放大 */
}

@media (min-width: 768px) {
  .tree-xl {
    font-size: 18px;
  } /* md 以上再放大 */
}

/* 讓展開箭頭也一起加大、垂直置中 */
:deep(.tree-xl .el-tree-node__content) {
  align-items: center;
}
:deep(.tree-xl .el-tree-node__expand-icon) {
  font-size: 18px;
}

/* 高亮的當前節點外觀（可保留更圓潤一些） */
:deep(.tree-xl .el-tree-node.is-current > .el-tree-node__content) {
  border-radius: 10px;
}

/* 調大右側卡片的基礎字級（僅影響右側表單，不影響其他區塊） */
.form-xl-card {
  font-size: 16px;
}
@media (min-width: 768px) {
  .form-xl-card {
    font-size: 18px;
  }
}

/* 表單標籤字級與右側間距 */
:deep(.form-xl .el-form-item__label) {
  font-size: 16px;
  font-weight: 600;
  padding-right: 14px;
}

/* 輸入框高度與字級（Element Plus v2 使用 wrapper） */
:deep(.form-xl .el-input__wrapper) {
  min-height: 44px; /* 欄位高度 */
  font-size: 16px; /* 文字大小（含 placeholder）*/
}

/* Radio/Checkbox 文字變大、間距拉開 */
:deep(.form-xl .el-radio__label),
:deep(.form-xl .el-checkbox__label) {
  font-size: 16px;
}
:deep(.form-xl .el-radio),
:deep(.form-xl .el-checkbox) {
  margin-right: 16px;
}

/* Switch 大小微調（已加 size="large"，如需更大可再調變數） */
:deep(.form-xl .el-switch--large) {
  --el-switch-width: 52px;
  --el-switch-height: 28px;
}

/* Divider 上下間距加大一點，讓版面更舒適 */
:deep(.form-xl .el-divider) {
  margin: 16px 0;
}

/* 等寬字體（路徑）放大一級以便閱讀 */
:deep(.form-xl .font-mono) {
  font-size: 16px;
}
</style>
