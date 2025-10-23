<!-- src/components/about/Schedule.vue -->
<template>
  <div class="space-y-3">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <el-button size="large" @click="gotoPrevMonth">上個月</el-button>
        <div class="px-3 py-1.5 rounded border bg-slate-50 text-slate-700 font-semibold">
          {{ monthTitle }}
        </div>
        <el-button size="large" @click="gotoNextMonth">下個月</el-button>
      </div>
      <div class="flex items-center gap-2">
        <el-button type="primary" size="large" @click="publish" :loading="saving"
          >儲存</el-button
        >
        <el-button size="large" @click="openEdit()">新增行程</el-button>
      </div>
    </div>

    <el-card shadow="never" class="border! border-gray-200!">
      <el-table
        :data="monthRows"
        header-cell-class-name="table-header"
        style="width: 100%"
      >
        <el-table-column label="日期" width="120">
          <template #default="{ row }">
            <div class="font-semibold">{{ d(row.date, "MM/DD") }}</div>
            <div class="text-[12px] text-slate-500">{{ d(row.date, "ddd") }}</div>
          </template>
        </el-table-column>

        <el-table-column label="時間" width="120">
          <template #default="{ row }">
            <span v-if="row.allDay">全天</span>
            <span v-else>{{ row.start }}–{{ row.end }}</span>
          </template>
        </el-table-column>

        <el-table-column label="類別" width="110">
          <template #default="{ row }">
            <el-tag :type="tagType(row.kind)" size="large">{{ row.kind }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="主旨" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="font-medium text-slate-800">{{ row.title }}</div>
            <div v-if="row.location" class="text-[12px] text-slate-500">
              {{ row.location }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="顯示" width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.visible" @change="quickSave(row)" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text @click="openEdit(row)">編輯</el-button>
            <el-popconfirm title="確定刪除這筆行程？" @confirm="removeOne(row.id)">
              <template #reference>
                <el-button text type="danger">刪除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="editor.visible"
      width="560px"
      :title="editor.isNew ? '新增行程' : '編輯行程'"
    >
      <el-form
        :model="editor.form"
        label-width="70px"
        label-position="left"
        class="space-y-1"
      >
        <el-form-item label="日期">
          <el-date-picker
            v-model="editor.form.date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="時間">
          <div class="flex items-center gap-2">
            <el-time-select
              v-model="editor.form.start"
              :disabled="editor.form.allDay"
              start="06:00"
              step="00:30"
              end="23:30"
              placeholder="開始"
              class="w-28"
            />
            <span>–</span>
            <el-time-select
              v-model="editor.form.end"
              :disabled="editor.form.allDay"
              start="06:00"
              step="00:30"
              end="23:30"
              placeholder="結束"
              class="w-28"
            />
          </div>
        </el-form-item>

        <el-form-item label="類別">
          <el-select v-model="editor.form.kind" style="width: 160px">
            <el-option v-for="k in KINDS" :key="k" :label="k" :value="k" />
          </el-select>
        </el-form-item>

        <el-form-item label="主旨">
          <el-input
            v-model="editor.form.title"
            placeholder="例如：會議 / 邀請 / 告別式 / 祝賀 / 會勘"
          />
        </el-form-item>

        <el-form-item label="地點">
          <el-input v-model="editor.form.location" placeholder="地點或單位" />
        </el-form-item>

        <el-form-item label="備註">
          <el-input v-model="editor.form.note" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="顯示">
          <el-switch v-model="editor.form.visible" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editor.visible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/*
  設計重點（後台）：
  1) 以月份管理：上/下個月、月份標題、列表呈現該月所有行程。
  2) 單筆欄位：id, date(YYYY-MM-DD), start/end(HH:mm), allDay, kind, title, location, note, visible。
  3) 下載 ICS：將目前月份的可見行程輸出 .ics 檔（VEVENT）。
  4) 假資料固定（非隨機），預設月份 2025-10，對應你前台截圖。
*/
import { ref, reactive, computed } from "vue";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import weekday from "dayjs/plugin/weekday";
import isBetween from "dayjs/plugin/isBetween";

import { ElMessage } from "element-plus";

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(isBetween);

const KINDS = ["會議", "邀請", "告別式", "祝賀", "會勘"];

// 固定假資料：對應 2025/10 的畫面（多筆同日）
const ALL_EVENTS = [
  {
    id: 1,
    date: "2025-10-01",
    start: "09:00",
    end: "10:00",
    allDay: false,
    kind: "會議",
    title: "會議",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 2,
    date: "2025-10-01",
    start: "13:30",
    end: "14:30",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 3,
    date: "2025-10-01",
    start: "19:00",
    end: "20:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 4,
    date: "2025-10-02",
    start: "09:00",
    end: "10:00",
    allDay: false,
    kind: "會議",
    title: "會議",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 5,
    date: "2025-10-02",
    start: "14:00",
    end: "15:00",
    allDay: false,
    kind: "告別式",
    title: "告別式",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 6,
    date: "2025-10-03",
    start: "09:00",
    end: "10:00",
    allDay: false,
    kind: "會議",
    title: "會議",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 7,
    date: "2025-10-04",
    start: "10:00",
    end: "11:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 8,
    date: "2025-10-04",
    start: "19:00",
    end: "20:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 9,
    date: "2025-10-06",
    start: "10:00",
    end: "11:00",
    allDay: false,
    kind: "告別式",
    title: "告別式",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 10,
    date: "2025-10-10",
    start: "10:00",
    end: "11:00",
    allDay: false,
    kind: "告別式",
    title: "告別式",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 11,
    date: "2025-10-10",
    start: "14:00",
    end: "15:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 12,
    date: "2025-10-14",
    start: "09:00",
    end: "10:00",
    allDay: false,
    kind: "祝賀",
    title: "祝賀",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 13,
    date: "2025-10-17",
    start: "10:00",
    end: "11:00",
    allDay: false,
    kind: "告別式",
    title: "告別式",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 14,
    date: "2025-10-17",
    start: "15:00",
    end: "16:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 15,
    date: "2025-10-22",
    start: "09:30",
    end: "10:30",
    allDay: false,
    kind: "告別式",
    title: "告別式",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 16,
    date: "2025-10-22",
    start: "14:00",
    end: "15:00",
    allDay: false,
    kind: "會勘",
    title: "會勘",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 17,
    date: "2025-10-23",
    start: "10:00",
    end: "11:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 18,
    date: "2025-10-24",
    start: "10:00",
    end: "11:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 19,
    date: "2025-10-25",
    start: "09:30",
    end: "10:30",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 20,
    date: "2025-10-25",
    start: "14:00",
    end: "15:00",
    allDay: false,
    kind: "告別式",
    title: "告別式",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 21,
    date: "2025-10-25",
    start: "19:00",
    end: "20:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 22,
    date: "2025-10-28",
    start: "09:00",
    end: "10:00",
    allDay: false,
    kind: "會議",
    title: "會議",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 23,
    date: "2025-10-28",
    start: "14:00",
    end: "15:00",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 24,
    date: "2025-10-29",
    start: "09:00",
    end: "10:00",
    allDay: false,
    kind: "會議",
    title: "會議",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 25,
    date: "2025-10-30",
    start: "10:00",
    end: "11:00",
    allDay: false,
    kind: "會勘",
    title: "會勘",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 26,
    date: "2025-10-31",
    start: "09:30",
    end: "10:30",
    allDay: false,
    kind: "告別式",
    title: "告別式",
    location: "",
    note: "",
    visible: true,
  },
  {
    id: 27,
    date: "2025-10-31",
    start: "14:30",
    end: "15:30",
    allDay: false,
    kind: "邀請",
    title: "邀請",
    location: "",
    note: "",
    visible: true,
  },
];

const saving = ref(false);
const current = ref(dayjs("2025-10-01")); // 後台預設到對應月份

function monthStart() {
  return current.value.startOf("month");
}
function monthEnd() {
  return current.value.endOf("month");
}

const monthTitle = computed(() => current.value.format("YYYY年 M月"));

const monthRows = computed(() =>
  ALL_EVENTS.filter((e) =>
    dayjs(e.date).isBetween(monthStart(), monthEnd(), "day", "[]")
  ).sort((a, b) =>
    (a.date + (a.start || "00:00")).localeCompare(b.date + (b.start || "00:00"))
  )
);

function d(input, fmt) {
  return dayjs(input).format(fmt);
}
function tagType(kind) {
  if (kind === "會議") return "primary";
  if (kind === "邀請") return "";
  if (kind === "告別式") return "info";
  if (kind === "祝賀") return "success";
  if (kind === "會勘") return "warning";
  return "";
}

function gotoPrevMonth() {
  current.value = current.value.subtract(1, "month");
}
function gotoNextMonth() {
  current.value = current.value.add(1, "month");
}

function quickSave(row) {
  ElMessage.success("已更新顯示狀態");
}

function removeOne(id) {
  const i = ALL_EVENTS.findIndex((x) => x.id === id);
  if (i >= 0) {
    ALL_EVENTS.splice(i, 1);
    ElMessage.success("已刪除");
  }
}

/* 新增 / 編輯 */
const editor = reactive({
  visible: false,
  isNew: true,
  form: {
    id: 0,
    date: dayjs().format("YYYY-MM-DD"),
    start: "09:00",
    end: "10:00",
    allDay: false,
    kind: "會議",
    title: "",
    location: "",
    note: "",
    visible: true,
  },
});

function openEdit(row) {
  if (row) {
    editor.isNew = false;
    editor.form = { ...row };
  } else {
    editor.isNew = true;
    editor.form = {
      id: 0,
      date: current.value.format("YYYY-MM-DD"),
      start: "09:00",
      end: "10:00",
      allDay: false,
      kind: "會議",
      title: "",
      location: "",
      note: "",
      visible: true,
    };
  }
  editor.visible = true;
}

function saveEdit() {
  saving.value = true;
  setTimeout(() => {
    if (editor.isNew) {
      const maxId = ALL_EVENTS.length ? Math.max(...ALL_EVENTS.map((x) => x.id)) : 0;
      ALL_EVENTS.push({ ...editor.form, id: maxId + 1 });
      ElMessage.success("已新增行程");
    } else {
      const i = ALL_EVENTS.findIndex((x) => x.id === editor.form.id);
      if (i >= 0) {
        ALL_EVENTS[i] = { ...editor.form };
        ElMessage.success("已更新行程");
      }
    }
    editor.visible = false;
    saving.value = false;
  }, 250);
}

/* 匯出 ICS（當月、visible=true） */
function downloadICS() {
  const events = monthRows.value.filter((e) => e.visible);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lugu Township//Mayor Schedule//ZH-TW",
    "CALSCALE:GREGORIAN",
  ];
  for (const e of events) {
    const dtStart = e.allDay
      ? dayjs(e.date).format("YYYYMMDD")
      : dayjs(`${e.date} ${e.start}`).format("YYYYMMDDTHHmmss");
    const dtEnd = e.allDay
      ? dayjs(e.date).add(1, "day").format("YYYYMMDD")
      : dayjs(`${e.date} ${e.end}`).format("YYYYMMDDTHHmmss");
    const isAllDay = e.allDay;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@lugu.gov.tw`);
    lines.push(`SUMMARY:${e.title || e.kind}`);
    if (e.location) lines.push(`LOCATION:${e.location}`);
    if (e.note) lines.push(`DESCRIPTION:${e.note}`);
    if (isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mayor-schedule-${current.value.format("YYYYMM")}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
  ElMessage.success("已下載行程 .ics");
}
</script>
