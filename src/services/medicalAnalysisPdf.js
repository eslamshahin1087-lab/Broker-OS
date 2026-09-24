
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('تعذر تحميل شعار Broker OS')
  const blob = await response.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function renderPageToJpeg(html, width = 794, height = 1123) {
  return new Promise((resolve, reject) => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
      '<foreignObject x="0" y="0" width="' + width + '" height="' + height + '">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + width + 'px;height:' + height + 'px;">' +
      html +
      '</div></foreignObject></svg>'

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    image.onerror = reject
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}

function base64ToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1]
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const output = new Uint8Array(total)
  let offset = 0
  parts.forEach((part) => {
    output.set(part, offset)
    offset += part.length
  })
  return output
}

function buildPdf(images, width = 794, height = 1123) {
  const encoder = new TextEncoder()
  const objects = []
  const pageObjectNumbers = []
  const imageObjectNumbers = []
  const contentObjectNumbers = []
  let nextObject = 3

  images.forEach(() => {
    pageObjectNumbers.push(nextObject++)
    imageObjectNumbers.push(nextObject++)
    contentObjectNumbers.push(nextObject++)
  })

  for (let index = 0; index < images.length; index += 1) {
    const imageObject = imageObjectNumbers[index]
    const contentObject = contentObjectNumbers[index]
    const pageObject = pageObjectNumbers[index]
    const jpeg = base64ToBytes(images[index])
    const content = 'q\n' + width + ' 0 0 ' + height + ' 0 0 cm\n/Im0 Do\nQ\n'

    objects.push({
      number: pageObject,
      bytes: encoder.encode(
        pageObject + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + width + ' ' + height + '] ' +
        '/Resources << /XObject << /Im0 ' + imageObject + ' 0 R >> >> /Contents ' + contentObject + ' 0 R >>\nendobj\n'
      ),
    })

    objects.push({
      number: imageObject,
      bytes: concatBytes([
        encoder.encode(
          imageObject + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + width +
          ' /Height ' + height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length +
          ' >>\nstream\n'
        ),
        jpeg,
        encoder.encode('\nendstream\nendobj\n'),
      ]),
    })

    objects.push({
      number: contentObject,
      bytes: encoder.encode(
        contentObject + ' 0 obj\n<< /Length ' + encoder.encode(content).length +
        ' >>\nstream\n' + content + 'endstream\nendobj\n'
      ),
    })
  }

  const pageKids = pageObjectNumbers.map((number) => number + ' 0 R').join(' ')
  objects.unshift({
    number: 2,
    bytes: encoder.encode(
      '2 0 obj\n<< /Type /Pages /Kids [' + pageKids + '] /Count ' + pageObjectNumbers.length + ' >>\nendobj\n'
    ),
  })
  objects.unshift({
    number: 1,
    bytes: encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
  })

  objects.sort((a, b) => a.number - b.number)

  const header = encoder.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')
  const parts = [header]
  const offsets = new Map()
  let offset = header.length

  objects.forEach((object) => {
    offsets.set(object.number, offset)
    parts.push(object.bytes)
    offset += object.bytes.length
  })

  const maxObject = nextObject - 1
  let xref = 'xref\n0 ' + (maxObject + 1) + '\n0000000000 65535 f \n'
  for (let number = 1; number <= maxObject; number += 1) {
    xref += String(offsets.get(number) || 0).padStart(10, '0') + ' 00000 n \n'
  }

  const trailer = 'trailer\n<< /Size ' + (maxObject + 1) + ' /Root 1 0 R >>\nstartxref\n' + offset + '\n%%EOF\n'
  parts.push(encoder.encode(xref + trailer))
  return concatBytes(parts)
}

