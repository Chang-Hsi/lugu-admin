<template>
  <div class="p-2 md:p-4 space-y-4">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">最新消息</div>
      <div class="flex items-center gap-2">
        <el-button @click="load" :loading="loading">重新整理</el-button>
        <el-button type="primary" @click="openEdit()">新增消息</el-button>
      </div>
    </div>

    <!-- 篩選列（正常尺寸） -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-form
        :inline="true"
        :model="query"
        label-width="56px"
        label-position="left"
        class="flex flex-wrap items-center gap-x-3 gap-y-2"
      >
        <el-form-item class="mb-0!">
          <el-input
            v-model="query.keyword"
            placeholder="標題 / 摘要 / 內文 / 標籤"
            clearable
            style="width: 260px"
            @keyup.enter="onSearch"
          />
        </el-form-item>

        <el-form-item class="mb-0!">
          <el-select v-model="query.dept" filterable style="width: 180px">
            <el-option label="全部" value="" />
            <el-option v-for="d in DEPTS" :key="d" :value="d" :label="d" />
          </el-select>
        </el-form-item>

        <el-form-item class="mb-0!">
          <el-select v-model="query.status" style="width: 140px">
            <el-option label="全部" value="" />
            <el-option
              v-for="s in STATUS_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item class="mb-0!">
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

        <el-form-item class="mb-0!">
          <el-select v-model="query.pin" style="width: 120px">
            <el-option label="全部" :value="''" />
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>

        <div class="flex gap-2 ml-auto">
          <el-button type="primary" @click="onSearch">查詢</el-button>
          <el-button @click="resetQuery">重設</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 工具列 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <el-button
          :disabled="!multipleSelection.length"
          @click="batchSetStatus('published')"
          >批次發布</el-button
        >
        <el-button
          :disabled="!multipleSelection.length"
          @click="batchSetStatus('disabled')"
          >批次下架</el-button
        >
        <el-popconfirm
          title="確定刪除所選項目？"
          confirm-button-text="刪除"
          cancel-button-text="取消"
          @confirm="batchRemove"
        >
          <template #reference>
            <el-button type="danger" :disabled="!multipleSelection.length"
              >批次刪除</el-button
            >
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- 列表（綠色主題表頭） -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-table
        :data="rows"
        v-loading="loading"
        border
        header-cell-class-name="table-header"
        @selection-change="(val) => (multipleSelection = val)"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column label="置頂" width="74" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.pin" @change="onTogglePin(row)" />
          </template>
        </el-table-column>

        <el-table-column label="標題" min-width="360" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-tag v-if="row.status === 'pending'" type="warning">待審</el-tag>
              <el-tag v-if="row.status === 'draft'">草稿</el-tag>
              <el-tag v-if="row.status === 'disabled'" type="info">下架</el-tag>
              <div class="font-medium text-slate-800">{{ row.title }}</div>
            </div>
            <div class="text-xs text-slate-500 line-clamp-1">{{ row.summary }}</div>
          </template>
        </el-table-column>

        <el-table-column label="課室" width="140" prop="dept" />

        <el-table-column label="發布日期" width="130">
          <template #default="{ row }">{{
            fmtDate(row.publishAt, "YYYY/MM/DD")
          }}</template>
        </el-table-column>

        <el-table-column label="建立時間" width="150">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="點閱" prop="views" width="90" align="center" />

        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button text @click="preview(row)">預覽</el-button>
            <el-button text type="primary" @click="openEdit(row)">編輯</el-button>
            <el-dropdown>
              <span class="el-dropdown-link">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="setStatus(row, 'published')"
                    >發布</el-dropdown-item
                  >
                  <el-dropdown-item @click="setStatus(row, 'disabled')"
                    >下架</el-dropdown-item
                  >
                  <el-dropdown-item divided>
                    <el-popconfirm
                      title="確定刪除此筆？"
                      confirm-button-text="刪除"
                      cancel-button-text="取消"
                      @confirm="removeOne(row.id)"
                    >
                      <template #reference>
                        <span class="text-red-600 cursor-pointer">刪除</span>
                      </template>
                    </el-popconfirm>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
              load();
            }
          "
        />
      </div>
    </el-card>

    <!-- 編輯彈窗 -->
    <el-dialog
      v-model="edit.visible"
      :title="edit.isNew ? '新增消息' : '編輯消息'"
      width="960px"
      top="5vh"
    >
      <el-form :model="edit.form" label-width="110px">
        <el-divider content-position="left">內容</el-divider>
        <el-form-item label="標題">
          <el-input v-model="edit.form.title" placeholder="請輸入標題" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input
            v-model="edit.form.summary"
            type="textarea"
            :rows="2"
            placeholder="列表與 SEO 使用，約 80〜120 字"
          />
        </el-form-item>
        <el-form-item label="內文">
          <TinyEditor v-model="edit.form.content" />
        </el-form-item>

        <el-form-item label="封面">
          <div class="flex items-center gap-2">
            <el-input
              v-model="edit.form.cover"
              placeholder="貼上圖片 URL（示意）"
              class="flex-1"
            />
            <img
              v-if="edit.form.cover"
              :src="edit.form.cover"
              class="w-24 h-16 object-cover rounded border"
            />
          </div>
        </el-form-item>

        <el-form-item label="外部連結">
          <el-input
            v-model="edit.form.externalLink"
            placeholder="https://example.com（可空白）"
          />
        </el-form-item>

        <el-form-item label="附件">
          <div class="w-full">
            <div class="flex justify-between items-center mb-2">
              <el-button @click="addAttachment">新增附件</el-button>
              <span class="text-xs text-slate-500">可拖曳排序</span>
            </div>
            <draggable
              v-model="edit.form.attachments"
              item-key="id"
              handle=".drag"
              ghost-class="opacity-50"
            >
              <template #item="{ element, index }">
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <div class="col-span-1 text-slate-400 drag cursor-move">≡</div>
                  <div class="col-span-4">
                    <el-input v-model="element.name" placeholder="檔名" />
                  </div>
                  <div class="col-span-6">
                    <el-input v-model="element.url" placeholder="https://..." />
                  </div>
                  <div class="col-span-1 text-right">
                    <el-button text type="danger" @click="removeAttachment(index)"
                      >刪除</el-button
                    >
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-form-item>

        <el-divider content-position="left">顯示與排程</el-divider>
        <el-form-item label="發布時間">
          <el-date-picker
            v-model="edit.form.publishAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="下架時間">
          <el-date-picker
            v-model="edit.form.expireAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
          />
        </el-form-item>
        <el-form-item label="置頂">
          <el-switch v-model="edit.form.pin" />
        </el-form-item>

        <el-divider content-position="left">分類與屬性</el-divider>
        <el-form-item label="發布單位">
          <el-select
            v-model="edit.form.dept"
            filterable
            placeholder="選擇課室"
            class="w-[260px]"
          >
            <el-option v-for="d in DEPTS" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="關鍵字">
          <el-select
            v-model="edit.form.keywords"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="輸入或選擇標籤"
            class="w-full"
          >
            <el-option v-for="k in KEYWORDS" :key="k" :label="k" :value="k" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">狀態</el-divider>
        <el-form-item label="狀態">
          <el-radio-group v-model="edit.form.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="pending">待審</el-radio>
            <el-radio label="published">已發布</el-radio>
            <el-radio label="disabled">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <div class="text-xs text-slate-500">
            建立：{{ fmtDate(edit.form.createdAt) || "-" }}　 更新：{{
              fmtDate(edit.form.updatedAt) || "-"
            }}
          </div>
          <div class="flex gap-2">
            <el-button @click="edit.visible = false">取消</el-button>
            <el-button type="primary" @click="saveEdit" :loading="saving">儲存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 預覽彈窗（前台風格示意） -->
    <el-dialog v-model="previewer.visible" title="預覽：最新消息" width="820px" top="5vh">
      <div class="space-y-3">
        <div class="text-xs text-slate-500">
          <span class="text-blue-600">首頁</span> /
          <span class="text-blue-600">熱門消息</span> / <span>最新消息</span>
        </div>
        <h2 class="text-2xl font-semibold">{{ previewer.data?.title }}</h2>
        <div class="text-xs text-slate-500 flex items-center gap-3">
          <span>發布單位：{{ previewer.data?.dept }}</span>
          <span>發布日期：{{ fmtDate(previewer.data?.publishAt) }}</span>
          <span>點閱：{{ previewer.data?.views }}</span>
          <el-button class="ml-auto" @click="printArea">列印</el-button>
          <div class="flex items-center gap-1">
            <span class="text-xs">字級：</span>
            <el-button @click="fontSize = 'text-sm'">小</el-button>
            <el-button @click="fontSize = 'text-base'">中</el-button>
            <el-button @click="fontSize = 'text-lg'">大</el-button>
          </div>
        </div>
        <div
          id="print-zone"
          :class="['prose max-w-none', fontSize]"
          v-html="previewer.data?.content"
        ></div>
        <div v-if="(previewer.data?.attachments || []).length" class="pt-2">
          <div class="font-semibold mb-1">附件下載</div>
          <ul class="list-disc pl-5">
            <li v-for="(att, i) in previewer.data.attachments" :key="i">
              <a class="text-blue-600 underline" :href="att.url" target="_blank">{{
                att.name
              }}</a>
            </li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewer.visible = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import draggable from "vuedraggable";
