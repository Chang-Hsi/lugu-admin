<template>
  <!-- 新增 :tinymce 綁定本地實例，避免走 Tiny Cloud -->
  <Editor v-model="model" :init="init" :disabled="disabled" :tinymce="tinymce" />
</template>

<script setup>
// 說明：本組件使用本地安裝的 tinymce（NPM），不使用 Tiny Cloud

// 新增：引入本地 tinymce 實例，傳給 <Editor>
import tinymce from "tinymce/tinymce";

// TinyMCE 的資源與外掛在此統一 side-effect 載入
import "@/plugins/tinymce";

import { computed } from "vue";
import Editor from "@tinymce/tinymce-vue";

// v-model（保持原本行為）
const props = defineProps({
  modelValue: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get: () => props.modelValue || "",
  set: (v) => emit("update:modelValue", v),
});

const disabled = computed(() => !!props.disabled);

const init = {
  license_key: "gpl",
  language: "zh_TW",
  skin_url: false,
  content_css: false,

  // 初始最小高度（顯示時的起跳高度）
  min_height: 200,
  autoresize_min_height: 200,
  statusbar: false,
  resize: false,
  elementpath: false,

  // 啟用 autoresize 外掛
  plugins: "link lists table code image media autolink autoresize", // 新增 autoresize
  autoresize_bottom_margin: 16, // 內容底部留白
  autoresize_on_init: true, // 載入後立即依內容調整

  menubar: false,
  branding: false,
  toolbar:
    "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | " +
    "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code",

  // 若你之前關掉 quickbars，保持如下，不影響 autoresize
  quickbars_insert_toolbar: "",
  quickbars_selection_toolbar: "",

  content_style: `
    body{font-family:Arial,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans TC","Helvetica Neue",Arial;line-height:1.7;}
    img{max-width:100%;height:auto;}
  `,
};
</script>
