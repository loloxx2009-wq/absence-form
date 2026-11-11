/**
 * حفظ تحويلات الطالبات في Google Drive (خاص بصاحبة الحساب).
 *
 * الإعداد (مرة واحدة):
 *  1) script.google.com > مشروع جديد > الصقي هذا الكود في Code.gs واحفظي.
 *  2) نشر (Deploy) > نشر جديد (New deployment) > النوع: تطبيق ويب (Web app)
 *       تنفيذ باسم (Execute as): أنا (Me)
 *       من لديه صلاحية الوصول (Who has access): أي شخص (Anyone)
 *     ثم وافقي على الأذونات (Drive + البريد).
 *  3) انسخي رابط تطبيق الويب (ينتهي بـ /exec) وأرسليه لـ Claude ليضعه في الصفحة.
 *
 * ملاحظة أمان: كل تحويل له رمز عشوائي طويل في الرابط، ولا يمكن فتحه بدونه.
 * الملفات تُحفظ في مجلد «تحويلات الطالبات» في درايفك أنتِ فقط، ولا يُشارَك مع أحد.
 */

var FOLDER_NAME = 'تحويلات الطالبات';
var ID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function find_(id) {
  var it = folder_().getFilesByName('record_' + id + '.json');
  return it.hasNext() ? it.next() : null;
}