import TinyEditor from "@/components/TinyEditor.vue";

// ---- 常數 ----
const DEPTS = ["民政課", "社福課", "人事室", "秘書室", "主計室"];
const KEYWORDS = ["政策", "公告", "招募", "活動", "工程", "教育"];
const STATUS_OPTIONS = [
  { label: "草稿", value: "draft" },
  { label: "待審", value: "pending" },
  { label: "已發布", value: "published" },
  { label: "下架", value: "disabled" },
];

// ---- 本機儲存用 Key ----
const LS_KEY = "demo.latest.news.v1";

// ---- Query / 分頁 ----
const query = reactive({ keyword: "", dept: "", status: "", range: "", pin: "" });
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]);
const loading = ref(false);
const saving = ref(false);
let multipleSelection = ref([]);

// ---- 工具 ----
const fmtDate = (v, fmt = "YYYY/MM/DD HH:mm") => (v ? dayjs(v).format(fmt) : "");
const nowStr = () => dayjs().format("YYYY-MM-DD HH:mm:ss");
const nid = () => "n_" + Math.random().toString(36).slice(2, 9);
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// ---- 假資料初始化 ----
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;
  const seed = [];
  const base = dayjs();
  for (let i = 0; i < 23; i++) {
    seed.push({
      id: nid(),
      status: i % 7 === 0 ? "pending" : "published",
      title: `鹿谷鄉政訊息示例 ${i + 1}`,
      dept: DEPTS[i % DEPTS.length],
      category: "latest",
      summary: "這是一段摘要文字，示意前台列表與 SEO 描述使用。",
      content: `<p>這是<strong>示例內容</strong>第 ${
        i + 1
      } 則。可含連結、表格、清單等。</p>`,
      cover: i % 3 === 0 ? `https://picsum.photos/seed/${i}/320/200` : "",
      attachments:
        i % 4 === 0
          ? [{ id: nid(), name: "附件說明.pdf", url: "https://example.com/a.pdf" }]
          : [],
      externalLink: "",
      publishAt: base
        .subtract(i, "day")
        .hour(9)
        .minute(0)
        .second(0)
        .format("YYYY-MM-DD HH:mm:ss"),
      expireAt: null,
      pin: i % 8 === 0,
      keywords: [KEYWORDS[i % KEYWORDS.length]],
      views: Math.floor(Math.random() * 500) + 20,
      createdAt: base.subtract(i, "day").format("YYYY-MM-DD HH:mm:ss"),
      createdBy: "editorA",
      updatedAt: base.subtract(i, "day").add(2, "hour").format("YYYY-MM-DD HH:mm:ss"),
      updatedBy: "editorA",
      reviewLogs: [],
    });
  }
  localStorage.setItem(LS_KEY, JSON.stringify(seed));
}

