<template>
  <div class="p-2 md:p-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">活動報名管理</div>
      <div class="text-sm text-slate-500">共 {{ total }} 筆</div>
    </div>

    <el-card shadow="never" class="border! border-gray-200!">
      <el-form
        :inline="true"
        :model="query"
        label-width="64px"
        label-position="left"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 w-full"
      >
        <el-form-item label="活動日期" class="mb-0!">
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
            placeholder="活動名稱 / 地點 / 單位"
            clearable
            style="width: 260px"
            @keyup.enter="onSearch"
          />
        </el-form-item>

        <div class="flex gap-2 ml-auto">
          <el-button type="primary" @click="onSearch">查詢</el-button>
          <el-button @click="resetQuery">重設</el-button>
          <el-button type="success" @click="openEditor()">新增活動報名</el-button>
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
        <el-table-column label="報名狀態" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusOf(row).type" effect="plain">{{
              statusOf(row).text
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="舉辦日期" width="220" align="center">
          <template #default="{ row }">
            <span v-if="row.eventEnd"
              >{{ fmt(row.eventStart) }} ～ {{ fmt(row.eventEnd) }}</span
            >
            <span v-else>{{ fmt(row.eventStart) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="活動名稱" min-width="360" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="text-slate-800 font-medium">{{ row.title }}</div>
            <div class="text-xs text-slate-500 line-clamp-1">
              {{ row.category }}・{{ row.location }}・{{ row.dept }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="報名時間" width="240" align="center">
          <template #default="{ row }">
            <span v-if="row.regEnd"
              >{{ fmt(row.regStart) }} ～ {{ fmt(row.regEnd) }}</span
            >
            <span v-else>無限制</span>
          </template>
        </el-table-column>

        <el-table-column label="項目操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-2">
              <el-button size="small" @click="openEditor(row)">編輯</el-button>
              <el-switch
                v-model="row.enabled"
                inline-prompt
                @change="toggleEnabled(row)"
              />
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

    <!-- 活動報名編輯彈窗（活動資訊表單） -->
    <el-dialog
      v-model="editor.visible"
      :title="editor.isNew ? '新增活動報名' : '編輯活動報名'"
      width="900px"
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
          <el-form-item label="活動名稱" prop="title">
            <el-input v-model="editor.form.title" placeholder="請輸入活動名稱" />
          </el-form-item>

          <el-form-item label="分類" prop="category">
            <el-select
              v-model="editor.form.category"
              placeholder="選擇分類"
              style="width: 280px"
            >
              <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>

          <el-form-item label="主辦單位" prop="dept">
            <el-input
              v-model="editor.form.dept"
              placeholder="例如：民政課 / 觀光課"
              style="width: 280px"
            />
          </el-form-item>

          <el-form-item label="地點" prop="location">
            <el-input
              v-model="editor.form.location"
              placeholder="例如：溪頭自然教育園區 / 鳳凰谷鳥園"
            />
          </el-form-item>

          <el-form-item label="名額">
            <el-input-number v-model="editor.form.quota" :min="1" :max="5000" />
          </el-form-item>

          <!-- 每人限報（單獨一列） -->
          <el-form-item label="每人限報">
            <div class="flex items-center gap-2">
              <el-input-number v-model="editor.form.limitPerUser" :min="1" :max="10" />
              <span class="text-sm text-slate-600">場/次</span>
            </div>
          </el-form-item>

          <el-form-item label="費用">
            <div class="flex items-center gap-2">
              <el-switch v-model="editor.form.hasFee" />
              <el-input-number
                v-if="editor.form.hasFee"
                v-model="editor.form.fee"
                :min="0"
                :max="99999"
              />
              <span v-if="editor.form.hasFee">元</span>
            </div>
          </el-form-item>

          <el-form-item label="報名時間">
            <el-date-picker
              v-model="editor.regRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="開始"
              end-placeholder="結束（留空=無限制）"
              value-format="YYYY-MM-DD HH:mm"
              :default-time="['09:00:00', '17:00:00']"
              unlink-panels
            />
          </el-form-item>

          <el-form-item label="舉辦日期" prop="eventRange">
            <el-date-picker
              v-model="editor.eventRange"
              type="daterange"
              range-separator="至"
              start-placeholder="開始日期"
              end-placeholder="結束日期（單日可只選開始）"
              value-format="YYYY-MM-DD"
              unlink-panels
            />
          </el-form-item>

          <el-form-item label="啟用">
            <el-switch v-model="editor.form.enabled" />
          </el-form-item>

          <el-form-item label="聯絡資訊">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
              <el-input v-model="editor.form.contactName" placeholder="聯絡人姓名" />
              <el-input v-model="editor.form.contactPhone" placeholder="聯絡電話" />
            </div>
          </el-form-item>

          <el-form-item label="簡要說明">
            <el-input
              v-model="editor.form.summary"
              type="textarea"
              :rows="5"
              placeholder="顯示於列表，可留空"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <div class="text-xs text-slate-500">
            {{ editor.form.enabled ? "此活動目前啟用" : "此活動目前停用" }}
          </div>
          <div class="flex gap-2">
            <el-button @click="editor.visible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="saveEvent"
              >儲存</el-button
            >
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 功能差異：
 * - 換成「活動報名」資料模型：regStart/regEnd（報名時間）、eventStart/eventEnd（舉辦日期）、quota/候補/收費…等
 * - 表格欄位：報名狀態、舉辦日期、活動名稱、報名時間、項目操作（啟用切換、編輯）
 * - 鹿谷鄉情境：預設活動池 topicsLugu + 類別 CATEGORIES + 場地樣本
 */
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";

/** 類別／活動樣本（鹿谷） */
const CATEGORIES = [
  "觀光活動",
  "步道健行",
  "環境清潔",
  "親子教育",
  "樂齡關懷",
  "茶文化",
  "災防演練",
];
const LOCATIONS = [
  "溪頭自然教育園區",
  "鳳凰谷鳥園",
  "麒麟潭步道",
  "鳳凰谷步道入口",
  "鹿谷遊客中心",
  "小半天石馬公園",
];
const DEPTS = ["觀光課", "工務課", "民政課", "社會課", "人文課"];
const topicsLugu = [
  "溪頭夏日森呼吸親子闖關",
  "鳳凰谷鳥園保育宣導日",
  "麒麟潭環潭健走淨山",
  "茶文化體驗工作坊",
  "樂齡共餐暨健康講座",
  "小半天步道導覽體驗",
  "災害防救避難演練",
];

/** 狀態 */
const query = reactive({ range: "", keyword: "" });
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]);
const loading = ref(false);
const saving = ref(false);

/** 本地儲存鍵（獨立於投票/問卷） */
const LS_KEY = "event_regs.list.v1";

/** 工具 */
const fmt = (v, f = "YYYY/MM/DD") => (v ? dayjs(v).format(f) : "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const nid = (p = "e") => `${p}_` + Math.random().toString(36).slice(2, 9);

/** 產生鹿谷活動假資料 */
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  const base = dayjs().subtract(45, "day");
  const list = [];
  for (let i = 0; i < 16; i++) {
    const title = topicsLugu[i % topicsLugu.length];
    const cat = CATEGORIES[i % CATEGORIES.length];
    const startEvent = base.add(i * 5, "day");
    const endEvent = i % 3 === 0 ? null : startEvent.add(1 + (i % 2), "day"); // 單日或兩日
    const regStart = startEvent.subtract(20, "day").hour(9).minute(0);
    const regEnd = i % 4 === 0 ? null : startEvent.subtract(2, "day").hour(17).minute(0); // 有些無限制
    list.push({
      id: nid(),
      enabled: i % 5 !== 1,
      title,
      category: cat,
      dept: DEPTS[i % DEPTS.length],
      location: LOCATIONS[i % LOCATIONS.length],
      summary: i % 2 === 0 ? "歡迎鄉親踴躍報名參加。" : "",
      quota: 60 + (i % 4) * 20,
      waitlist: i % 3 === 0,
      limitPerUser: 1,
      hasFee: i % 6 === 0,
      fee: i % 6 === 0 ? 150 : 0,
      contactName: "活動承辦",
      contactPhone: "049-***-****",
      regStart: regStart.format("YYYY-MM-DD HH:mm"),
      regEnd: regEnd ? regEnd.format("YYYY-MM-DD HH:mm") : null,
      eventStart: startEvent.format("YYYY-MM-DD"),
      eventEnd: endEvent ? endEvent.format("YYYY-MM-DD") : null,
      updatedAt: dayjs().toISOString(),
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

/** 報名狀態（未開始 / 報名中 / 已截止 / 已結束） */
function statusOf(row) {
  const now = dayjs();
  const eventEnd = row.eventEnd
    ? dayjs(row.eventEnd).endOf("day")
    : dayjs(row.eventStart).endOf("day");
  if (now.isAfter(eventEnd)) return { text: "已結束", type: "info" };

  const regStart = row.regStart ? dayjs(row.regStart) : null;
  const regEnd = row.regEnd ? dayjs(row.regEnd) : null;

  if (!regStart && !regEnd) return { text: "報名中", type: "success" }; // 完全無限制
  if (regStart && now.isBefore(regStart)) return { text: "未開始", type: "warning" };
  if (regEnd && now.isAfter(regEnd)) return { text: "已截止", type: "danger" };
  return { text: "報名中", type: "success" };
}

/** 列表載入 + 查詢 */
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

  // 以活動舉辦日期（eventStart/eventEnd）當作篩選依據
  if (Array.isArray(query.range) && query.range[0] && query.range[1]) {
    const [start, end] = query.range;
    const s = dayjs(start + " 00:00:00");
    const e = dayjs(end + " 23:59:59");
    list = list.filter((x) => {
      const a = dayjs(x.eventStart);
      const b = x.eventEnd ? dayjs(x.eventEnd).endOf("day") : a.endOf("day");
      return !(b.isBefore(s) || a.isAfter(e));
    });
  }

  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) =>
      `${x.title} ${x.summary} ${x.location} ${x.dept} ${x.category}`
        .toLowerCase()
        .includes(k)
    );
  }

  // 預設依活動開始日新→舊
  list.sort((a, b) => dayjs(b.eventStart).valueOf() - dayjs(a.eventStart).valueOf());

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

/* -------------- 活動報名編輯 -------------- */
const editor = reactive({
  visible: false,
  isNew: true,
  regRange: "",
  regUnlimited: false,
  eventRange: "",
  form: {
    id: "",
    enabled: true,
    title: "",
    category: CATEGORIES[0],
    dept: "",
    location: "",
    quota: 50,
    waitlist: false,
    limitPerUser: 1,
    hasFee: false,
    fee: 0,
    regStart: null,
    regEnd: null,
    eventStart: "",
    eventEnd: null,
    contactName: "",
    contactPhone: "",
    summary: "",
  },
});
const formRef = ref(null);

const rules = {
  title: [{ required: true, message: "請輸入活動名稱", trigger: "blur" }],
  category: [{ required: true, message: "請選擇分類", trigger: "change" }],
  dept: [{ required: true, message: "請填寫主辦單位", trigger: "blur" }],
  location: [{ required: true, message: "請填寫地點", trigger: "blur" }],
  eventRange: [{ validator: validateEventRange, trigger: "change" }],
};
function validateEventRange(_r, _v, cb) {
  if (!editor.eventRange || !editor.eventRange[0]) return cb(new Error("請選擇舉辦日期"));
  cb();
}

function emptyEvent() {
  const d = dayjs();
  return {
    id: nid(),
    enabled: true,
    title: "",
    category: CATEGORIES[0],
    dept: "",
    location: "",
    quota: 50,
    waitlist: false,
    limitPerUser: 1,
    hasFee: false,
    fee: 0,
    regStart: d.add(1, "day").hour(9).minute(0).format("YYYY-MM-DD HH:mm"),
    regEnd: d.add(15, "day").hour(17).minute(0).format("YYYY-MM-DD HH:mm"),
    eventStart: d.add(20, "day").format("YYYY-MM-DD"),
    eventEnd: null,
    contactName: "",
    contactPhone: "",
    summary: "",
  };
}

function openEditor(row) {
  editor.isNew = !row;
  const base = row ? clone(row) : emptyEvent();
  editor.form = base;
  editor.regUnlimited = !base.regEnd && !base.regStart ? true : false;
  editor.regRange =
    base.regEnd || base.regStart ? [base.regStart, base.regEnd] : ["", ""];
  editor.eventRange = base.eventEnd
    ? [base.eventStart, base.eventEnd]
    : [base.eventStart, ""];
  editor.visible = true;
}

async function saveEvent() {
  const f = editor.form;
  await formRef.value?.validate().catch(() => {});
  if (!f.title?.trim()) return ElMessage.error("請輸入活動名稱");
  if (!f.dept?.trim()) return ElMessage.error("請填寫主辦單位");
  if (!f.location?.trim()) return ElMessage.error("請填寫地點");
  if (!Number.isFinite(f.quota) || f.quota < 1) return ElMessage.error("名額需大於 0");

  // 舉辦日期
  if (!editor.eventRange || !editor.eventRange[0])
    return ElMessage.error("請選擇舉辦日期");
  f.eventStart = editor.eventRange[0];
  f.eventEnd = editor.eventRange[1] || null;

  // 報名時間
  if (editor.regUnlimited) {
    f.regStart = null;
    f.regEnd = null;
  } else {
    if (!editor.regRange || !editor.regRange[0] || !editor.regRange[1]) {
      return ElMessage.error("請選擇報名時間區間，或勾選『無限制』");
    }
    f.regStart = editor.regRange[0];
    f.regEnd = editor.regRange[1];
  }

  f.updatedAt = dayjs().toISOString();

  saving.value = true;
  try {
    await api.saveOne(clone(f));
    ElMessage.success("已儲存活動報名");
    editor.visible = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(row) {
  row.enabled = !!row.enabled;
  await api.saveOne(clone(row));
  ElMessage.success(row.enabled ? "已啟用" : "已停用");
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
