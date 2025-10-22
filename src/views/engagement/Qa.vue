<template>
  <div class="p-2 md:p-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">表單下載</div>
      <div class="text-sm text-slate-500">目前分頁：{{ currentTab.label }}</div>
    </div>

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
          <el-button type="primary" @click="onSearch">查詢</el-button>
          <el-button @click="resetQuery">重設</el-button>
          <el-button type="success" @click="openCreate">新增</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="border! border-gray-200!">
      <el-table
        :data="rows"
        v-loading="loading"
        header-cell-class-name="table-header"
        style="width: 100%"
      >
        <el-table-column label="分類名稱" width="200">
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

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
              <el-button link type="danger" @click="onRemove(row)">刪除</el-button>
              <el-button link type="success" @click="onDownload(row)">下載</el-button>
            </div>
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

    <el-dialog
      v-model="visible"
      :title="isEditing ? '編輯文章' : '新增文章'"
      width="640px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="84px"
        class="space-y-2"
      >
        <el-form-item label="分類名稱" prop="group">
          <el-select v-model="form.group" placeholder="請選擇分類" style="width: 100%">
            <el-option v-for="c in CATS" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="標題" prop="title">
          <el-input v-model="form.title" placeholder="請輸入標題" />
        </el-form-item>
        <el-form-item label="簡介" prop="summary">
          <el-input v-model="form.summary" placeholder="請輸入簡介" />
        </el-form-item>
        <el-form-item label="內容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="請輸入內容"
          />
        </el-form-item>
        <el-form-item label="發布單位" prop="dept">
          <el-input v-model="form.dept" placeholder="請輸入發布單位" />
        </el-form-item>
        <el-form-item label="發布日期" prop="publishAt">
          <el-date-picker
            v-model="form.publishAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="選擇日期"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="onSubmit">{{
            isEditing ? "更新" : "新增"
          }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 變更說明：
 * - 新增 CATS（分類清單）＝依你的截圖：最新消息、出國考察報告、公職人員利益衝突迴避法涉及關係公開專區
 * - 假資料 seed：group 改為從 CATS 輪替指派，而非固定「政策相關」
 * - 表單新增「分類名稱」的下拉選單（el-select），rules 加入 group 必填
 * - 新增/編輯時會保存 group，列表直接顯示 row.group
 * - onDownload() 保持下載純文字檔做法（無套件、跨瀏覽器）
 */
import { ref, reactive, computed, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";

/** 分類清單（依截圖） */
const CATS = ["最新消息", "出國考察報告", "公職人員利益衝突迴避法涉及關係公開專區"];

/** Tab（保留） */
const TABS = [
  { key: "plan", label: "施政計畫" },
  { key: "lawrev", label: "法規增修" },
  { key: "policy", label: "政策宣導" },
  { key: "lobby", label: "遊說法專區" },
  { key: "lawadv", label: "法規宣導" },
];

const active = ref("plan");
const currentTab = computed(() => TABS.find((t) => t.key === active.value) || TABS[0]);

/** 查詢、分頁、資料 */
const query = reactive({ range: "", keyword: "" });
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]);
const loading = ref(false);

/** 新增/編輯彈窗 */
const visible = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const formRef = ref();
const form = reactive({
  id: "",
  tab: "",
  group: CATS[0], // 預設用第一個分類
  subcat: "",
  title: "",
  summary: "",
  content: "",
  dept: "",
  publishAt: dayjs().format("YYYY-MM-DD"),
  views: 0,
});

/** 表單驗證 */
const rules = {
  group: [{ required: true, message: "請選擇分類", trigger: "change" }],
  title: [{ required: true, message: "請填寫標題", trigger: "blur" }],
  summary: [{ required: true, message: "請填寫簡介", trigger: "blur" }],
  content: [{ required: true, message: "請填寫內容", trigger: "blur" }],
  dept: [{ required: true, message: "請填寫發布單位", trigger: "blur" }],
  publishAt: [{ required: true, message: "請選擇日期", trigger: "change" }],
};

const LS_KEY = "policies.plain.v1";