// ---- 模擬 API ----
const api = {
  async list() {
    await sleep(120);
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  },
  async saveOne(item) {
    await sleep(120);
    const arr = await this.list();
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx === -1) arr.unshift(item);
    else arr[idx] = item;
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    return item;
  },
  async remove(ids) {
    await sleep(120);
    const arr = await this.list();
    const set = new Set(Array.isArray(ids) ? ids : [ids]);
    const next = arr.filter((x) => !set.has(x.id));
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    return true;
  },
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- 載入 + 查詢 ----
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
  const q = query;
  let list = clone(all.value);

  if (q.keyword?.trim()) {
    const k = q.keyword.trim().toLowerCase();
    list = list.filter((x) =>
      `${x.title} ${x.summary} ${x.content} ${(x.keywords || []).join(" ")}`
        .toLowerCase()
        .includes(k)
    );
  }
  if (q.dept !== "") list = list.filter((x) => x.dept === q.dept);
  if (q.status !== "") list = list.filter((x) => x.status === q.status);

  if (Array.isArray(q.range) && q.range[0] && q.range[1]) {
    const [start, end] = q.range;
    const s = dayjs(start + " 00:00:00");
    const e = dayjs(end + " 23:59:59");
    list = list.filter((x) => {
      const d = dayjs(x.publishAt);
      return d.isAfter(s) && d.isBefore(e);
    });
  }
  if (q.pin !== "" && q.pin !== undefined && q.pin !== null) {
    list = list.filter((x) => !!x.pin === q.pin);
  }

  list.sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1;
    return dayjs(b.publishAt).valueOf() - dayjs(a.publishAt).valueOf();
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
  query.dept = "";
  query.status = "";
  query.range = "";
  query.pin = "";
  onSearch();
}

