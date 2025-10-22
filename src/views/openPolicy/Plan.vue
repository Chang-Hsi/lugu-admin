<template>
  <div class="p-2 md:p-4 space-y-4">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">政策相關</div>
      <div class="text-sm text-slate-500">目前分頁：{{ currentTab.label }}</div>
    </div>

    <!-- 綠色 TabBar -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="t in TABS"
        :key="t.key"
        @click="switchTab(t.key)"
        :class="[
          'px-4 h-10 rounded-md text-white font-semibold shadow',
          active === t.key ? 'bg-emerald-700' : 'bg-emerald-600/90 hover:bg-emerald-700',
        ]"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 篩選列 -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-form
        :inline="true"
        :model="query"
        size=""
        label-width="64px"
        label-position="left"
        class="flex flex-wrap items-center gap-x-3 gap-y-2"
      >
        <el-form-item label="日期" class="mb-0!">
          <el-date-picker
            v-model="query.range"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
          />
        </el-form-item>

        <el-form-item label="關鍵字" class="mb-0!">
          <el-input
            v-model="query.keyword"
            placeholder="標題 / 內文 / 關鍵字"
            clearable
            style="width: 260px"
            @keyup.enter="onSearch"
          />
        </el-form-item>

        <div class="flex gap-2 ml-auto">
          <el-button type="primary" size="" @click="onSearch">查詢</el-button>
          <el-button size="" @click="resetQuery">重設</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 列表（Element Admin 風格：卡片 + 邊框表格 + 固定表頭色） -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-table
        :data="rows"
        v-loading="loading"
        border
        header-cell-class-name="table-header"
        style="width: 100%"
      >
        <el-table-column label="分類名稱" width="160">
          <template #default="{ row }">
            <div class="font-medium">{{ row.group }}</div>
            <div class="text-xs text-slate-500">{{ row.subcat }}</div>
          </template>
        </el-table-column>

        <el-table-column label="標題" min-width="360" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="text-slate-800">{{ row.title }}</div>
            <div class="text-xs text-slate-500 line-clamp-1" v-if="row.summary">
              {{ row.summary }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="發布單位" width="120" prop="dept" />
        <el-table-column label="發布日期" width="130">
          <template #default="{ row }">{{
            fmtDate(row.publishAt, "YYYY/MM/DD")
          }}</template>
        </el-table-column>
        <el-table-column label="點閱率" width="100" align="center" prop="views" />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import dayjs from "dayjs";

/** Tab 定義（依你的截圖） */
const TABS = [
  { key: "plan", label: "施政計畫" },
  { key: "lawrev", label: "法規增修" },
  { key: "policy", label: "政策宣導" },
  { key: "lobby", label: "遊說法專區" },
  { key: "lawadv", label: "法規宣導" },
];

/** 狀態 */
const active = ref("plan");
const currentTab = computed(() => TABS.find((t) => t.key === active.value) || TABS[0]);

/** 查詢、分頁、資料 */
const query = reactive({ range: "", keyword: "" });
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]); // 目前分頁的所有資料
const loading = ref(false);

/** 本地儲存鍵 */
const LS_KEY = "policies.plain.v1";

/** 工具 */
const fmtDate = (v, fmt = "YYYY/MM/DD") => (v ? dayjs(v).format(fmt) : "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const nid = () => "p_" + Math.random().toString(36).slice(2, 9);

/** 產生假資料（首次） */
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;
  const base = dayjs("2023-01-01");
  const pool = [];
  const DEPTS = ["政風室", "秘書室", "人事室", "工務課", "清潔隊", "社會課"];
  const make = (i, tabKey) => ({
    id: nid(),
    tab: tabKey, // 對應 TABS.key
    group: "政策相關",
    subcat: TABS.find((t) => t.key === tabKey)?.label || "",
    title:
      ["年度施政計畫", "自治條例修正", "政策宣導專區", "遊說法資訊", "法規宣導案例"][
        i % 5
      ] + `（示例 ${i + 1}）`,
    summary: i % 2 === 0 ? "這是一段摘要文字，用於列表輔助說明與 SEO。" : "",
    dept: DEPTS[i % DEPTS.length],
    publishAt: base.add(i * 17, "day").format("YYYY-MM-DD"),
    views: Math.floor(Math.random() * 900) + 120,
  });
  // 每個 tab 造 18 筆
  for (const t of TABS) {
    for (let i = 0; i < 18; i++) pool.push(make(i, t.key));
  }
  localStorage.setItem(LS_KEY, JSON.stringify(pool));
}

/** 模擬 API */
const api = {
  async listByTab(tab) {
    await sleep(120);
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    return raw.filter((x) => x.tab === tab);
  },
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 載入 + 查詢 */
async function switchTab(tabKey) {
  active.value = tabKey;
  page.index = 1;
  await load();
}
async function load() {
  loading.value = true;
  try {
    all.value = await api.listByTab(active.value);
    applyQuery();
  } finally {
    loading.value = false;
  }
}
function applyQuery() {
  let list = clone(all.value);
  // 日期
  if (Array.isArray(query.range) && query.range[0] && query.range[1]) {
    const [start, end] = query.range;
    const s = dayjs(start + " 00:00:00");
    const e = dayjs(end + " 23:59:59");
    list = list.filter(
      (x) => dayjs(x.publishAt).isAfter(s) && dayjs(x.publishAt).isBefore(e)
    );
  }
  // 關鍵字：標題 / 摘要 / 部分欄位
  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) =>
      `${x.title} ${x.summary} ${x.dept} ${x.subcat}`.toLowerCase().includes(k)
    );
  }
  // 排序：日期新→舊
  list.sort((a, b) => dayjs(b.publishAt).valueOf() - dayjs(a.publishAt).valueOf());

  total.value = list.length;
  const start = (page.index - 1) * page.size;
  rows.value = list.slice(start, start + page.size);
}
function onSearch() {
  page.index = 1;
  applyQuery();
}
function resetQuery() {
  query.range = "";
  query.keyword = "";
  onSearch();
}

/** lifecycle */
onMounted(async () => {
  seedIfEmpty();
  await load();
});
</script>

<style scoped>
/* ElementAdmin 風格：表頭深色、字白 */
:deep(.table-header) {
  background-color: #0f766e !important; /* teal-700 */
  color: #fff !important;
  font-weight: 600;
}
</style>
