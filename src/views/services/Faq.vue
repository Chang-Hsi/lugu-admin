<template>
  <div class="p-2 md:p-4 space-y-2">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">常見問題（FAQ）後台管理</div>
      <div class="flex items-center gap-2">
        <el-tag type="info">共 {{ total }} 筆</el-tag>
        <!-- 開發用：重置假資料 -->
        <el-button size="small" @click="resetSeed">重置資料</el-button>
      </div>
    </div>

    <!-- 篩選列 -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-form
        :inline="true"
        :model="query"
        label-width="64px"
        label-position="left"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 w-full"
      >
        <el-form-item label="狀態">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="已回答" value="answered" />
            <el-option label="尚未回答" value="pending" />
          </el-select>
        </el-form-item>

        <el-form-item label="日期">
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

        <el-form-item label="關鍵字">
          <el-input
            v-model="query.keyword"
            placeholder="問題 / 回答 / 單位"
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

    <!-- 列表 -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-table
        :data="rows"
        v-loading="loading"
        header-cell-class-name="table-header"
        style="width: 100%"
      >
        <el-table-column label="問題" min-width="420" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="text-slate-800 font-medium">{{ row.title }}</div>
          </template>
        </el-table-column>

        <el-table-column label="狀態" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'answered' ? 'success' : 'warning'">
              {{ row.status === "answered" ? "已回答" : "尚未回答" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="回答摘要" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="text-slate-600">{{ brief(row.answer) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="發布單位" width="140" prop="dept" />
        <el-table-column label="發布日期" width="130">
          <template #default="{ row }">{{
            fmtDate(row.publishAt, "YYYY/MM/DD")
          }}</template>
        </el-table-column>
        <el-table-column label="最後更新" width="160">
          <template #default="{ row }">{{
            fmtDate(row.updatedAt, "YYYY/MM/DD HH:mm")
          }}</template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
              <el-button link type="danger" @click="onRemove(row)">刪除</el-button>
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

    <!-- 新增 / 編輯彈窗 -->
    <el-dialog
      v-model="visible"
      :title="isEditing ? '編輯常見問題' : '新增常見問題'"
      width="760px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
        class="space-y-2"
      >
        <el-form-item label="問題" prop="title">
          <el-input v-model="form.title" placeholder="請輸入問題（Q）" />
        </el-form-item>

        <el-form-item label="回答">
          <el-input
            v-model="form.answer"
            type="textarea"
            :rows="6"
            placeholder="請輸入回答（A），可留空，狀態設為『尚未回答』"
          />
        </el-form-item>

        <el-form-item label="狀態" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="answered">已回答</el-radio>
            <el-radio label="pending">尚未回答</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="發布單位" prop="dept">
          <el-input
            v-model="form.dept"
            placeholder="請輸入發布單位，例如：秘書室"
            style="width: 260px"
          />
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
 * FAQ 後台（Vue3 + Element Plus）
 * - 解決：seedIfEmpty 只在無資料時執行 → 提供 resetSeed() 一鍵重置
 * - 列表：問題 / 狀態 / 回答摘要 / 發布單位 / 發布日期 / 最後更新 / 操作
 * - 彈窗：問題、回答、狀態（answered/pending）、單位、日期
 */
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";

/** 本地儲存鍵（與你之前不同，避免舊資料衝突） */
const LS_KEY = "faqs.v1";

/** 工具 */
const fmtDate = (v, fmt = "YYYY/MM/DD") => (v ? dayjs(v).format(fmt) : "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const nid = () => "f_" + Math.random().toString(36).slice(2, 9);
const brief = (s = "", n = 60) => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
};

/** 狀態 */
const query = reactive({ range: "", keyword: "", status: "" });
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]);
const loading = ref(false);

/** 彈窗 */
const visible = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const formRef = ref();
const form = reactive({
  id: "",
  title: "",
  answer: "",
  status: "pending", // answered | pending
  dept: "",
  publishAt: dayjs().format("YYYY-MM-DD"),
  updatedAt: dayjs().toISOString(),
  answeredAt: null,
});

/** 表單驗證 */
const rules = {
  title: [{ required: true, message: "請填寫問題", trigger: "blur" }],
  status: [{ required: true, message: "請選擇狀態", trigger: "change" }],
  dept: [{ required: true, message: "請填寫發布單位", trigger: "blur" }],
  publishAt: [{ required: true, message: "請選擇日期", trigger: "change" }],
};