// ---- 單筆/批次 ----
async function onTogglePin(row) {
  row.updatedAt = nowStr();
  await api.saveOne(row);
  ElMessage.success("已更新置頂");
  applyQuery();
}
async function setStatus(row, status) {
  row.status = status;
  row.updatedAt = nowStr();
  await api.saveOne(row);
  ElMessage.success("狀態已更新");
  applyQuery();
}
async function removeOne(id) {
  await api.remove(id);
  ElMessage.success("已刪除");
  load();
}
async function batchSetStatus(status) {
  for (const r of multipleSelection.value) {
    r.status = status;
    r.updatedAt = nowStr();
    await api.saveOne(r);
  }
  ElMessage.success("狀態已批次更新");
  load();
}
async function batchRemove() {
  const ids = multipleSelection.value.map((x) => x.id);
  await api.remove(ids);
  ElMessage.success("已批次刪除");
  load();
}

// ---- 編輯 ----
const edit = reactive({ visible: false, isNew: true, form: {} });
function emptyForm() {
  return {
    id: nid(),
    status: "draft",
    title: "",
    dept: "",
    category: "latest",
    summary: "",
    content: "<p></p>",
    cover: "",
    attachments: [],
    externalLink: "",
    publishAt: nowStr(),
    expireAt: null,
    pin: false,
    keywords: [],
    views: 0,
    createdAt: nowStr(),
    createdBy: "editorA",
    updatedAt: nowStr(),
    updatedBy: "editorA",
    reviewLogs: [],
  };
}
function openEdit(row) {
  edit.isNew = !row;
  edit.form = row ? clone(row) : emptyForm();
  edit.visible = true;
}
function addAttachment() {
  edit.form.attachments.push({
    id: nid(),
    name: "附件名稱",
    url: "https://example.com/file.pdf",
  });
}
function removeAttachment(i) {
  edit.form.attachments.splice(i, 1);
}
async function saveEdit() {
  saving.value = true;
  try {
    edit.form.updatedAt = nowStr();
    if (edit.isNew) edit.form.createdAt = nowStr();
    await api.saveOne(clone(edit.form));
    ElMessage.success("已儲存");
    edit.visible = false;
    load();
  } finally {
    saving.value = false;
  }
}

// ---- 預覽 ----
const previewer = reactive({ visible: false, data: null });
const fontSize = ref("text-base");
function preview(row) {
  previewer.data = clone(row);
  previewer.visible = true;
}
function printArea() {
  window.print();
}

// ---- lifecycle ----
onMounted(async () => {
  seedIfEmpty();
  await load();
});
</script>

<style scoped>
/* 綠色主題表頭（Element-Admin 風格） */
:deep(.table-header) {
  background-color: #0f766e !important; /* teal-700 */
  color: #fff !important;
  font-weight: 600;
}

/* 本頁將 primary 按鈕覆寫為綠色系 */
:deep(.el-button--primary) {
  --el-button-bg-color: #059669; /* emerald-600 */
  --el-button-border-color: #059669;
  --el-button-hover-bg-color: #047857; /* emerald-700 */
  --el-button-hover-border-color: #047857;
  --el-button-active-bg-color: #065f46; /* emerald-800 */
  --el-button-active-border-color: #065f46;
}

/* TinyEditor 與內容微調 */
:deep(.tox-tinymce) {
  border-radius: 8px;
}
.prose :where(p, ul, ol, table) {
  margin: 0.6rem 0;
}
.prose :where(h1, h2, h3) {
  margin: 0.8rem 0;
  font-weight: 600;
}

/* 讓 inline 表單的每個 item 都同高、不掉行 */
:deep(.el-form--inline .el-form-item) {
  margin-bottom: 0;
}
</style>
