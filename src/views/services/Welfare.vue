<template>
  <div class="p-2 md:p-4 space-y-2">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">社會福利</div>
      <div class="flex items-center">
        <el-segmented
          v-model="mode"
          :options="[
            { label: '清單模式', value: 'table' },
            { label: '排序模式', value: 'sort' },
          ]"
        />
        <el-button @click="load" :loading="loading">重新整理</el-button>
        <el-button type="primary" @click="openMeta()">新增卡片</el-button>
      </div>
    </div>

    <!-- 篩選列（清單模式） -->
    <el-card v-if="mode === 'table'" shadow="never" class="border! border-gray-200!">
      <el-form
        :inline="true"
        :model="query"
        label-width="64px"
        class="flex flex-wrap items-center gap-y-2"
      >
        <el-form-item label="關鍵字" class="mb-0!">
          <el-input
            v-model="query.keyword"
            placeholder="標題 / slug / 內文"
            clearable
            style="width: 260px"
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="顯示" class="mb-0!">
          <el-select v-model="query.visible" style="width: 140px">
            <el-option label="全部" :value="''" />
            <el-option label="顯示" :value="true" />
            <el-option label="隱藏" :value="false" />
          </el-select>
        </el-form-item>
        <div class="ml-auto flex">
          <el-button type="primary" @click="onSearch">查詢</el-button>
          <el-button @click="resetQuery">重設</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 清單模式（表格顯示縮圖；頁面排序用上下移，避免跨頁拖曳的混亂） -->
    <el-card v-if="mode === 'table'" shadow="never" class="border! border-gray-200!">
      <el-table
        :data="rows"
        v-loading="loading"
        header-cell-class-name="table-header"
        style="width: 100%"
      >
        <el-table-column label="#" width="64" align="center">
          <template #default="{ $index }">{{
            (page.index - 1) * page.size + $index + 1
          }}</template>
        </el-table-column>

        <el-table-column label="縮圖" width="92" align="center">
          <template #default="{ row }">
            <img :src="displayIcon(row)" class="w-12 h-12 object-contain rounded" />
          </template>
        </el-table-column>

        <el-table-column label="卡片標題" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="font-medium text-slate-800">{{ row.label }}</div>
            <div class="text-xs text-slate-500">slug：{{ row.slug }}</div>
            <el-tag v-if="!row.visible" type="info" class="mt-1">隱藏</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="更新時間" width="180">
          <template #default="{ row }">{{ fmt(row.updatedAt) }}</template>
        </el-table-column>

        <el-table-column label="顯示" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.visible" @change="quickSave(row)" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openContent(row)">編輯內容</el-button>
            <el-button text @click="openMeta(row)">編輯卡片</el-button>
            <el-popconfirm title="確定刪除這張卡片？" @confirm="removeOne(row.id)">
              <template #reference>
                <el-button text type="danger">刪除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-3">
        <el-pagination
          background
          layout="prev, pager, next, jumper, ->, total"
          :page-size="page.size"
          :total="total"
          :current-page="page.index"
          @current-change="
            (p) => {
              page.index = p;
              applyQuery();
            }
          "
        />
      </div>
    </el-card>

    <!-- 排序模式（vuedraggable 拖曳，所見即所得；可一次大幅調整） -->
    <el-card v-else shadow="never" class="border! border-gray-200!">
      <div class="flex items-center justify-between mb-3">
        <div class="text-slate-600">拖曳卡片以調整順序（會影響前台顯示順序）</div>
        <div class="flex gap-2">
          <el-button @click="load">還原</el-button>
          <el-button type="primary" @click="saveOrder" :loading="saving"
            >儲存排序</el-button
          >
        </div>
      </div>

      <draggable
        v-model="all"
        item-key="id"
        handle=".drag"
        ghost-class="drag-ghost"
        animation="180"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        <template #item="{ element }">
          <div
            class="rounded-lg border border-gray-200 p-3 bg-white flex items-center gap-3 cursor-move drag"
          >
            <img :src="displayIcon(element)" class="w-12 h-12 object-contain rounded" />

            <div class="flex-1">
              <div class="font-medium">{{ element.label }}</div>
              <div class="text-xs text-slate-500">slug：{{ element.slug }}</div>
            </div>
            <el-tag v-if="!element.visible" type="info">隱藏</el-tag>
          </div>
        </template>
      </draggable>
    </el-card>

    <!-- 內容編輯（標題 + TinyEditor） -->
    <el-dialog
      v-model="editor.visible"
      width="960px"
      top="5vh"
      :title="`編輯內容：${editor.form.label}`"
    >
      <el-form :model="editor.form" label-width="72px">
        <el-form-item label="標題">
          <el-input v-model="editor.form.title" />
        </el-form-item>
        <el-form-item label="內文">
          <TinyEditor v-model="editor.form.content" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editor.visible = false">取消</el-button>
        <el-button type="primary" @click="saveContent" :loading="saving">儲存</el-button>
      </template>
    </el-dialog>

    <!-- 卡片資訊（圖片 URL + 其它 meta） -->
    <el-dialog
      v-model="meta.visible"
      width="560px"
      :title="meta.isNew ? '新增卡片' : '編輯卡片'"
    >
      <el-form :model="meta.form" label-width="90px">
        <el-form-item label="標題">
          <el-input v-model="meta.form.label" placeholder="顯示在卡片上的文字" />
        </el-form-item>
        <el-form-item label="slug">
          <el-input
            v-model="meta.form.slug"
            :disabled="!meta.isNew"
            placeholder="唯一英數-連字號"
          />
        </el-form-item>
        <el-form-item label="圖檔 URL">
          <el-input v-model="meta.form.iconUrl" placeholder="https://...（SVG 或 PNG）" />
          <div class="mt-2 flex items-center gap-3">
            <img :src="DEFAULT_ICON_URL" class="w-14 h-14 object-contain rounded" />
          </div>
        </el-form-item>
        <el-form-item label="顯示">
          <el-switch v-model="meta.form.visible" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="meta.visible = false">取消</el-button>
        <el-button type="primary" @click="saveMeta" :loading="saving">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import TinyEditor from "@/components/TinyEditor.vue";
