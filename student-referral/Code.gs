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

var LOGO_B64 = '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';
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
  if (!d || d.indexOf('data:image/png;base64,') !== 0) return '&nbsp;';
  return '<img src="' + d + '" height="42"/>';
}

function row_(label, name, sig, date) {
  return '<table width="100%" cellpadding="4"><tr>' +
    '<td valign="middle" width="36%"><b>' + label + ' /</b> ' + esc_(name) + '</td>' +
    '<td valign="middle" width="34%"><table cellpadding="0" cellspacing="0"><tr><td valign="middle"><b>التوقيع /</b>&nbsp;</td><td valign="middle">' + sigImg_(sig) + '</td></tr></table></td>' +
    '<td valign="middle"><b>التاريخ :</b> ' + esc_(date) + '</td></tr></table>';
}

function makePdf_(rec, id) {
  var t = rec.t || {}, a = rec.a || {}, c = rec.c || {};
  var reasons = (t.reasons || []).map(function (r) {
    return r === 'أخرى' ? 'أخرى' + (t.otherTxt ? ' (' + t.otherTxt + ')' : '') : r;
  }).join('، ');
  var html =
    '<html><head><meta charset="utf-8"></head><body dir="rtl" style="font-family:Arial,sans-serif;font-size:13px;direction:rtl;text-align:right">' +
    '<div style="border:2px solid #000;padding:14px">' +
    '<table width="100%"><tr><td valign="middle" align="right" style="line-height:1.8">المملكة العربية السعودية<br>وزارة التعليم<br>إدارة التعليم بعسير<br>ابتدائية الأبناء الخامسة للطفولة المبكرة والروضة الملحقة بها</td>' +
    '<td width="130" align="left" valign="middle"><img src="data:image/jpeg;base64,' + LOGO_B64 + '" width="115"/></td></tr></table>' +
    '<hr><table width="100%"><tr><td><b>اسم النموذج :</b> تحويل طالبة لوكيلة شؤون الطالبات</td><td align="left"><b>رمز النموذج :</b> ( و.ط.ع.ن - ٠٤ - ٠٣ )</td></tr></table>' +
    '<h2 style="text-align:center">تحويل طالبة لوكيلة شؤون الطالبات</h2>' +
    '<p><b>اسم الطالبة /</b> ' + esc_(t.student) + ' &nbsp;&nbsp; <b>بالصف /</b> ' + esc_(t.grade) + ' ' + esc_(t.section) + '</p>' +
    '<p><b>المادة /</b> ' + esc_(t.subject) + ' &nbsp;&nbsp; <b>الحصة الدراسية /</b> ' + esc_(t.period) + '</p>' +
    '<p><b>سبب التحويل :</b> ' + esc_(reasons) + '</p>' +
    '<p><b>إيضاح المشكلة :</b><br>' + esc_(t.issue).replace(/\n/g, '<br>') + '</p>' +
    row_('اسم المعلمة', t.tname, t.sig, t.tdate) +
    '<hr><p><b>ما تم حيال الطالبة : ( خاص بوكيلة المدرسة ) :</b><br>' + esc_(a.agentAct).replace(/\n/g, '<br>') + '</p>' +
    (a.toC ? '<p>☑ تمت إحالتها إلى الموجهة الطلابية .</p>' : '') +
    row_('وكيلة المدرسة', a.aname, a.sig, a.adate) +
    (a.toC || c.cAct ?
      '<hr><p><b>ما تم حيال الطالبة : ( خاص بالموجهة الطلابية ) :</b><br>' + esc_(c.cAct).replace(/\n/g, '<br>') + '</p>' +
      row_('الموجهة الطلابية', c.cname, c.sig, c.cdate) : '') +
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