function pageCss() {
  return [
    '*{box-sizing:border-box;}',
    'body{margin:0;font-family:Cairo,Tahoma,Arial,sans-serif;color:#1a2a4a;background:#fff;direction:rtl;}',
    '.page{width:794px;height:1123px;padding:42px 46px 36px;background:#fff;position:relative;overflow:hidden;}',
    '.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:2px solid #f2bd63;margin-bottom:22px;}',
    '.brand{display:flex;align-items:center;gap:12px;}',
    '.brand img{width:120px;max-height:45px;object-fit:contain;}',
    '.brand-title{font-size:18px;font-weight:900;color:#0e2a5c;}',
    '.brand-sub{font-size:10px;color:#718096;margin-top:2px;}',
    '.section{margin-bottom:18px;}',
    '.section-title{display:flex;align-items:center;gap:7px;color:#0e2a5c;font-size:15px;font-weight:900;margin-bottom:9px;}',
    '.dot{width:8px;height:8px;border-radius:50%;background:#f2bd63;}',
    '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}',
    '.kpi{border:1px solid #e2e9f2;border-radius:14px;padding:12px;background:linear-gradient(145deg,#fff,#f7f9fc);}',
    '.kpi small{color:#718096;font-size:9px;display:block;}',
    '.kpi strong{color:#0e2a5c;font-size:17px;display:block;margin-top:3px;}',
    '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
    '.card{border:1px solid #e2e9f2;border-radius:14px;padding:12px;background:#fff;}',
    '.card h3{margin:0 0 8px;color:#0e2a5c;font-size:12px;}',
    '.list{display:grid;gap:5px;}',
    '.row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed #e8edf3;padding:5px 0;font-size:9px;}',
    '.row:last-child{border-bottom:0;}',
    '.muted{color:#718096;}',
    '.gold{color:#b97713;font-weight:800;}',
    '.alert{border:1px solid #f2d6a0;background:#fff8ea;color:#7b5619;border-radius:12px;padding:9px 10px;font-size:9px;margin-bottom:7px;}',
    '.good{border-color:#b9e5cf;background:#f1fbf5;color:#1b6d49;}',
    '.footer{position:absolute;right:46px;left:46px;bottom:17px;display:flex;justify-content:space-between;gap:10px;color:#9aa6b5;font-size:7px;border-top:1px solid #e9eef4;padding-top:7px;}',
    'ul{margin:0;padding-right:16px;}',
    'li{margin-bottom:5px;font-size:9px;line-height:1.55;}',
    '.method{color:#4a5a7a;font-size:9px;line-height:1.7;}',
  ].join('')
}

function reportPage(title, subtitle, body, logoDataUrl, pageNumber, pageCount) {
  return '<style>' + pageCss() + '</style>' +
    '<div class="page" dir="rtl">' +
      '<div class="header">' +
        '<div class="brand">' +
          '<div><div class="brand-title">Broker OS</div><div class="brand-sub">Insurance Operating System</div></div>' +
          '<img src="' + logoDataUrl + '" alt="Broker OS" />' +
        '</div>' +
        '<div style="text-align:left;">' +
          '<div style="font-size:12px;font-weight:800;color:#0e2a5c;">' + escapeHtml(title) + '</div>' +
          '<div style="font-size:8px;color:#718096;margin-top:2px;">' + escapeHtml(subtitle) + '</div>' +
        '</div>' +
      '</div>' +
      body +
      '<div class="footer"><span>تقرير تحليلي - ليس تشخيصًا طبيًا ولا قرارًا آليًا بالمطالبة</span><span>' +
        pageNumber + ' / ' + pageCount + '</span></div>' +
    '</div>'
}

function money(value) {
  return Number(value || 0).toLocaleString('ar-EG') + ' ج.م'
}

function listRows(items, formatter) {
  return items.slice(0, 6).map((item) => {
    const label = formatter ? formatter(item) : item.key
    return '<div class="row"><span>' + escapeHtml(label) + '</span><strong class="gold">' + money(item.cost) + '</strong></div>'
  }).join('')
}