function doGet(e) {
  try {
    var id = (e && e.parameter && e.parameter.id) || '';
    if (!ID_RE.test(id)) return out_({ ok: false, error: 'رابط غير صحيح' });
    var f = find_(id);
    if (!f) return out_({ ok: false, error: 'لم يُعثر على التحويل' });
    return out_({ ok: true, record: JSON.parse(f.getBlob().getDataAsString()) });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var rec = body.record;
    if (!rec || typeof rec !== 'object') return out_({ ok: false, error: 'بيانات ناقصة' });

    var id = body.id;
    var file = null;
    if (id) {
      if (!ID_RE.test(id)) return out_({ ok: false, error: 'رابط غير صحيح' });
      file = find_(id);
      if (!file) return out_({ ok: false, error: 'لم يُعثر على التحويل' });
      var old = JSON.parse(file.getBlob().getDataAsString());
      if (old.stage === 'done') return out_({ ok: false, error: 'اكتمل هذا التحويل ولا يمكن تعديله' });
    } else {
      id = Utilities.getUuid();
    }

    var json = JSON.stringify(rec);
    if (file) file.setContent(json);
    else folder_().createFile('record_' + id + '.json', json, MimeType.PLAIN_TEXT);

    if (action === 'finalize') {
      rec.stage = 'done';
      var pdf = makePdf_(rec, id);
      var saved = folder_().createFile(pdf);
      try {
        MailApp.sendEmail({
          to: Session.getEffectiveUser().getEmail(),
          subject: 'تحويل طالبة مكتمل: ' + (rec.t && rec.t.student ? rec.t.student : ''),
          body: 'اكتمل تحويل الطالبة وحُفظ في مجلد «' + FOLDER_NAME + '» في الدرايف. النسخة مرفقة.',
          attachments: [pdf]
        });
      } catch (mailErr) { /* الحفظ نجح حتى لو تعذر البريد */ }
      return out_({ ok: true, id: id, pdfUrl: saved.getUrl() });
    }
    return out_({ ok: true, id: id });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function sigImg_(d) {
  if (!d || d.indexOf('data:image/png;base64,') !== 0) return '<div style="height:50px"></div>';
  return '<img src="' + d + '" style="height:50px"/>';
}

function makePdf_(rec, id) {
  var t = rec.t || {}, a = rec.a || {}, c = rec.c || {};
  var reasons = (t.reasons || []).map(function (r) {
    return r === 'أخرى' ? 'أخرى' + (t.otherTxt ? ' (' + t.otherTxt + ')' : '') : r;
  }).join('، ');
  var html =
    '<html><head><meta charset="utf-8"></head><body dir="rtl" style="font-family:Arial,sans-serif;font-size:13px;direction:rtl;text-align:right">' +
    '<div style="border:2px solid #000;padding:14px">' +
    '<div style="line-height:1.8">المملكة العربية السعودية<br>وزارة التعليم<br>إدارة التعليم بعسير<br>ابتدائية الأبناء الخامسة للطفولة المبكرة والروضة الملحقة بها</div>' +
    '<hr><table width="100%"><tr><td><b>اسم النموذج :</b> تحويل طالبة لوكيلة شؤون الطالبات</td><td align="left"><b>رمز النموذج :</b> ( و.ط.ع.ن - ٠٤ - ٠٣ )</td></tr></table>' +
    '<h2 style="text-align:center">تحويل طالبة لوكيلة شؤون الطالبات</h2>' +
    '<p><b>اسم الطالبة /</b> ' + esc_(t.student) + ' &nbsp;&nbsp; <b>بالصف /</b> ' + esc_(t.grade) + ' ' + esc_(t.section) + '</p>' +
    '<p><b>المادة /</b> ' + esc_(t.subject) + ' &nbsp;&nbsp; <b>الحصة الدراسية /</b> ' + esc_(t.period) + '</p>' +
    '<p><b>سبب التحويل :</b> ' + esc_(reasons) + '</p>' +
    '<p><b>إيضاح المشكلة :</b><br>' + esc_(t.issue).replace(/\n/g, '<br>') + '</p>' +
    '<table width="100%"><tr><td><b>اسم المعلمة /</b> ' + esc_(t.tname) + '</td><td><b>التوقيع /</b> ' + sigImg_(t.sig) + '</td><td><b>التاريخ :</b> ' + esc_(t.tdate) + '</td></tr></table>' +
    '<hr><p><b>ما تم حيال الطالبة : ( خاص بوكيلة المدرسة ) :</b><br>' + esc_(a.agentAct).replace(/\n/g, '<br>') + '</p>' +
    (a.toC ? '<p>☑ تمت إحالتها إلى الموجهة الطلابية .</p>' : '') +
    '<table width="100%"><tr><td><b>وكيلة المدرسة /</b> ' + esc_(a.aname) + '</td><td><b>التوقيع /</b> ' + sigImg_(a.sig) + '</td><td><b>التاريخ :</b> ' + esc_(a.adate) + '</td></tr></table>' +
    (a.toC || c.cAct ?
      '<hr><p><b>ما تم حيال الطالبة : ( خاص بالموجهة الطلابية ) :</b><br>' + esc_(c.cAct).replace(/\n/g, '<br>') + '</p>' +
      '<table width="100%"><tr><td><b>الموجهة الطلابية /</b> ' + esc_(c.cname) + '</td><td><b>التوقيع /</b> ' + sigImg_(c.sig) + '</td><td><b>التاريخ :</b> ' + esc_(c.cdate) + '</td></tr></table>' : '') +
    '<hr><p style="font-size:11px"><b>ملاحظات :</b><br>' +
    '١- يتم إخطار وكيلة شؤون الطالبات حسب هذا النموذج بعد انتهاء الحصة الدراسية .<br>' +
    '٢- تقوم وكيلة شؤون الطالبات باستدعاء الطالبة في وقت لا يؤثر عليها دراسياً .<br>' +
    '٣- يتم تحويل الطالبة إلى الموجهة في حالة تكرار السلوك أو الضعف الدراسي .<br>' +
    '٤- تقوم الموجهة الطلابية بإخطار المعلمة بما تم حيال الطالبة .<br>' +
    '٥- يحفظ هذا النموذج لدى وكيلة شؤون الطالبات ونسخة لدى الموجهة الطلابية .</p>' +
    '</div></body></html>';
  var name = 'تحويل_' + String(t.student || 'طالبة').replace(/[\\/:*?"<>|]/g, '') + '_' + Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd_HHmm') + '.pdf';
  return Utilities.newBlob(html, 'text/html', 'f.html').getAs('application/pdf').setName(name);
}
