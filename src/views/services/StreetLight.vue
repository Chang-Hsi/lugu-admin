<template>
  <div class="p-2 md:p-4 space-y-2">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-slate-700">路燈報修</div>
      <div class="text-sm text-slate-500">共 {{ total }} 件</div>
    </div>

    <!-- 篩選列 -->
    <el-card shadow="never" class="border! border-gray-200!">
      <el-form
        :inline="true"
        :model="query"
        label-width="72px"
        label-position="left"
        class="filter-form flex flex-wrap items-center gap-y-4 w-full"
      >
        <el-form-item class="w-[160px]">
          <el-select
            v-model="query.status"
            placeholder="請選擇狀態"
            clearable
            class="w-full"
          >
            <el-option
              v-for="s in STATUSES"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item class="w-[320px]">
          <el-date-picker
            v-model="query.range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="開始"
            end-placeholder="結束"
            value-format="YYYY-MM-DD HH:mm"
            :default-time="['00:00:00', '23:59:59']"
            unlink-panels
            class="w-full"
          />
        </el-form-item>

        <el-form-item class="w-[200px]">
          <el-input
            v-model="query.dept"
            placeholder="請選擇承辦單位"
            clearable
            class="w-full"
          />
        </el-form-item>

        <el-form-item class="w-[160px]">
          <el-input
            v-model="query.staff"
            placeholder="請輸入承辦人"
            clearable
            class="w-full"
          />
        </el-form-item>

        <el-form-item class="w-[160px]">
          <el-select
            v-model="query.overdue"
            placeholder="請選擇逾期狀態"
            clearable
            class="w-full"
          >
            <el-option label="只看逾期" :value="true" />
            <el-option label="不含逾期" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item class="w-[280px]">
          <el-input
            v-model="query.keyword"
            placeholder="請輸入關鍵字(案號/地址/說明/電話)"
            clearable
            class="w-full"
            @keyup.enter="onSearch"
          />
        </el-form-item>

        <el-button type="primary" @click="onSearch">查詢</el-button>

        <div class="flex">
          <el-button @click="exportCSV">導出 CSV</el-button>
          <el-button :disabled="!selectedIds.length" @click="openBatchAssign"
            >批次指派</el-button
          >
          <el-button :disabled="!selectedIds.length" @click="openBatchStatus"
            >批次改狀態</el-button
          >
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
        @selection-change="(sels) => (selectedIds = sels.map((x) => x.id))"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column label="案號" width="160" prop="case_no" />

        <el-table-column label="狀態" width="110" prop="status">
          <template #default="{ row }">
            <el-tag :type="statusType(row)">{{ statusText(row.status) }}</el-tag>
            <el-badge v-if="isOverdue(row)" value="逾期" type="danger" class="ml-2" />
          </template>
        </el-table-column>

        <el-table-column label="通報時間" width="160">
          <template #default="{ row }">{{
            fmt(row.reported_at, "YYYY/MM/DD HH:mm")
          }}</template>
        </el-table-column>

        <el-table-column label="村里" width="100" prop="village" />
        <el-table-column label="地址" min-width="220">
          <template #default="{ row }">
            <div class="text-slate-800">{{ row.address_line }}</div>
            <div class="text-xs text-slate-500">
              {{ row.city }}{{ row.township }}{{ row.village }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="座標" width="180">
          <template #default="{ row }">
            <div class="text-xs text-slate-600">
              {{ row.latitude?.toFixed(6) }}, {{ row.longitude?.toFixed(6) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="通報項目" width="160">
          <template #default="{ row }">
            道路路燈修<span v-if="row.sub_type">／{{ row.sub_type }}</span>
          </template>
        </el-table-column>

        <el-table-column label="說明摘要" min-width="200">
          <template #default="{ row }">
            <span class="line-clamp-1">{{ brief(row.description) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="通報人" width="160">
          <template #default="{ row }">
            <div>{{ row.reporter_name }}</div>
            <div class="text-xs text-slate-500">{{ maskPhone(row.reporter_phone) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="照片數" width="90" align="center">
          <template #default="{ row }">
            <el-badge
              :value="row.photo_count"
              :type="row.photo_count ? 'primary' : 'info'"
            />
          </template>
        </el-table-column>

        <el-table-column label="承辦" width="160">
          <template #default="{ row }">
            <div>{{ row.assignee_dept || "—" }}</div>
            <div class="text-xs text-slate-500">{{ row.assignee_user_name || "" }}</div>
          </template>
        </el-table-column>

        <el-table-column label="SLA 到期" width="160">
          <template #default="{ row }">
            <div>
              {{ row.sla_due_at ? fmt(row.sla_due_at, "YYYY/MM/DD HH:mm") : "—" }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="來源" width="110" prop="source" />
        <el-table-column label="最後更新" width="160">
          <template #default="{ row }">{{
            fmt(row.last_updated_at, "YYYY/MM/DD HH:mm")
          }}</template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">詳情</el-button>
            <el-button link @click="goMap(row)">地圖</el-button>
            <el-button link @click="openAssign(row)">指派</el-button>
            <el-button link @click="openStatus(row)">改狀態</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-between items-center mt-3">
        <div class="text-xs text-slate-500">已選取 {{ selectedIds.length }} 件</div>
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

    <!-- 詳情側欄 -->
    <el-drawer v-model="detail.open" title="案件詳情" size="520px">
      <template #default>
        <div v-if="detail.row">
          <div class="space-y-2">
            <div class="text-base font-semibold">{{ detail.row.case_no }}</div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="label">狀態：</span>{{ statusText(detail.row.status) }}
              </div>
              <div><span class="label">來源：</span>{{ detail.row.source }}</div>
              <div>
                <span class="label">通報時間：</span>{{ fmt(detail.row.reported_at) }}
              </div>
              <div>
                <span class="label">SLA 到期：</span
                >{{ detail.row.sla_due_at ? fmt(detail.row.sla_due_at) : "—" }}
              </div>
              <div class="col-span-2">
                <span class="label">地址：</span>{{ fullAddr(detail.row) }}
              </div>
              <div class="col-span-2">
                <span class="label">座標：</span>{{ detail.row.latitude }},
                {{ detail.row.longitude }}
                <el-button link @click="goMap(detail.row)">在地圖開啟</el-button>
              </div>
              <div>
                <span class="label">承辦單位：</span>{{ detail.row.assignee_dept || "—" }}
              </div>
              <div>
                <span class="label">承辦人：</span
                >{{ detail.row.assignee_user_name || "—" }}
              </div>
            </div>

            <el-alert
              v-if="detail.dupHint"
              type="warning"
              :closable="false"
              title="可能重複：近 7 天內同位置附近已有案件"
              class="mt-1"
            />

            <el-divider>通報人</el-divider>
            <div class="grid grid-cols-2 gap-2">
              <div><span class="label">姓名：</span>{{ detail.row.reporter_name }}</div>
              <div><span class="label">電話：</span>{{ detail.row.reporter_phone }}</div>
              <div class="col-span-2">
                <span class="label">Email：</span>{{ detail.row.reporter_email || "—" }}
              </div>
            </div>

            <el-divider>通報內容</el-divider>
            <div class="text-slate-700 whitespace-pre-wrap">
              {{ detail.row.description }}
            </div>

            <el-divider>附件（{{ detail.row.photo_count }}）</el-divider>
            <div v-if="detail.row.attachments?.length" class="space-y-1">
              <div v-for="(f, i) in detail.row.attachments" :key="i" class="text-sm">
                •
                <a
                  :href="f.url"
                  target="_blank"
                  class="text-emerald-700 hover:underline"
                  >{{ f.name }}</a
                >
                <span class="text-xs text-slate-500"
                  >（{{ f.type || "檔案" }}，{{ humanSize(f.size) }}）</span
                >
              </div>
            </div>
            <div v-else class="text-slate-500 text-sm">無附件</div>

            <el-divider>時間線</el-divider>
            <div class="space-y-2">
              <div v-for="log in detail.logs" :key="log.id" class="text-sm">
                <div class="font-medium">
                  {{ fmt(log.created_at, "YYYY/MM/DD HH:mm") }} · {{ log.action }}
                </div>
                <div class="text-slate-600">
                  {{ log.actor_name || "系統" }} — {{ log.note || "" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 指派彈窗 -->
    <el-dialog v-model="assign.open" title="指派" width="520px">
      <el-form :model="assign.form" label-width="84px" class="space-y-2">
        <el-form-item label="單位">
          <el-select
            v-model="assign.form.dept"
            placeholder="選擇單位"
            style="width: 260px"
          >
            <el-option v-for="d in DEPTS" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="承辦人">
          <el-input
            v-model="assign.form.user"
            placeholder="例如：張承辦"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="備註">
          <el-input
            v-model="assign.form.note"
            type="textarea"
            :rows="3"
            placeholder="派工/聯繫說明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="assign.open = false">取消</el-button>
          <el-button type="primary" @click="saveAssign">儲存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 改狀態彈窗 -->
    <el-dialog v-model="st.open" title="變更狀態" width="520px">
      <el-form :model="st.form" label-width="96px" class="space-y-2">
        <el-form-item label="狀態">
          <el-select v-model="st.form.to" placeholder="選擇狀態" style="width: 220px">
            <el-option
              v-for="s in STATUSES"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="備註">
          <el-input
            v-model="st.form.note"
            type="textarea"
            :rows="3"
            placeholder="處置/原因說明（完修/退回/作廢需填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="st.open = false">取消</el-button>
          <el-button type="primary" @click="saveStatus">儲存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";

/* 常數 */
const STATUSES = [
  { value: "new", label: "新案" },
  { value: "in_progress", label: "處理中" },
  { value: "done", label: "已完修" },
  { value: "verified", label: "覆核" },
  { value: "closed", label: "結案" },
  { value: "rejected", label: "退回" },
  { value: "void", label: "作廢" },
];
const VILLAGES = ["內湖村", "鳳凰村", "廣興村", "瑞田村", "秀峰村", "和雅村"];
const DEPTS = ["工務課", "民政課", "觀光課", "秘書室"];
const LS_KEY = "sl.tickets.v1";

/* 工具 */
const fmt = (v, f = "YYYY/MM/DD HH:mm") => (v ? dayjs(v).format(f) : "");
const clone = (o) => JSON.parse(JSON.stringify(o));
const humanSize = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};
const brief = (s = "", n = 36) => (s.length > n ? s.slice(0, n) + "…" : s);
const maskPhone = (p = "") => (p ? p.replace(/(\d{3})\d+(\d{2})/, "$1****$2") : "");
const haversine = (lat1, lon1, lat2, lon2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/* 狀態風格 */
function statusText(s) {
  return STATUSES.find((x) => x.value === s)?.label || s;
}
function statusType(row) {
  switch (row.status) {
    case "new":
      return "info";
    case "in_progress":
      return "warning";
    case "done":
      return "success";
    case "verified":
      return "success";
    case "closed":
      return "success";
    case "rejected":
      return "danger";
    case "void":
      return "danger";
    default:
      return "";
  }
}
function isOverdue(row) {
  if (!row.sla_due_at) return false;
  const doneLike = ["done", "verified", "closed", "void", "rejected"].includes(
    row.status
  );
  if (doneLike) return false;
  return dayjs().isAfter(dayjs(row.sla_due_at));
}

/* 狀態 */
const query = reactive({
  status: "",
  village: "",
  range: "",
  dept: "",
  staff: "",
  overdue: null, // true/false/null
  hasFiles: null, // true/false/null
  keyword: "",
});
const page = reactive({ index: 1, size: 10 });
const total = ref(0);
const rows = ref([]);
const all = ref([]);
const loading = ref(false);
let selectedIds = ref([]);

/* 詳情/指派/改狀態 */
const detail = reactive({ open: false, row: null, logs: [], dupHint: false });
const assign = reactive({
  open: false,
  ids: [],
  form: { id: null, dept: "", user: "", note: "" },
});
const st = reactive({ open: false, ids: [], form: { id: null, to: "", note: "" } });

/* 假資料 */
function nextCaseNo(date = new Date()) {
  const d = dayjs(date).format("YYYYMMDD");
  const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const countToday =
    raw.filter((x) => dayjs(x.reported_at).format("YYYYMMDD") === d).length + 1;
  return `SL-${d}-${String(countToday).padStart(4, "0")}`;
}
function seedIfEmpty() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;
  const base = dayjs().subtract(60, "day");
  const subs = ["不亮", "忽明忽暗", "燈罩破裂", "線路異常", "熄滅延遲"];
  const list = [];
  for (let i = 0; i < 64; i++) {
    const t = base.add(i * 18, "hour");
    const statusPool = ["new", "in_progress", "done", "verified", "closed"];
    const st = statusPool[i % statusPool.length];
    const lat = 23.74 + Math.random() * 0.08;
    const lon = 120.7 + Math.random() * 0.08;
    const item = {
      id: i + 1,
      case_no: nextCaseNo(t.toDate()),
      source: i % 7 === 0 ? "phone" : "web",
      status: st,
      priority: i % 9 === 0 ? "urgent" : "normal",
      sla_due_at: t
        .add(i % 9 === 0 ? 1 : 3, "day")
        .hour(17)
        .minute(0)
        .second(0)
        .toISOString(),

      reporter_name: `報案人${i + 1}`,
      reporter_email: `foo${i}@test.com`,
      reporter_phone: `09${Math.floor(100000000 + Math.random() * 899999999)}`.slice(
        0,
        10
      ),

      city: "南投縣",
      township: "鹿谷鄉",
      village: VILLAGES[i % VILLAGES.length],
      address_line: `測試路 ${100 + i} 號旁電桿`,

      latitude: lat,
      longitude: lon,

      major_type: "streetlight",
      sub_type: subs[i % subs.length],
      description: "晚上不亮，附近路段偏暗，車流量大，請盡速處理。",

      photo_count: i % 3 === 0 ? 2 : 0,
      attachments:
        i % 3 === 0
          ? [
              { name: "photo1.jpg", url: "#", type: "image/jpeg", size: 123456 },
              { name: "photo2.jpg", url: "#", type: "image/jpeg", size: 223456 },
            ]
          : [],

      assignee_dept: i % 4 === 0 ? DEPTS[i % DEPTS.length] : "",
      assignee_user_id: i % 4 === 0 ? 100 + i : null,
      assignee_user_name: i % 4 === 0 ? "張承辦" : "",

      reported_at: t.toISOString(),
      accepted_at: i % 5 >= 1 ? t.add(1, "hour").toISOString() : null,
      dispatched_at: i % 5 >= 2 ? t.add(5, "hour").toISOString() : null,
      arrived_at: i % 5 >= 3 ? t.add(12, "hour").toISOString() : null,
      fixed_at: i % 5 >= 4 ? t.add(30, "hour").toISOString() : null,
      verified_at: null,
      closed_at: null,
      last_updated_at: t.add(36, "hour").toISOString(),

      duplicate_of_id: null,
      extra: { pole_no: `A-${1000 + i}` },
    };
    list.push(item);
  }
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* 模擬 API */
const api = {
  async list() {
    await sleep(120);
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  },
  async update(id, patch) {
    await sleep(80);
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const i = arr.findIndex((x) => x.id === id);
    if (i >= 0) {
      arr[i] = { ...arr[i], ...patch, last_updated_at: new Date().toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
      return arr[i];
    }
    return null;
  },
  async batchUpdate(ids, patch) {
    await sleep(100);
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    for (const id of ids) {
      const i = arr.findIndex((x) => x.id === id);
      if (i >= 0)
        arr[i] = { ...arr[i], ...patch, last_updated_at: new Date().toISOString() };
    }
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    return true;
  },
  async logs(ticketId) {
    await sleep(60);
    // demo logs
    return [
      {
        id: 1,
        action: "created",
        actor_name: "系統",
        note: "建立案件",
        created_at: dayjs().subtract(2, "day").toISOString(),
      },
      {
        id: 2,
        action: "accepted",
        actor_name: "張承辦",
        note: "受理",
        created_at: dayjs().subtract(47, "hour").toISOString(),
      },
      {
        id: 3,
        action: "dispatched",
        actor_name: "張承辦",
        note: "派工：OO電工",
        created_at: dayjs().subtract(40, "hour").toISOString(),
      },
    ];
  },
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* 載入與查詢 */
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

  // 篩選
  if (query.status) list = list.filter((x) => x.status === query.status);
  if (query.village) list = list.filter((x) => x.village === query.village);
  if (Array.isArray(query.range) && query.range[0] && query.range[1]) {
    const s = dayjs(query.range[0]),
      e = dayjs(query.range[1]);
    list = list.filter((x) => {
      const t = dayjs(x.reported_at);
      return !t.isBefore(s) && !t.isAfter(e);
    });
  }
  if (query.dept?.trim())
    list = list.filter((x) => (x.assignee_dept || "").includes(query.dept.trim()));
  if (query.staff?.trim())
    list = list.filter((x) => (x.assignee_user_name || "").includes(query.staff.trim()));
  if (query.overdue !== null) list = list.filter((x) => isOverdue(x) === query.overdue);
  if (query.hasFiles !== null)
    list = list.filter((x) => x.photo_count > 0 === query.hasFiles);
  if (query.keyword?.trim()) {
    const k = query.keyword.trim().toLowerCase();
    list = list.filter((x) => {
      const phone = x.reporter_phone || "";
      return (
        (x.case_no || "").toLowerCase().includes(k) ||
        (x.address_line || "").toLowerCase().includes(k) ||
        (x.description || "").toLowerCase().includes(k) ||
        phone.includes(k)
      );
    });
  }

  // 排序：通報時間 新→舊
  list.sort((a, b) => dayjs(b.reported_at).valueOf() - dayjs(a.reported_at).valueOf());

  // 分頁
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
  query.village = "";
  query.range = "";
  query.dept = "";
  query.staff = "";
  query.overdue = null;
  query.hasFiles = null;
  query.keyword = "";
  onSearch();
}

/* 詳情/操作 */
async function openDetail(row) {
  detail.row = clone(row);
  const near = findNearbyDuplicate(row);
  detail.dupHint = !!near;
  detail.logs = await api.logs(row.id);
  detail.open = true;
}
function findNearbyDuplicate(row) {
  const now7 = dayjs().subtract(7, "day");
  const near = all.value.find((x) => {
    if (x.id === row.id) return false;
    if (dayjs(x.reported_at).isBefore(now7)) return false;
    if (["closed", "void", "rejected"].includes(x.status)) return false;
    if (x.latitude && x.longitude && row.latitude && row.longitude) {
      return haversine(x.latitude, x.longitude, row.latitude, row.longitude) <= 15;
    }
    return false;
  });
  return near || null;
}
function goMap(row) {
  if (!row.latitude || !row.longitude) return;
  const url = `https://www.google.com/maps?q=${row.latitude},${row.longitude}`;
  window.open(url, "_blank");
}

/* 指派 */
function openAssign(row) {
  if (row) {
    assign.ids = [row.id];
  } else {
    assign.ids = selectedIds.value;
  }
  assign.form = {
    id: null,
    dept: row?.assignee_dept || "",
    user: row?.assignee_user_name || "",
    note: "",
  };
  assign.open = true;
}
function openBatchAssign() {
  if (!selectedIds.value.length) return;
  openAssign(null);
}
async function saveAssign() {
  if (!assign.ids.length) return;
  await api.batchUpdate(assign.ids, {
    assignee_dept: assign.form.dept || "",
    assignee_user_name: assign.form.user || "",
  });
  ElMessage.success("已指派");
  assign.open = false;
  await load();
}

/* 改狀態 */
function openStatus(row) {
  if (row) {
    st.ids = [row.id];
  } else {
    st.ids = selectedIds.value;
  }
  st.form = { id: row?.id || null, to: row?.status || "", note: "" };
  st.open = true;
}
function openBatchStatus() {
  if (!selectedIds.value.length) return;
  openStatus(null);
}
async function saveStatus() {
  const to = st.form.to;
  if (!to) return ElMessage.error("請選擇狀態");
  // 部分狀態強制備註
  if (["done", "rejected", "void"].includes(to) && !st.form.note?.trim()) {
    return ElMessage.error("請填寫備註（完修/退回/作廢需填）");
  }
  await api.batchUpdate(st.ids, { status: to });
  ElMessage.success("狀態已更新");
  st.open = false;
  await load();
}

/* 導出 CSV */
function exportCSV() {
  const headers = [
    "案號",
    "狀態",
    "通報時間",
    "村里",
    "地址",
    "緯度",
    "經度",
    "子類型",
    "通報人",
    "電話",
    "照片數",
    "承辦單位",
    "承辦人",
    "SLA 到期",
    "來源",
    "最後更新",
  ];
  const data = rows.value.map((x) => [
    x.case_no,
    statusText(x.status),
    fmt(x.reported_at),
    x.village,
    x.address_line,
    x.latitude || "",
    x.longitude || "",
    x.sub_type || "",
    x.reporter_name,
    x.reporter_phone,
    x.photo_count,
    x.assignee_dept || "",
    x.assignee_user_name || "",
    x.sla_due_at ? fmt(x.sla_due_at) : "",
    x.source,
    fmt(x.last_updated_at),
  ]);
  const csv = [headers, ...data]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `streetlight_${dayjs().format("YYYYMMDD_HHmm")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* lifecycle */
onMounted(async () => {
  seedIfEmpty();
  await load();
});

/* 小工具：完整地址 */
function fullAddr(row) {
  return `${row.city}${row.township}${row.village}${row.address_line}`;
}
</script>

<style scoped>
:deep(.table-header) {
  background-color: #0f766e !important; /* teal-700 */
  color: #fff !important;
  font-weight: 600;
}
.label {
  display: inline-block;
  width: 88px;
  color: #64748b; /* slate-500 */
}
</style>
