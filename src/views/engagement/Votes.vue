<template>
  <div class="p-2 md:p-4 space-y-2">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">投票管理</div>
      <div class="text-sm text-slate-500">共 {{ total }} 份</div>
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
            placeholder="投票議題 / 說明"
            clearable
            style="width: 260px"
            @keyup.enter="onSearch"
          />
        </el-form-item>

        <div class="flex gap-2 ml-auto">
          <el-button type="primary" @click="onSearch">查詢</el-button>
          <el-button @click="resetQuery">重設</el-button>
          <!-- 新增投票 -->
          <el-button type="success" @click="openEditor()">新增投票</el-button>
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
        <el-table-column label="編號" width="90" align="center">
          <template #default="{ $index }">
            {{ (page.index - 1) * page.size + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="投票議題" min-width="420" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="text-slate-800 font-medium">{{ row.title }}</div>
            <div class="text-xs text-slate-500 line-clamp-1" v-if="row.summary">
              {{ row.summary }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="日期" width="220" align="center">
          <template #default="{ row }">
            <span v-if="row.endAt">{{ fmt(row.startAt) }} ～ {{ fmt(row.endAt) }}</span>
            <span v-else>無限制</span>
          </template>
        </el-table-column>

        <el-table-column label="項目格式" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button @click="openEditor(row)">編輯投票</el-button>
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

    <!-- 投票編輯彈窗（單選題 + 拖曳排序） -->
    <el-dialog
      v-model="editor.visible"
      :title="editor.isNew ? '新增投票' : '編輯投票'"
      width="900px"
      top="5vh"
    >
      <el-form :model="editor.form" label-width="96px" class="space-y-2">
        <el-form-item label="投票議題">
          <el-input v-model="editor.form.title" placeholder="請輸入投票議題" />
        </el-form-item>

        <el-form-item label="簡要說明">
          <el-input
            v-model="editor.form.summary"
            type="textarea"
            :rows="2"
            placeholder="顯示於列表的簡短說明（可留空）"
          />
        </el-form-item>

        <el-form-item label="可填時間">
          <el-date-picker
            v-model="editor.range"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期（可留空代表無限制）"
            value-format="YYYY-MM-DD"
            unlink-panels
          />
          <el-checkbox v-model="editor.unlimited" class="ml-3">無限制</el-checkbox>
        </el-form-item>

        <el-divider>題目（單選題，拖曳排序）</el-divider>

        <!-- 題目清單可拖曳 -->
        <draggable
          v-model="editor.form.questions"
          item-key="id"
          handle=".q-drag"
          ghost-class="drag-ghost"
          animation="180"
        >
          <template #item="{ element: q, index: qi }">
            <el-card class="mb-3 border! border-gray-200!" shadow="never">
              <div class="flex items-start gap-3">
                <!-- 題目把手 -->
                <div class="q-drag drag-handle">
                  <el-icon><Rank /></el-icon>
                </div>

                <div class="flex-1 space-y-2">
                  <div class="flex items-center gap-2">
                    <div class="text-slate-500">{{ qi + 1 }}.</div>
                    <el-input v-model="q.title" placeholder="請輸入題目" class="flex-1" />
                    <el-switch v-model="q.required" active-text="必填" />
                    <el-button text type="danger" @click="removeQuestion(qi)"
                      >刪除題目</el-button
                    >
                  </div>

                  <!-- 選項清單可拖曳 -->
                  <div>
                    <div class="text-xs text-slate-500 mb-1">選項（至少 2 個）</div>
                    <draggable
                      v-model="q.options"
                      item-key="id"
                      handle=".o-drag"
                      ghost-class="drag-ghost"
                      animation="160"
                    >
                      <template #item="{ element: opt, index: oi }">
                        <div class="flex items-center gap-2 mb-2">
                          <!-- 選項把手 -->
                          <div class="o-drag drag-handle">
                            <el-icon><Rank /></el-icon>
                          </div>
                          <el-input
                            v-model="opt.text"
                            placeholder="選項文字"
                            class="flex-1"
                          />
                          <el-button text type="danger" @click="removeOption(qi, oi)"
                            >刪除</el-button
                          >
                        </div>
                      </template>
                    </draggable>
                    <el-button @click="addOption(qi)">新增選項</el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </template>
        </draggable>

        <div class="pt-1">
          <el-button type="primary" @click="addQuestion">新增題目</el-button>
        </div>
      </el-form>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <div class="text-xs text-slate-500">
            共 {{ editor.form.questions.length }} 題
          </div>
          <div class="flex gap-2">
            <el-button @click="editor.visible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="saveSurvey"
              >儲存</el-button
            >
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import draggable from "vuedraggable";
import { Rank } from "@element-plus/icons-vue";

/** 假資料標題 */
const titles = [
  "本所網站使用體驗調查",
  "路燈報修流程滿意度調查",
  "鄉政施政白皮書民意調查",
  "親子活動滿意度回饋",
  "觀光導覽與停車動線意見徵集",
  "災害通報系統使用情形調查",
  "關懷據點服務滿意度調查",
  "公共服務窗口滿意度調查",
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
const LS_KEY = "surveys.list.v2";

/** 工具 */
const fmt = (v, f = "YYYY/MM/DD") => (v ? dayjs(v).format(f) : "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const nid = (p = "s") => `${p}_` + Math.random().toString(36).slice(2, 9);

/** 產生假資料 */
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;

  const base = dayjs().subtract(120, "day");
  const list = [];
  for (let i = 0; i < 16; i++) {
    const title = titles[i % titles.length];
    const start = base.add(i * 10, "day");
    const end = i % 4 === 0 ? null : start.add(21 + (i % 3) * 7, "day");
    list.push({
      id: nid(),
      title,
      summary: i % 2 === 0 ? "此投票旨在蒐集中肯建議，協助優化公共服務。" : "",
      startAt: start.format("YYYY-MM-DD"),
      endAt: end ? end.format("YYYY-MM-DD") : null,
      questions: [
        {
          id: nid("q"),
          type: "single",
          title: "整體滿意度",
          required: true,
          options: [
            { id: nid("o"), text: "非常滿意" },
            { id: nid("o"), text: "滿意" },
            { id: nid("o"), text: "普通" },
            { id: nid("o"), text: "不滿意" },
          ],
        },
      ],
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

  if (Array.isArray(query.range) && query.range[0] && query.range[1]) {
    const [start, end] = query.range;
    const s = dayjs(start + " 00:00:00");
    const e = dayjs(end + " 23:59:59");
    list = list.filter((x) => {
      const a = dayjs(x.startAt);
      const b = x.endAt ? dayjs(x.endAt).endOf("day") : null;
      if (!b) return a.isBefore(e);
      return !(b.isBefore(s) || a.isAfter(e));
    });
  }

  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) => `${x.title} ${x.summary}`.toLowerCase().includes(k));
  }

  list.sort((a, b) => dayjs(b.startAt).valueOf() - dayjs(a.startAt).valueOf());

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

/* -------------- 投票編輯 -------------- */
const editor = reactive({
  visible: false,
  isNew: true,
  range: "",
  unlimited: false,
  form: {
    id: "",
    title: "",
    summary: "",
    startAt: "",
    endAt: null,
    questions: [],
  },
});

function emptySurvey() {
  return {
    id: nid(),
    title: "",
    summary: "",
    startAt: dayjs().format("YYYY-MM-DD"),
    endAt: null,
    questions: [],
    updatedAt: dayjs().toISOString(),
  };
}

function openEditor(row) {
  editor.isNew = !row;
  const base = row ? clone(row) : emptySurvey();
  editor.form = base;
  editor.unlimited = !base.endAt;
  editor.range = base.endAt ? [base.startAt, base.endAt] : [base.startAt, ""];
  editor.visible = true;
}

function addQuestion() {
  editor.form.questions.push({
    id: nid("q"),
    type: "single",
    title: "",
    required: false,
    options: [
      { id: nid("o"), text: "" },
      { id: nid("o"), text: "" },
    ],
  });
}
function removeQuestion(qi) {
  editor.form.questions.splice(qi, 1);
}
function addOption(qi) {
  editor.form.questions[qi].options.push({ id: nid("o"), text: "" });
}
function removeOption(qi, oi) {
  editor.form.questions[qi].options.splice(oi, 1);
}

async function saveSurvey() {
  const f = editor.form;
  if (!f.title?.trim()) return ElMessage.error("請輸入投票議題");
  if (editor.unlimited) {
    f.endAt = null;
    f.startAt = editor.range?.[0] || dayjs().format("YYYY-MM-DD");
  } else {
    if (!editor.range || !editor.range[0] || !editor.range[1]) {
      return ElMessage.error("請選擇可填時間區間，或勾選『無限制』");
    }
    f.startAt = editor.range[0];
    f.endAt = editor.range[1];
  }
  if (!Array.isArray(f.questions) || f.questions.length === 0) {
    return ElMessage.error("至少新增 1 題");
  }
  for (const q of f.questions) {
    if (!q.title?.trim()) return ElMessage.error("有題目尚未填寫題幹");
    const validOpts = (q.options || []).filter((o) => o.text?.trim());
    if (validOpts.length < 2) return ElMessage.error("每題至少需 2 個選項");
    q.options = validOpts;
  }

  saving.value = true;
  try {
    f.updatedAt = dayjs().toISOString();
    await api.saveOne(clone(f));
    ElMessage.success("投票已儲存");
    editor.visible = false;
    await load();
  } finally {
    saving.value = false;
  }
}

/** lifecycle */
onMounted(async () => {
  seedIfEmpty();
  await load();
});
</script>

<style scoped>
/* ElementAdmin 風格：表頭深色、字白（綠色主題） */
:deep(.table-header) {
  background-color: #0f766e !important;
  color: #fff !important;
  font-weight: 600;
}

/* 拖曳把手與拖曳時樣式 */
.drag-handle {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: #64748b; /* slate-500 */
  cursor: grab;
}
.drag-handle:active {
  cursor: grabbing;
}
.drag-ghost {
  opacity: 0.5;
}
</style>