/** 工具 */
const fmtDate = (v, fmt = "YYYY/MM/DD") => (v ? dayjs(v).format(fmt) : "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const nid = () => "p_" + Math.random().toString(36).slice(2, 9);

/** 產生假資料（group 從 CATS 輪替） */
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;
  const base = dayjs("2023-01-01");
  const pool = [];
  const DEPTS = ["政風室", "秘書室", "人事室", "工務課", "清潔隊", "社會課"];
  let seq = 0; // 讓所有 tab 共用遞增索引，好平均覆蓋 CATS

  const make = (i, tabKey) => {
    const groupName = CATS[seq % CATS.length];
    seq++;
    return {
      id: nid(),
      tab: tabKey,
      group: groupName,
      subcat: TABS.find((t) => t.key === tabKey)?.label || "",
      title:
        ["年度施政計畫", "自治條例修正", "政策宣導專區", "遊說法資訊", "法規宣導案例"][
          i % 5
        ] + `（示例 ${i + 1}）`,
      summary: i % 2 === 0 ? "這是一段摘要文字，用於列表輔助說明。" : "",
      content:
        "這是示例內容。可在編輯時修改成實際文章內容。段落一。\n\n段落二：可輸入更長的文字，下載時會印在 TXT 中。",
      dept: DEPTS[i % DEPTS.length],
      publishAt: base.add(i * 17, "day").format("YYYY-MM-DD"),
      views: Math.floor(Math.random() * 900) + 120,
    };
  };

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
  async createOne(payload) {
    await sleep(80);
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    raw.push(payload);
    localStorage.setItem(LS_KEY, JSON.stringify(raw));
  },
  async updateOne(id, patch) {
    await sleep(80);
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const idx = raw.findIndex((x) => x.id === id);
    if (idx >= 0) {
      raw[idx] = { ...raw[idx], ...patch };
      localStorage.setItem(LS_KEY, JSON.stringify(raw));
    }
  },
  async removeOne(id) {
    await sleep(80);
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const next = raw.filter((x) => x.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
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
  if (Array.isArray(query.range) && query.range[0] && query.range[1]) {
    const [start, end] = query.range;
    const s = dayjs(start + " 00:00:00");
    const e = dayjs(end + " 23:59:59");
    list = list.filter(
      (x) => dayjs(x.publishAt).isAfter(s) && dayjs(x.publishAt).isBefore(e)
    );
  }
  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) =>
      `${x.title} ${x.summary} ${x.content} ${x.dept} ${x.subcat} ${x.group}`
        .toLowerCase()
        .includes(k)
    );
  }
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

/** 新增 / 編輯 */
function resetForm() {
  form.id = "";
  form.tab = active.value;
  form.group = CATS[0]; // 預設為第一個分類
  form.subcat = currentTab.value?.label || "";
  form.title = "";
  form.summary = "";
  form.content = "";
  form.dept = "";
  form.publishAt = dayjs().format("YYYY-MM-DD");
  form.views = Math.floor(Math.random() * 50) + 1;
}
function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  visible.value = true;
}
function openEdit(row) {
  isEditing.value = true;
  editingId.value = row.id;
  form.id = row.id;
  form.tab = row.tab;
  form.group = row.group; // 帶入分類
  form.subcat = row.subcat;
  form.title = row.title;
  form.summary = row.summary || "";
  form.content = row.content || "";
  form.dept = row.dept || "";
  form.publishAt = row.publishAt || dayjs().format("YYYY-MM-DD");
  form.views = row.views || 0;
  visible.value = true;
}
function onSubmit() {
  formRef.value?.validate(async (ok) => {
    if (!ok) return;
    if (isEditing.value && editingId.value) {
      await api.updateOne(editingId.value, { ...form });
      ElMessage.success("已更新");
    } else {
      const payload = {
        ...clone(form),
        id: nid(),
        tab: active.value,
        subcat: currentTab.value?.label || "",
      };
      await api.createOne(payload);
      ElMessage.success("已新增");
    }
    visible.value = false;
    await load();
  });
}

/** 刪除 */
async function onRemove(row) {
  try {
    await ElMessageBox.confirm(`確定要刪除「${row.title}」嗎？`, "提示", {
      type: "warning",
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
    });
    await api.removeOne(row.id);
    ElMessage.success("已刪除");
    await load();
  } catch {
    /* 取消 */
  }
}

/** 純文字下載（保留原有需求） */
function buildTxt(row) {
  const lines = [
    `標題：${row.title || ""}`,
    `分類：${row.group || ""}／${row.subcat || ""}`,
    `發布單位：${row.dept || ""}`,
    `發布日期：${fmtDate(row.publishAt, "YYYY/MM/DD")}`,
    ``,
    `簡介：`,
    `${row.summary || ""}`,
    ``,
    `內容：`,
    `${row.content || ""}`,
  ];
  return lines.join("\n");
}
function safeFilename(s) {
  const base = (s || "未命名").replace(/[\\/:*?"<>|]+/g, "_").trim();
  return base.slice(0, 80) || "未命名";
}
function onDownload(row) {
  const text = buildTxt(row);
  const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const datePart = dayjs(row.publishAt || new Date()).format("YYYYMMDD");
  a.href = url;
  a.download = `${safeFilename(row.title)}_${datePart}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// === 新增：一次性把舊的「政策相關」分類，平均改配到 CATS ===
function migrateLegacyGroups() {
  const rawStr = localStorage.getItem(LS_KEY);
  if (!rawStr) return;
  const arr = JSON.parse(rawStr);
  // 找出仍是舊分類的資料
  const legacyCount = arr.filter((x) => x.group === "政策相關").length;
  if (!legacyCount) return;

  let i = 0;
  for (const item of arr) {
    if (item.group === "政策相關") {
      // 依序指派到 CATS（例如：最新消息、出國考察報告、…）
      item.group = CATS[i % CATS.length];
      i++;
    }
  }
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

// === 調整：onMounted 時呼叫遷移（seed 之後、load 之前） ===
onMounted(async () => {
  seedIfEmpty(); // 若沒有資料才造資料
  migrateLegacyGroups(); // 有舊資料就把分類改掉
  await load(); // 重載列表
});
</script>

<style scoped>
:deep(.table-header) {
  background-color: #0f766e !important;
  color: #fff !important;
  font-weight: 600;
}
</style>
