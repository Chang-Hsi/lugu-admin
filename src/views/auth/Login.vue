<template>
  <div class="grid min-h-screen grid-cols-2 bg-white">
    <!-- 左邊 -->
    <transition name="bounce-left">
      <section v-if="ready" class="flex items-center justify-center bg-emerald-300">
        <div class="text-center">
          <img src="../assets/svg/login.svg" alt="" />
          <h1 class="text-3xl font-extrabold">鹿谷後台管理系統</h1>
          <p class="mt-2">簡潔、快速、好維護</p>
        </div>
      </section>
    </transition>

    <!-- 右邊 -->
    <transition name="bounce-right">
      <section v-if="ready" class="flex items-center justify-center">
        <!-- 原登入區塊（切換條件：非註冊狀態） -->
        <div style="width: 680px; max-width: 90%" class="h-[700px] p-20 pt-32">
          <span class="text-3xl font-extrabold flex justify-center pb-10">登錄</span>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            label-style="font-size: 18px; font-weight: 600;"
            :show-message="true"
          >
            <el-form-item label="帳號" prop="username" :error="loginUserError">
              <el-input
                v-model="form.username"
                size="large"
                autocomplete="username"
                @keyup.enter="onSubmit"
              />
            </el-form-item>

            <!-- 修正：:error 綁定為 loginPassError -->
            <el-form-item label="密碼" prop="password" :error="loginPassError">
              <el-input
                type="password"
                v-model="form.password"
                size="large"
                autocomplete="current-password"
                @keyup.enter="onSubmit"
              />
            </el-form-item>

            <div class="flex justify-between items-center">
              <el-checkbox v-model="remember" label="記住我" size="large" />
              <div class="text-sm">忘記密碼</div>
            </div>

            <div class="flex flex-col gap-4 mt-6">
              <div class="w-full">
                <el-button
                  type="success"
                  size="large"
                  class="w-full"
                  :loading="loading"
                  @click="onSubmit"
                >
                  <span class="text-lg">登錄</span>
                </el-button>
              </div>
            </div>
          </el-form>
        </div>
      </section>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

/* 新增：是否顯示註冊頁 */
const isRegister = ref(false);

const router = useRouter();
const route = useRoute();

const ready = ref(false);
onMounted(() => {
  console.log("[Login] onMounted：目前 redirect 查詢參數 =", route.query.redirect || "/");
  // 觸發進場動畫
  requestAnimationFrame(() => {
    ready.value = true;
    console.log("[Login] 進場動畫觸發（isReady = true）");
  });
});

const formRef = ref();
const form = reactive({ username: "", password: "" });
const remember = ref(false);

const rules = {
  username: [{ required: true, message: "請輸入帳號", trigger: "blur" }],
  password: [{ required: true, message: "請輸入密碼", trigger: "blur" }],
};

// 讓「帳號/密碼錯誤」同時顯示在兩欄位下方
const loginUserError = ref("");
const loginPassError = ref("");

const loading = ref(false);

const onSubmit = () => {
  console.log("[Login] 點擊登入，開始表單驗證");
  loginUserError.value = "";
  loginPassError.value = "";

  formRef.value?.validate(async (valid) => {
    console.log("[Login] 表單驗證結果 valid =", valid);

    if (!valid) {
      console.log("[Login] 表單驗證未通過：缺少帳號或密碼");
      return;
    }

    loading.value = true;
    console.log("[Login] 進入模擬登入流程…");

    try {
      const masked = "*".repeat(form.password.length);
      console.log(
        `[Login] 使用者輸入：username="${form.username}", password="${masked}" (len=${form.password.length})`
      );

      // 模擬登入：只有 admin/admin 通過
      const ok = form.username === "admin" && form.password === "admin";
      console.log("[Login] 憑證比對結果 ok =", ok);

      if (!ok) {
        loginUserError.value = "帳號/密碼錯誤";
        loginPassError.value = "帳號/密碼錯誤";
        console.log("[Login] 登入失敗：帳號/密碼錯誤，已在兩個欄位顯示錯誤訊息");
        return;
      }

      // ❶ 先存 token（名稱需與守衛一致：'token'）
      localStorage.setItem("token", "demo-token");
      console.log('[Login] 登入成功：已寫入 localStorage("token")]');

      // ❷ 讀取 redirect，預設 '/'
      const redirect = route.query.redirect || "/";
      console.log("[Login] 導向目標 =", redirect);

      // ❸ 導回
      router.replace(redirect);
      console.log("[Login] 已呼叫 router.replace，等待路由切換");
    } catch (err) {
      console.error("[Login] 登入流程發生例外：", err);
    } finally {
      loading.value = false;
      console.log("[Login] 登入流程結束（loading = false）");
    }
  });
};

watch(
  () => [form.username, form.password],
  () => {
    if (loginUserError.value || loginPassError.value) {
      console.log("[Login] 偵測到輸入變更，清除欄位錯誤訊息");
    }
    loginUserError.value = "";
    loginPassError.value = "";
  }
);

/* 新增：註冊成功後的回調（可依需求自動帶入帳號或提示） */
const handleRegistered = (payload) => {
  console.log("[Login] 註冊成功：", payload);
  // 例如自動帶入帳號，減少再次輸入
  if (payload?.username) form.username = payload.username;
};
</script>

<style scoped>
:deep(.el-form-item__label) {
  font-size: 18px;
  font-weight: 500;
}

/* 左半進場（滑入 + 輕微反彈） */
.bounce-left-enter-from {
  opacity: 0;
  transform: translateX(-80px);
}
.bounce-left-enter-active {
  animation: bounceInLeft 0.7s ease-out both;
}

/* 右半進場（滑入 + 輕微反彈） */
.bounce-right-enter-from {
  opacity: 0;
  transform: translateX(80px);
}
.bounce-right-enter-active {
  animation: bounceInRight 0.7s ease-out both;
}

@keyframes bounceInLeft {
  0% {
    opacity: 0;
    transform: translateX(-80px);
  }
  60% {
    opacity: 1;
    transform: translateX(0);
  }
  75% {
    transform: translateX(-14px);
  }
  90% {
    transform: translateX(0);
  }
  95% {
    transform: translateX(-6px);
  }
  100% {
    transform: translateX(0);
  }
}
@keyframes bounceInRight {
  0% {
    opacity: 0;
    transform: translateX(80px);
  }
  60% {
    opacity: 1;
    transform: translateX(0);
  }
  75% {
    transform: translateX(14px);
  }
  90% {
    transform: translateX(0);
  }
  95% {
    transform: translateX(6px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