import { ElMessage } from "element-plus";
import draggable from "vuedraggable";

const LS_KEY = "welfare.cards.v2"; // 新 key，避免吃到舊版 icon 欄位
const DEFAULT_ICON_URL = "https://api.iconify.design/material-symbols:map-pin-heart.svg";

const displayIcon = (item) => DEFAULT_ICON_URL;

const mode = ref("table");
const loading = ref(false);
const saving = ref(false);

const query = reactive({ keyword: "", visible: "" });
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]);

const fmt = (v) => (v ? dayjs(v).format("YYYY/MM/DD HH:mm") : "");
const nid = () => "w_" + Math.random().toString(36).slice(2, 9);
const clone = (o) => JSON.parse(JSON.stringify(o));

function seedIfEmpty() {
  if (localStorage.getItem(LS_KEY)) return;
  // 用 picsum 當臨時 icon，等美工 SVG 來再換
  const icon = (seed) => `https://picsum.photos/seed/${seed}/80/80`;
  const base = [
    { slug: "low-income", label: "低收入戶" },
    { slug: "childcare-subsidy", label: "中低托育養護補助" },
    { slug: "nhi", label: "全民健康保險" },
    { slug: "pension", label: "國民年金業務" },
    { slug: "disability", label: "身心障礙證明" },
    { slug: "legal", label: "法律諮詢" },
    { slug: "elderly", label: "中低老人生活補助" },
    { slug: "emergency-aid", label: "急難救助補助" },
    { slug: "safety-net", label: "強化社會安全網關懷救助" },
    { slug: "special-hardship-family", label: "特殊境遇家庭生活補助" },
    { slug: "community-mortuaries", label: "國民喪葬" },
    { slug: "community-development", label: "社區發展業務" },
    { slug: "food-bank", label: "食物銀行" },
    { slug: "low-income-cert", label: "中低收入戶證明" },
    { slug: "low-income-living", label: "中低收入戶生活補助" },
    { slug: "child-living", label: "兒少生活補助" },
    { slug: "elderly-disabled-iccard", label: "老人暨身心障礙乘車IC卡" },
    { slug: "form-download", label: "補助申請表下載" },
    { slug: "921-damage-proof", label: "九二一天然災害住宅受損證明申請書" },
    { slug: "home-safety-check", label: "脆弱族群居家防災檢視" },
    { slug: "elderly-care-allowance", label: "高齡者關懷及照護" },
    { slug: "crpd", label: "身心障礙者權利公約（CRPD）" },
    { slug: "disability-parking", label: "身障專用停車位申請" },
    { slug: "local-regs", label: "南投鹿谷各類補助辦法" },
  ];
  const lowIncomeContent = `
  <h3>申請資格：</h3>
  <ol>
    <li>早年離異或遠離家庭，對子女未盡扶養義務。</li>
    <li>家庭總收入平均每人每月低於最低生活費，財產未逾規定。</li>
    <li>設籍並實際居住於本縣，最近一年居住國內超過 183 日。</li>
  </ol>
  <h3>應計算人口範圍：</h3>
  <ol>
    <li>配偶</li><li>一親等直系血親</li><li>同戶籍或共同生活之其他直系血親</li><li>其他認列扶養親屬之納稅義務人</li>
  </ol>
  <h3>申請資料：</h3>
  <ul>
    <li>戶籍謄本或戶口名簿（含全家人口）</li>
    <li>切結書</li>
    <li>存摺影印本</li>
    <li>在學/在監/服役/重大傷病/身障手冊等證明</li>
  </ul>
  <h3>審核標準（摘錄）：</h3>
  <ul>
    <li>每人每月未超過最低生活費（108 年為 NT$12,388）。</li>
    <li>現金與投資每人每年未超過 NT$75,000。</li>
    <li>土地房屋等合計未超過 NT$3,500,000。</li>
  </ul>`;
  const now = dayjs().toISOString();
  const data = base.map((b, i) => ({
    id: nid(),
    slug: b.slug,
    label: b.label,
    iconUrl: "https://api.iconify.design/material-symbols:map-pin-heart.svg", // ← 圖片 URL
    visible: true,
    order: i + 1,
    title: b.label,
    content: b.slug === "low-income" ? lowIncomeContent : "<p>（請編輯內容）</p>",
    updatedAt: now,
  }));
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

const api = {
  async list() {
    await sleep(120);
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  },
  async saveAll(arr) {
    await sleep(120);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    return true;
  },
  async saveOne(item) {
    const arr = await this.list();
    const i = arr.findIndex((x) => x.id === item.id);
    if (i === -1) arr.push(item);
    else arr[i] = item;
    return this.saveAll(arr);
  },
  async remove(id) {
    const arr = await this.list();
    return this.saveAll(arr.filter((x) => x.id !== id));
  },
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function load() {
  loading.value = true;
  try {
    all.value = await api.list();
    applyQuery();
  } finally {
    loading.value = false;
  }
}
function applyQuery() {
  let list = clone(all.value);
  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) =>
      `${x.label} ${x.slug} ${x.title} ${x.content}`.toLowerCase().includes(k)
    );
  }
  if (query.visible !== "" && query.visible !== null && query.visible !== undefined) {
    list = list.filter((x) => !!x.visible === query.visible);
  }
  list.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf();
  });
  total.value = list.length;
  const start = (page.index - 1) * page.size;
  rows.value = list.slice(start, start + page.size);
}
function onSearch() {
  page.index = 1;
  applyQuery();
}
function resetQuery() {
  query.keyword = "";
  query.visible = "";
  onSearch();
}

