<!-- src/views/admin/TouristSpots.vue -->
<template>
  <div class="p-2 md:p-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">觀光景點</div>
      <div class="flex items-center gap-2">
        <el-segmented
          v-model="mode"
          :options="[
            { label: '清單模式', value: 'table' },
            { label: '排序模式', value: 'sort' },
          ]"
        />
        <el-button @click="load" :loading="loading">重新整理</el-button>
        <el-button type="primary" @click="openMeta()">新增景點</el-button>
      </div>
    </div>

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
            placeholder="標題 / 內文"
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
        <div class="ml-auto flex gap-2">
          <el-button type="primary" @click="onSearch">查詢</el-button>
          <el-button @click="resetQuery">重設</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card v-if="mode === 'table'" shadow="never" class="border! border-gray-200!">
      <el-table
        :data="rows"
        v-loading="loading"
        header-cell-class-name="table-header"
        style="width: 100%"
      >
        <el-table-column label="#" width="64" align="center">
          <template #default="{ $index }">
            {{ (page.index - 1) * page.size + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="縮圖" width="92" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.iconUrl || DEFAULT_ICON_URL"
              fit="cover"
              style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden"
              :preview-src-list="[row.iconUrl || DEFAULT_ICON_URL]"
              :z-index="3000"
            />
          </template>
        </el-table-column>

        <el-table-column label="景點標題" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="font-medium text-slate-800">{{ row.label }}</div>
            <div class="text-[12px] text-slate-500 line-clamp-1">{{ row.summary }}</div>
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

        <el-table-column label="操作" width="190" align="center" fixed="right">
          <template #default="{ row }">
            <el-button text @click="openMeta(row)">編輯</el-button>
            <el-popconfirm title="確定刪除這張景點？" @confirm="removeOne(row.id)">
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

    <el-card v-else shadow="never" class="border! border-gray-200!">
      <div class="flex items-center justify-between mb-3">
        <div class="text-slate-600">拖曳景點以調整順序（會影響前台顯示順序）</div>
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
            <img :src="displayIcon(element)" class="w-12 h-12 object-cover rounded" />
            <div class="flex-1">
              <div class="font-medium">{{ element.label }}</div>
              <div class="text-[12px] text-slate-500 line-clamp-1">
                {{ element.summary }}
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </el-card>

    <el-dialog
      v-model="meta.visible"
      width="880px"
      top="5vh"
      :title="meta.isNew ? '新增景點' : '編輯景點'"
    >
      <el-form :model="meta.form" label-width="130px" class="space-y-1">
        <el-form-item label="標題">
          <el-input v-model="meta.form.label" placeholder="顯示在景點上的文字" />
        </el-form-item>
        <el-form-item label="簡介">
          <el-input
            v-model="meta.form.summary"
            type="textarea"
            :rows="2"
            placeholder="一句話介紹"
          />
        </el-form-item>
        <el-form-item label="縮圖 URL">
          <el-input
            v-model="meta.form.iconUrl"
            placeholder="https://...（JPG/PNG/SVG）"
          />
          <div class="mt-2 flex items-center gap-3">
            <img :src="displayIcon(meta.form)" class="w-14 h-14 object-cover rounded" />
          </div>
        </el-form-item>
        <el-form-item label="YouTube 連結">
          <el-input
            v-model="meta.form.youtubeUrl"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </el-form-item>
        <el-form-item label="Google 地圖連結">
          <el-input
            v-model="meta.form.gmapUrl"
            placeholder="https://maps.google.com/..."
          />
        </el-form-item>
        <el-form-item label="內容">
          <TinyEditor v-model="meta.form.content" />
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
/**
 * 重點：
 * 1) 假資料 ALL_SPOTS：非隨機，含 id/label/summary/iconUrl/youtubeUrl/gmapUrl/content/visible/updatedAt/order
 * 2) 新增/編輯彈窗（meta）一次填齊所有欄位（含 TinyEditor）
 * 3) 僅前端狀態模擬 CRUD 與排序儲存
 */
import { ref, reactive, computed, onMounted } from "vue";
import dayjs from "dayjs";
import TinyEditor from "@/components/TinyEditor.vue";
import { ElMessage } from "element-plus";
import draggable from "vuedraggable";

const DEFAULT_ICON_URL =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=480&q=60&auto=format&fit=crop";

/* ---- 假資料（非隨機） ---- */
const ALL_SPOTS = [
  {
    id: 1,
    label: "銀杏林景觀步道",
    summary: "四季分明的林間步道，秋季金黃最為迷人。",
    iconUrl:
      "https://image-resizer.cwg.tw/resize/uri/https%3A%2F%2Fstorage.googleapis.com%2Fsmiletaiwan-cms-cwg-tw%2Farticle%2F201807%2Farticle-5b59f3ffecbd2.jpg/?w=1366",
    youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    gmapUrl: "https://maps.google.com/?q=23.7442,120.7521",
    content: "<p>步道沿線設有觀景平台與休憩座椅，適合親子漫遊。</p>",
    visible: true,
    updatedAt: "2025-10-18 10:30:00",
    order: 1,
  },
  {
    id: 2,
    label: "小半天高架橋",
    summary: "紅色鋼拱橋橫跨溪谷，視野遼闊。",
    iconUrl:
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/e5/1b/ce/caption.jpg?w=500&h=-1&s=1",
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    gmapUrl: "https://maps.google.com/?q=23.7449,120.7513",
    content: "<p>周邊設有停車場與觀景平台，適合拍照。</p>",
    visible: true,
    updatedAt: "2025-10-17 15:05:00",
    order: 2,
  },
  {
    id: 3,
    label: "麒麟潭",
    summary: "山光水色相映，清晨薄霧最具詩意。",
    iconUrl:
      "https://mediaim.expedia.com/destination/1/37262445fa15f97b8e04b242702cbd88.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=oHg5SJYRHA0",
    gmapUrl: "https://maps.google.com/?q=23.7440,120.7452",
    content: "<p>環湖步道平緩好走，適合全家散步。</p>",
    visible: true,
    updatedAt: "2025-10-12 09:12:00",
    order: 3,
  },
  {
    id: 4,
    label: "鳳凰山寺",
    summary: "靜謐清幽的信仰中心，可遠眺山巒。",
    iconUrl: "https://travel.nantou.gov.tw/wp-content/uploads/2021/10/AT111.jpg",
    youtubeUrl: "",
    gmapUrl: "https://maps.google.com/?q=23.7361,120.7402",
    content: "<p>寺前廣場寬敞，香客絡繹不絕。</p>",
    visible: false,
    updatedAt: "2025-10-10 13:22:00",
    order: 4,
  },
  {
    id: 5,
    label: "凍頂茶園",
    summary: "烏龍茶發源地，茶香繚繞。",
    iconUrl: "https://cdn-smiletaiwan.cw.com.tw/article/202408/article-66b35d8cabf5a.JPG",
    youtubeUrl: "",
    gmapUrl: "https://maps.google.com/?q=23.7447,120.7270",
    content: "<p>可預約採茶與製茶體驗，了解茶文化。</p>",
    visible: true,
    updatedAt: "2025-10-08 08:00:00",
    order: 5,
  },
];

/* ---- 狀態 ---- */
const mode = ref("table");
const loading = ref(false);
const saving = ref(false);

const page = reactive({ index: 1, size: 8 });
const total = ref(0);

const query = reactive({
  keyword: "",
  visible: "",
});

const all = ref([]);
const rows = ref([]);

const meta = reactive({
  visible: false,
  isNew: true,
  form: {
    id: 0,
    label: "",
    summary: "",
    iconUrl: "",
    youtubeUrl: "",
    gmapUrl: "",
    content: "",
    visible: true,
  },
});

/* ---- 方法 ---- */
function fmt(ts) {
  if (!ts) return "-";
  return dayjs(ts).format("YYYY/MM/DD HH:mm");
}

function displayIcon(x) {
  return x && x.iconUrl ? x.iconUrl : DEFAULT_ICON_URL;
}

function load() {
  loading.value = true;
  // 模擬從後端取回最新排序與資料
  setTimeout(() => {
    all.value = JSON.parse(JSON.stringify(ALL_SPOTS)).sort((a, b) => a.order - b.order);
    applyQuery();
    loading.value = false;
  }, 200);
}

function applyQuery() {
  let list = [...all.value];
  if (query.keyword) {
    const kw = query.keyword.trim().toLowerCase();
    list = list.filter(
      (x) =>
        x.label.toLowerCase().includes(kw) ||
        (x.summary && x.summary.toLowerCase().includes(kw)) ||
        (x.content && x.content.toLowerCase().includes(kw))
    );
  }
  if (query.visible !== "") {
    list = list.filter((x) => x.visible === query.visible);
  }
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
  page.index = 1;
  applyQuery();
}

function openMeta(row) {
  if (row) {
    meta.isNew = false;
    meta.form = {
      id: row.id,
      label: row.label,
      summary: row.summary,
      iconUrl: row.iconUrl,
      youtubeUrl: row.youtubeUrl,
      gmapUrl: row.gmapUrl,
      content: row.content,
      visible: row.visible,
    };
  } else {
    meta.isNew = true;
    meta.form = {
      id: 0,
      label: "",
      summary: "",
      iconUrl: "",
      youtubeUrl: "",
      gmapUrl: "",
      content: "",
      visible: true,
    };
  }
  meta.visible = true;
}

function saveMeta() {
  saving.value = true;
  setTimeout(() => {
    if (meta.isNew) {
      const newId = Math.max(...all.value.map((x) => x.id)) + 1;
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      all.value.push({
        id: newId,
        label: meta.form.label,
        summary: meta.form.summary,
        iconUrl: meta.form.iconUrl,
        youtubeUrl: meta.form.youtubeUrl,
        gmapUrl: meta.form.gmapUrl,
        content: meta.form.content,
        visible: meta.form.visible,
        updatedAt: now,
        order: all.value.length + 1,
      });
      ElMessage.success("已新增景點");
    } else {
      const idx = all.value.findIndex((x) => x.id === meta.form.id);
      if (idx >= 0) {
        all.value[idx] = {
          ...all.value[idx],
          label: meta.form.label,
          summary: meta.form.summary,
          iconUrl: meta.form.iconUrl,
          youtubeUrl: meta.form.youtubeUrl,
          gmapUrl: meta.form.gmapUrl,
          content: meta.form.content,
          visible: meta.form.visible,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        };
        ElMessage.success("已更新景點");
      }
    }
    meta.visible = false;
    saving.value = false;
    applyQuery();
  }, 250);
}

function quickSave(row) {
  row.updatedAt = dayjs().format("YYYY-MM-DD HH:mm:ss");
  ElMessage.success("已更新顯示狀態");
}

function removeOne(id) {
  const i = all.value.findIndex((x) => x.id === id);
  if (i >= 0) {
    all.value.splice(i, 1);
    // 重新編 order
    all.value.forEach((x, idx) => (x.order = idx + 1));
    ElMessage.success("已刪除");
    applyQuery();
  }
}

function saveOrder() {
  saving.value = true;
  setTimeout(() => {
    all.value.forEach((x, idx) => (x.order = idx + 1));
    ElMessage.success("排序已儲存");
    saving.value = false;
    applyQuery();
  }, 250);
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.drag-ghost {
  opacity: 0.5;
}
</style>
