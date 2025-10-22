<template>
  <div class="p-2 md:p-4 space-y-2">
    <!-- 頁首 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">鄉民代表會</div>
      <div class="flex items-center">
        <el-button @click="load" :loading="loading">重新載入</el-button>
        <el-button @click="openPreview">預覽</el-button>
        <el-button type="primary" @click="publish" :loading="saving">發布</el-button>
      </div>
    </div>

    <!-- 綠色 TabBar -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="t in TABS"
        :key="t.key"
        @click="active = t.key"
        :class="[
          'px-4 h-10 rounded-md text-white font-semibold shadow',
          active === t.key ? 'bg-emerald-700' : 'bg-emerald-600/90 hover:bg-emerald-700',
        ]"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 表單：每個 Tab 同一表單的不同資料段 -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-form :model="form[active]" label-width="72px" class="space-y-4">
        <el-form-item label="標題">
          <el-input v-model="form[active].title" :placeholder="currentTab?.label" />
        </el-form-item>
        <el-form-item label="內文">
          <TinyEditor v-model="form[active].content" />
        </el-form-item>
        <div class="text-xs text-slate-500">
          狀態：<span class="font-medium">{{ statusText }}</span>
          <span class="ml-2">最後更新：{{ fmt(form.meta.updatedAt) || "—" }}</span>
        </div>
      </el-form>
    </el-card>

    <!-- 預覽 Dialog（依目前分頁預覽） -->
    <el-dialog
      v-model="preview.visible"
      width="860px"
      top="5vh"
      :title="`預覽：${currentTab?.label}`"
    >
      <div class="space-y-4">
        <h1 class="text-2xl font-bold">{{ form[active].title || currentTab?.label }}</h1>
        <div class="prose max-w-none" v-html="form[active].content"></div>
      </div>
      <template #footer>
        <el-button @click="preview.visible = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import TinyEditor from "@/components/TinyEditor.vue";

/** 分頁定義 */
const TABS = [
  { key: "chairman", label: "主席介紹" },
  { key: "org-intro", label: "組織介紹" },
  { key: "org-structure", label: "組織架構" },
  { key: "service-phone", label: "代表服務電話" },
  { key: "law-adv", label: "法規公告宣導" },
];

/** localStorage Key（之後可替換為 API） */
const LS_KEY = "council.tabs.v1";

/** 狀態 */
const active = ref("chairman");
const loading = ref(false);
const saving = ref(false);
const preview = reactive({ visible: false });

/** 表單資料 */
const form = reactive({
  chairman: { title: "主席介紹", content: "" },
  "org-intro": { title: "組織介紹", content: "" },
  "org-structure": { title: "組織架構", content: "" },
  "service-phone": { title: "代表服務電話", content: "" },
  "law-adv": { title: "法規公告宣導", content: "" },
  meta: {
    status: "draft",
    updatedAt: "",
  },
});

/** 便捷取用 */
const currentTab = computed(() => TABS.find((t) => t.key === active.value));
const statusText = computed(() => (form.meta.status === "published" ? "已發布" : "草稿"));
const fmt = (v) => (v ? dayjs(v).format("YYYY/MM/DD HH:mm") : "");

/** 行為 */
function openPreview() {
  preview.visible = true;
}

async function publish() {
  // 最低驗證：標題至少有值（自動填入 Tab 名稱，幾乎不會空）
  const cur = form[active.value];
  if (!cur.title?.trim()) cur.title = currentTab.value?.label || "";
  saving.value = true;
  try {
    form.meta.status = "published";
    form.meta.updatedAt = dayjs().toISOString();
    localStorage.setItem(LS_KEY, JSON.stringify(form));
    ElMessage.success("已發布");
  } finally {
    saving.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    // 小心保留三個 key，避免缺欄
    for (const t of TABS) {
      form[t.key].title = data?.[t.key]?.title ?? t.label;
      form[t.key].content = data?.[t.key]?.content ?? "";
    }
    form.meta.status = data?.meta?.status ?? "draft";
    form.meta.updatedAt = data?.meta?.updatedAt ?? "";
  } finally {
    loading.value = false;
  }
}

/** 切換分頁：若標題為空自動帶入分頁名稱 */
watch(active, (k) => {
  const tab = TABS.find((t) => t.key === k);
  if (tab && !form[k].title?.trim()) form[k].title = tab.label;
});

onMounted(load);
</script>

<style scoped>
/* TinyEditor 視覺細節 */
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
</style>
