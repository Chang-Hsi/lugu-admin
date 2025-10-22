// src/plugins/tinymce.ts

import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/models/dom';

import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';
import 'tinymce/plugins/code';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';
import 'tinymce/plugins/quickbars';
import 'tinymce/plugins/autolink';

// 這一行請移除（NPM 版沒有這個檔案，會報 Failed to resolve import）
// import 'tinymce/plugins/licensekeymanager';

import 'tinymce-i18n/langs/zh_TW.js';
import 'tinymce/skins/ui/oxide/skin.css';
