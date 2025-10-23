<template>
  <div class="p-2 md:p-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">推播管理</div>
      <div class="text-sm text-slate-500">共 {{ total }} 筆</div>
    </div>

    <el-card shadow="never" class="border! border-gray-200!">
      <el-form
        :inline="true"
        :model="query"
        label-width="84px"
        label-position="left"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 w-full"
      >
        <el-form-item label="推播時間" class="mb-0!">
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
            placeholder="推播名稱 / 內容 / 單位"
            clearable
            style="width: 260px"
            @keyup.enter="onSearch"
          />
        </el-form-item>

        <div class="flex ml-auto">
          <el-button type="primary" @click="onSearch">查詢</el-button>
          <el-button @click="resetQuery">重設</el-button>
          <el-button type="success" @click="openEditor()">新增推播</el-button>
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
        <el-table-column label="推播狀態" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusOf(row).type" effect="plain">{{
              statusOf(row).text
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="推播時間" width="220" align="center">
          <template #default="{ row }">
            <span>{{ fmt(row.pushAt, "YYYY-MM-DD HH-mm-ss") }}</span>
          </template>
        </el-table-column>

        <el-table-column label="推播名稱" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="text-slate-800 font-medium">{{ row.title }}</div>
          </template>
        </el-table-column>

        <el-table-column label="推播發布單位" width="160" align="center">
          <template #default="{ row }">
            <span class="text-slate-700">{{ row.dept }}</span>
          </template>
        </el-table-column>

        <el-table-column label="推播內容" min-width="300">
          <template #default="{ row }">
            <div
              class="text-sm text-slate-600 line-clamp-1 overflow-hidden text-ellipsis"
            >
              {{ row.desc }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="推播人數" width="160" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-2">
              <span>{{ row.pushCount ?? FAKE_TARGETS.length }}</span>
              <el-button link @click="downloadCsv(row)" aria-label="下載被推播清單">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="項目操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-2">
              <el-button size="small" @click="openEditor(row)">編輯</el-button>
              <el-button size="small" type="danger">刪除</el-button>
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
      v-model="editor.visible"
      :title="editor.isNew ? '新增推播' : '編輯推播'"
      width="720px"
      top="5vh"
    >
      <div class="p-2">
        <el-form
          :model="editor.form"
          :rules="rules"
          label-position="left"
          ref="formRef"
          label-width="96px"
          class="space-y-2"
        >
          <el-form-item label="推播名稱" prop="title">
            <el-input v-model="editor.form.title" placeholder="請輸入推播名稱" />
          </el-form-item>

          <el-form-item label="發布單位" prop="dept">
            <el-input v-model="editor.form.dept" placeholder="例如：民政課 / 觀光課" />
          </el-form-item>

          <el-form-item label="推播內容" prop="desc">
            <el-input
              v-model="editor.form.desc"
              type="textarea"
              :rows="4"
              placeholder="推播訊息內容"
            />
          </el-form-item>

          <!-- 新增：推播管道（單選） -->
          <el-form-item label="推播管道" prop="channel">
            <el-radio-group v-model="editor.form.channel">
              <el-radio label="email">LINE</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="推播時間" prop="pushAt">
            <el-date-picker
              v-model="editor.form.pushAt"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="選擇推播時間"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <div class="text-xs text-slate-500">
            {{ editor.form.enabled ? "此推播目前啟用" : "此推播目前停用" }}
          </div>
          <div class="flex gap-2">
            <el-button @click="editor.visible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="savePush">儲存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 需求實作重點
 * 1) 列表「推播時間」改為單一時間（pushAt），顯示格式：YYYY-MM-DD HH-mm-ss。
 * 2) 「推播名稱」只顯示靜態假資料的 title；移除原本 category/location/dept 的副標。
 * 3) 新增欄位「推播發布單位」（dept）。
 * 4) 新增欄位「推播內容」（desc），畫面限制一行省略。
 * 5) 「推播人數」右側下載按鈕，下載被推播對象清單（靜態假資料 FAKE_TARGETS）。
 * 6) 新增/編輯彈窗只保留：title、dept、desc、pushAt、enabled。
 */

import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import { Download } from "@element-plus/icons-vue";

/** 靜態假資料：被推播對象清單（下載 CSV 來源） */
const FAKE_TARGETS = [
  { id: "U001", name: "王小明", phone: "0912-345-678", email: "ming@example.com" },
  { id: "U002", name: "陳小華", phone: "0922-111-333", email: "hua@example.com" },
  { id: "U003", name: "林美麗", phone: "0933-222-444", email: "mei@example.com" },
  { id: "U004", name: "張大同", phone: "0955-666-777", email: "tong@example.com" },
  { id: "U005", name: "李小芳", phone: "0966-888-999", email: "fang@example.com" },
  { id: "U006", name: "吳阿豪", phone: "0977-000-111", email: "ahao@example.com" },
  { id: "U007", name: "周芷若", phone: "0988-222-333", email: "zr@example.com" },
  { id: "U008", name: "趙信", phone: "0911-555-444", email: "xin@example.com" },
  { id: "U009", name: "曾國城", phone: "0938-123-456", email: "cheng@example.com" },
  { id: "U010", name: "黃雅婷", phone: "0927-987-654", email: "ting@example.com" },
];

/** 假的推播標題 */
const PUSH_TITLES = [
  "停水通知：10/28 09:00-17:00 例行維修",
  "道路施工交管：中正路段 10/26",
  "登革熱防疫宣導：請加強孳清",
  "活動快訊：本週六親子健走",
  "災防演練：周五上午進行廣播測試",
  "垃圾清運提醒：連假前一天加班清運",
  "觀光訊息：楓紅季交通疏導",
];

/** 狀態 */
const query = reactive({ range: "", keyword: "" });
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]);
const loading = ref(false);
const saving = ref(false);