/** 假資料 seed（題目已依你需求） */
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;
  const base = dayjs().subtract(30, "day");
  const make = (i, title, answered = false) => ({
    id: nid(),
    title,
    answer: answered ? demoAnswers[i % demoAnswers.length] : "",
    status: answered ? "answered" : "pending",
    dept: DEPTS[i % DEPTS.length],
    publishAt: base.add(i, "day").format("YYYY-MM-DD"),
    updatedAt: base
      .add(i, "day")
      .hour(9 + (i % 6))
      .toISOString(),
    answeredAt: answered ? base.add(i, "day").hour(10).toISOString() : null,
  });

  const demoTitles = [
    "鹿谷鄉公所的地址是？",
    "鹿谷鄉有哪些熱門景點？",
    "如何申請垃圾大型廢棄物清運？",
    "路燈故障要向誰通報？",
    "戶籍遷入需要準備哪些文件？",
    "鹿谷公車時刻表在哪裡查詢？",
    "清境或溪頭路況資訊怎麼看？",
    "公所上班時間為何？週末有開嗎？",
  ];
  localStorage.setItem(
    LS_KEY,
    JSON.stringify([
      make(0, demoTitles[0], true),
      make(1, demoTitles[1], true),
      make(2, demoTitles[2], false),
      make(3, demoTitles[3], true),
      make(4, demoTitles[4], false),
      make(5, demoTitles[5], true),
      make(6, demoTitles[6], false),
      make(7, demoTitles[7], true),
    ])
  );
}

const DEPTS = ["秘書室", "民政課", "觀光課", "工務課"];
const demoAnswers = [
  "本所地址：南投縣鹿谷鄉中正路xx號。建議先電洽確認窗口。",
  "推薦溪頭自然教育園區、鳳凰谷鳥園、生態步道等景點。",
  "請至清潔隊服務台或線上申請表填寫，並備妥聯絡方式與物品照片。",
  "可使用官網路燈報修系統或撥打公所總機，將協助通報工務課。",
  "需攜帶身分證、印章及相關證明文件，詳情請參閱戶政單位公告。",
];

/** 模擬 API */
const api = {
  async list() {
    await sleep(100);
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  },
  async createOne(item) {
    await sleep(80);
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    arr.unshift(item);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  },
  async updateOne(id, patch) {
    await sleep(80);
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const i = arr.findIndex((x) => x.id === id);
    if (i >= 0) {
      arr[i] = { ...arr[i], ...patch };
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
    }
  },
  async removeOne(id) {
    await sleep(80);
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    localStorage.setItem(LS_KEY, JSON.stringify(arr.filter((x) => x.id !== id)));
  },
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 載入 + 查詢 */
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

  // 狀態
  if (query.status) list = list.filter((x) => x.status === query.status);

  // 日期
  if (Array.isArray(query.range) && query.range[0] && query.range[1]) {
    const [start, end] = query.range;
    const s = dayjs(start + " 00:00:00");
    const e = dayjs(end + " 23:59:59");
    list = list.filter(
      (x) => dayjs(x.publishAt).isAfter(s) && dayjs(x.publishAt).isBefore(e)
    );
  }

  // 關鍵字
  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) =>
      `${x.title} ${x.answer} ${x.dept}`.toLowerCase().includes(k)
    );
  }

  // 排序：發布日 新→舊，再以更新時間排序
  list.sort((a, b) => {
    const p = dayjs(b.publishAt).valueOf() - dayjs(a.publishAt).valueOf();
    return p !== 0 ? p : dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf();
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
  query.status = "";
  query.range = "";
  query.keyword = "";
  onSearch();
}

/** 新增 / 編輯 */
function resetForm() {
  form.id = "";
  form.title = "";
  form.answer = "";
  form.status = "pending";
  form.dept = "";
  form.publishAt = dayjs().format("YYYY-MM-DD");
  form.updatedAt = dayjs().toISOString();
  form.answeredAt = null;
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
  Object.assign(form, clone(row));
  visible.value = true;
}
function onSubmit() {
  formRef.value?.validate(async (ok) => {
    if (!ok) return;

    // 若設為已回答但沒有 answeredAt，自動帶入
    let answeredAt = form.answeredAt;
    if (form.status === "answered" && !answeredAt) answeredAt = dayjs().toISOString();
    if (form.status === "pending") answeredAt = null;

    const payload = {
      ...clone(form),
      updatedAt: dayjs().toISOString(),
      answeredAt,
    };

    if (isEditing.value && editingId.value) {
      await api.updateOne(editingId.value, payload);
      ElMessage.success("已更新");
    } else {
      payload.id = nid();
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

/** 一鍵重置假資料（解決你說的 seed 不更新問題） */
async function resetSeed() {
  await ElMessageBox.confirm("這會清除本頁所有本機資料並重新建立，確定嗎？", "提醒", {
    type: "warning",
  });
  localStorage.removeItem(LS_KEY);
  seedIfEmpty();
  await load();
  ElMessage.success("資料已重置");
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