export async function downloadMedicalAnalysisPdf(report) {
  if (document.fonts?.ready) await document.fonts.ready
  const logoDataUrl = await imageUrlToDataUrl(report.logoUrl)
  const pageCount = 3

  const pages = [
    reportPage(
      'تحليل الاستهلاكات الطبية',
      report.generatedAt,
      '<div class="section"><div class="section-title"><span class="dot"></span>الملخص التنفيذي</div>' +
      '<div class="kpis">' +
        '<div class="kpi"><small>إجمالي الإنفاق</small><strong>' + money(report.totalCost) + '</strong></div>' +
        '<div class="kpi"><small>عدد الحركات</small><strong>' + report.totalEvents + '</strong></div>' +
        '<div class="kpi"><small>المستفيدون</small><strong>' + report.totalMembers + '</strong></div>' +
        '<div class="kpi"><small>متوسط الحركة</small><strong>' + money(report.avgEventCost) + '</strong></div>' +
      '</div></div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>أبرز الاستنتاجات</h3><ul>' + report.insights.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul></div>' +
        '<div class="card"><h3>مؤشرات التشغيل</h3><div class="list">' +
          '<div class="row"><span class="muted">خارج الشبكة</span><strong>' + report.networkOutRate + '%</strong></div>' +
          '<div class="row"><span class="muted">موافقات ناجحة</span><strong>' + report.approvalRate + '%</strong></div>' +
          '<div class="row"><span class="muted">معلق / تحت المراجعة</span><strong>' + report.pendingCount + '</strong></div>' +
          '<div class="row"><span class="muted">مرفوض</span><strong>' + report.rejectedCount + '</strong></div>' +
          '<div class="row"><span class="muted">حد التكلفة المرتفعة</span><strong>' + money(report.highCostThreshold) + '</strong></div>' +
          '<div class="row"><span class="muted">جودة البيانات</span><strong>' + report.completenessRate + '%</strong></div>' +
          '<div class="row"><span class="muted">تركيز أعلى 10%</span><strong>' + report.topMemberCostShare + '%</strong></div>' +
        '</div></div>' +
      '</div>' +
      '<div class="section" style="margin-top:14px;"><div class="section-title"><span class="dot"></span>أعلى الفئات</div><div class="card"><div class="list">' +
        listRows(report.topCategories) + '</div></div></div>' +
      '<div class="section"><div class="section-title"><span class="dot"></span>أعلى مقدمي الخدمة</div><div class="card"><div class="list">' +
        listRows(report.topProviders) + '</div></div></div>' +
      '<div class="section"><div class="section-title"><span class="dot"></span>اتجاه الإنفاق الشهري</div><div class="card"><div class="list">' +
        listRows(report.monthlyTrend.slice(-6), (item) => item.month + ' - ' + item.events + ' حركة') + '</div></div></div>',
      logoDataUrl,
      1,
      pageCount
    ),
    reportPage(
      'التفاصيل ومؤشرات المراجعة',
      'تحليل تشغيلي وإحصائي قابل للتفسير',
      '<div class="grid2">' +
        '<div class="card"><h3>الخدمات الأعلى إنفاقًا</h3><div class="list">' + listRows(report.topServices) + '</div></div>' +
        '<div class="card"><h3>التخصصات الأعلى إنفاقًا</h3><div class="list">' + listRows(report.topSpecialties) + '</div></div>' +
      '</div>' +
      '<div class="section" style="margin-top:14px;"><div class="section-title"><span class="dot"></span>أعلى المستفيدين حسب التكلفة</div>' +
        '<div class="card"><div class="list">' + listRows(report.topMembers, (item) => item.key + ' - ' + item.events + ' حركة') + '</div></div></div>' +
      '<div class="section"><div class="section-title"><span class="dot"></span>المؤشرات التي تحتاج مراجعة</div>' +
        (report.anomalyRows.length
          ? report.anomalyRows.slice(0, 7).map((row) =>
              '<div class="alert"><strong>' + escapeHtml(row.memberName || row.memberId || 'مستفيد غير محدد') + '</strong> - ' +
              escapeHtml(row.service || row.category || 'خدمة') + ' - ' + money(row.totalCost) + '<br>' +
              escapeHtml(row.reasons.join(' · ')) + '</div>'
            ).join('')
          : '<div class="alert good">لا توجد مؤشرات شاذة بارزة وفق قواعد التحليل الحالية.</div>') +
      '</div>' +
      '<div class="section"><div class="section-title"><span class="dot"></span>التوصيات التشغيلية</div><div class="card"><ul>' +
        report.recommendations.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') +
      '</ul></div></div>',
      logoDataUrl,
      2,
      pageCount
    ),
    reportPage(
      'المنهجية وسياسة الاستخدام',
      'الضوابط والحدود',
      '<div class="section"><div class="section-title"><span class="dot"></span>منهجية التحليل</div><div class="card method">' +
        'يعتمد هذا التقرير على تحليل إحصائي محلي داخل Broker OS يشمل التجميع، المتوسطات، الوسيط، الربعيات، قياس تركز التكلفة، الاتجاهات الشهرية، مؤشرات خارج الشبكة، الموافقات، والتكرارات المحتملة. النتائج مؤشرات تشغيلية وليست تشخيصًا أو رأيًا طبيًا.' +
      '</div></div>' +
      '<div class="section"><div class="section-title"><span class="dot"></span>سياسة الاستخدام</div><div class="card method">' +
        'يجب إدخال البيانات الضرورية فقط، وقصر الوصول على المستخدمين المصرح لهم، وعدم مشاركة تقرير الاستهلاكات الطبية إلا مع الأطراف المخولة. لا يعتمد النظام الحالي على إرسال البيانات الطبية إلى خدمة ذكاء اصطناعي خارجية.' +
      '</div></div>' +
      '<div class="section"><div class="section-title"><span class="dot"></span>الشروط والحدود</div><div class="card method">' +
        'لا يُستخدم التقرير لاتخاذ قرار طبي، ولا لرفض أو قبول مطالبة بشكل آلي، ولا لإثبات احتيال. أي مؤشر مرتفع أو شاذ يحتاج إلى مراجعة بشرية ووثائق مؤيدة قبل اتخاذ أي قرار تشغيلي أو مالي.' +
      '</div></div>' +
      '<div class="section"><div class="section-title"><span class="dot"></span>ملاحظة البيانات</div><div class="card method">' +
        'النسخة الحالية تعالج بيانات الاستهلاك داخل جلسة المتصفح ولا تحفظها تلقائيًا في Firestore. مسؤولية صحة البيانات، مشروعية جمعها، وإدارة الوصول إليها تقع على الجهة المستخدمة للتطبيق.' +
      '</div></div>',
      logoDataUrl,
      3,
      pageCount
    ),
  ]

  const pdfBytes = buildPdf(await Promise.all(pages.map((page) => renderPageToJpeg(page))))
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'broker-os-medical-utilization-analysis.pdf'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