/** 本地儲存鍵 */
const LS_KEY = "push.list.v1";

/** 工具 */
const fmt = (v, f = "YYYY/MM/DD") => (v ? dayjs(v).format(f) : "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const nid = (p = "p") => `${p}_` + Math.random().toString(36).slice(2, 9);

/** 產生推播假資料（title、dept、desc、pushAt、pushCount） */
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  const base = dayjs().subtract(10, "day").hour(9).minute(0).second(0);
  const depts = ["民政課", "觀光課", "工務課", "社會課", "人文課"];
  const list = [];
  for (let i = 0; i < 16; i++) {
    const pushAt = base.add(i * 1.5, "day").add(i * 7, "minute");
    list.push({
      id: nid(),
      enabled: i % 5 !== 1,
      title: PUSH_TITLES[i % PUSH_TITLES.length],
      dept: depts[i % depts.length],
      desc:
        i % 2 === 0
          ? "請留意相關措施與交通引導，造成不便敬請見諒。"
          : "為維護公共安全與市容整潔，請配合執行。",
      pushAt: pushAt.format("YYYY-MM-DD HH:mm:ss"), // 存以冒號；列表顯示用 fmt 轉成 HH-mm-ss
      updatedAt: dayjs().toISOString(),
      pushCount: FAKE_TARGETS.length,
    });
  }
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/** 模擬 API */
const api = {
  async list() {
    await sleep(100);
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  },
  async saveOne(item) {
    await sleep(100);
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const i = arr.findIndex((x) => x.id === item.id);
    if (i === -1) arr.unshift(item);
    else arr[i] = item;
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    return true;
  },
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 推播狀態：未開始 / 已發送 */
function statusOf(row) {
  const now = dayjs();
  const t = row.pushAt ? dayjs(row.pushAt) : null;
  if (!t) return { text: "未開始", type: "warning" };
  return now.isBefore(t)
    ? { text: "未開始", type: "warning" }
    : { text: "已發送", type: "success" };
}

/** 列表載入 + 查詢 */
async function load() {
  loading.value = true;
  try {
    const raw = await api.list();
    const upgraded = raw.map(withDefaults);
    localStorage.setItem(LS_KEY, JSON.stringify(upgraded));
    all.value = upgraded;
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
    list = list.filter((x) => {
      const t = x.pushAt ? dayjs(x.pushAt) : null;
      return t ? !(t.isBefore(s) || t.isAfter(e)) : false;
    });
  }

  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) => `${x.title} ${x.desc} ${x.dept}`.toLowerCase().includes(k));
  }

  list.sort((a, b) => dayjs(b.pushAt).valueOf() - dayjs(a.pushAt).valueOf());

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

/* -------------- 推播編輯 -------------- */
const editor = reactive({
  visible: false,
  isNew: true,
  form: {
    id: "",
    enabled: true,
    title: "",
    dept: "",
    desc: "",
    pushAt: "",
    channel: "email", // 新增：推播管道
  },
});
const formRef = ref(null);

const rules = {
  title: [{ required: true, message: "請輸入推播名稱", trigger: "blur" }],
  dept: [{ required: true, message: "請填寫發布單位", trigger: "blur" }],
  desc: [{ required: true, message: "請輸入推播內容", trigger: "blur" }],
  pushAt: [{ required: true, message: "請選擇推播時間", trigger: "change" }],
  channel: [{ required: true, message: "請選擇推播管道", trigger: "change" }], // 新增
};

function emptyPush() {
  const d = dayjs().add(1, "hour").second(0);
  return {
    id: nid(),
    enabled: true,
    title: "",
    dept: "",
    desc: "",
    pushAt: d.format("YYYY-MM-DD HH:mm:ss"),
    channel: "email", // 新增
  };
}

function openEditor(row) {
  editor.isNew = !row;
  editor.form = row ? clone(row) : emptyPush();
  editor.visible = true;
}

async function savePush() {
  const f = editor.form;
  await formRef.value?.validate().catch(() => {});
  if (!f.title?.trim()) return ElMessage.error("請輸入推播名稱");
  if (!f.dept?.trim()) return ElMessage.error("請填寫發布單位");
  if (!f.desc?.trim()) return ElMessage.error("請輸入推播內容");
  if (!f.pushAt) return ElMessage.error("請選擇推播時間");

  if (!Number.isFinite(f.pushCount)) f.pushCount = FAKE_TARGETS.length;
  f.updatedAt = dayjs().toISOString();

  saving.value = true;
  try {
    await api.saveOne(clone(f));
    ElMessage.success("已儲存推播");
    editor.visible = false;
    await load();
  } finally {
    saving.value = false;
  }
}

function withDefaults(x) {
  const y = { ...x };
  if (!Number.isFinite(y.pushCount)) y.pushCount = FAKE_TARGETS.length;
  return y;
}

/** 下載 CSV（內容使用 FAKE_TARGETS；筆數 = row.pushCount） */
function downloadCsv(row) {
  const count = Number(row?.pushCount) || FAKE_TARGETS.length;
  const data = FAKE_TARGETS.slice(0, Math.max(1, Math.min(count, FAKE_TARGETS.length)));
  const header = ["編號", "姓名", "手機號碼", "郵箱"];
  const lines = [header.join(",")].concat(
    data.map((r) => [r.id, r.name, r.phone, r.email].map(escapeCsv).join(","))
  );
  const csv = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = `${row?.title || "推播"}_被推播清單.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function escapeCsv(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** lifecycle */
onMounted(async () => {
  seedIfEmpty();
  await load();
});
</script>

<style scoped>
:deep(.table-header) {
  background-color: #0f766e !important;
  color: #fff !important;
  font-weight: 600;
}
</style>