/* 表格內「上移/下移」微調（跨頁避免直接拖曳造成混亂） */
function move(row, delta) {
  const idx = all.value.findIndex((x) => x.id === row.id);
  const j = idx + delta;
  if (j < 0 || j >= all.value.length) return;
  const tmp = all.value[idx].order;
  all.value[idx].order = all.value[j].order;
  all.value[j].order = tmp;
  all.value.sort((a, b) => a.order - b.order);
  applyQuery();
}

/* 排序模式儲存（vuedraggable 已直接改動 all 的順序） */
async function saveOrder() {
  all.value.forEach((x, i) => (x.order = i + 1));
  saving.value = true;
  try {
    await api.saveAll(clone(all.value));
    ElMessage.success("已儲存排序");
    applyQuery();
  } finally {
    saving.value = false;
  }
}

async function quickSave(row) {
  row.updatedAt = dayjs().toISOString();
  await api.saveOne(clone(row));
  ElMessage.success("已更新");
  applyQuery();
}
async function removeOne(id) {
  await api.remove(id);
  ElMessage.success("已刪除");
  await load();
}

/* 內容編輯（標題 + TinyEditor） */
const editor = reactive({ visible: false, form: {} });
function openContent(row) {
  editor.form = clone(row);
  if (!editor.form.title) editor.form.title = editor.form.label;
  editor.visible = true;
}
async function saveContent() {
  saving.value = true;
  try {
    editor.form.updatedAt = dayjs().toISOString();
    await api.saveOne(clone(editor.form));
    ElMessage.success("內容已儲存");
    editor.visible = false;
    await load();
  } finally {
    saving.value = false;
  }
}

/* 卡片 meta（含圖片 URL） */
const meta = reactive({ visible: false, isNew: true, form: {} });
function openMeta(row) {
  meta.isNew = !row;
  meta.form = row
    ? clone(row)
    : {
        id: nid(),
        slug: "",
        label: "",
        iconUrl: "",
        visible: true,
        order: (all.value.length || 0) + 1,
        title: "",
        content: "<p>（請編輯內容）</p>",
        updatedAt: dayjs().toISOString(),
      };
  // 讓輸入框也看到同一個 URL（若不想覆蓋既有資料就拿掉這行）
  meta.form.iconUrl = DEFAULT_ICON_URL;
  meta.visible = true;
}

async function saveMeta() {
  if (!meta.form.slug?.trim()) {
    ElMessage.error("請輸入 slug");
    return;
  }
  if (!/^[a-z0-9-]+$/.test(meta.form.slug)) {
    ElMessage.error("slug 只能小寫英數與 -");
    return;
  }
  if (!meta.form.label?.trim()) {
    ElMessage.error("請輸入標題");
    return;
  }
  if (!meta.form.iconUrl?.trim()) {
    ElMessage.error("請輸入圖檔 URL");
    return;
  }
  saving.value = true;
  try {
    meta.form.updatedAt = dayjs().toISOString();
    await api.saveOne(clone(meta.form));
    ElMessage.success("卡片已儲存");
    meta.visible = false;
    await load();
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  seedIfEmpty();
  await load();
});
</script>

<style scoped>
/* 綠色 Element-Admin 表頭 */
:deep(.table-header) {
  background-color: #0f766e !important;
  color: #fff !important;
  font-weight: 600;
}
/* 拖曳時的透明效果 */
.drag-ghost {
  opacity: 0.5;
}
</style>
