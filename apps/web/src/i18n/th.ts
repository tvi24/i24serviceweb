import type { Dict } from './en';

// Thai translations. Interface text only; user-entered content is preserved as entered.
export const th: Dict = {
  // Common
  'common.loadFailed': 'โหลดข้อมูลไม่สำเร็จ',
  'common.failed': 'ไม่สำเร็จ',
  'common.dash': '—',
  'common.na': 'ไม่มีข้อมูล',
  'common.noData': 'ไม่มีข้อมูล',
  'error.title': 'เกิดข้อผิดพลาด',

  // App shell / nav
  'brand.name': 'ระบบจัดการเหตุการณ์',
  'nav.reportIncident': 'แจ้งเหตุการณ์',
  'nav.myIncidents': 'เหตุการณ์ของฉัน',
  'nav.controlTower': 'ศูนย์ควบคุม',
  'nav.dashboard': 'แดชบอร์ด',
  'nav.slaConfig': 'ตั้งค่า SLA',
  'shell.toggleNav': 'สลับเมนูนำทาง',
  'shell.alertCenter': 'ศูนย์แจ้งเตือน, ยังไม่อ่าน {count} รายการ',
  'shell.signOut': 'ออกจากระบบ',
  'shell.theme.toLight': 'เปลี่ยนเป็นธีมสว่าง',
  'shell.theme.toDark': 'เปลี่ยนเป็นธีมมืด',
  'shell.lang.label': 'ภาษา',

  // Access / not found
  'access.deniedTitle': 'ไม่มีสิทธิ์เข้าถึง',
  'access.deniedMsg': 'คุณไม่มีสิทธิ์ดูหน้านี้',
  'notFound.title': 'ไม่พบหน้า',
  'notFound.msg': 'ไม่มีหน้านี้อยู่ในระบบ',

  // Login
  'login.subtitle': 'เข้าสู่ระบบเพื่อดำเนินการต่อ',
  'login.username': 'ชื่อผู้ใช้',
  'login.password': 'รหัสผ่าน',
  'login.signIn': 'เข้าสู่ระบบ',
  'login.signingIn': 'กำลังเข้าสู่ระบบ…',
  'login.failed': 'เข้าสู่ระบบไม่สำเร็จ',
  'login.demoHint': 'ผู้ใช้ทดสอบสำหรับเวิร์กช็อป (รหัสผ่าน: {password})',

  // Intake
  'intake.title': 'แจ้งเหตุการณ์',
  'intake.subtitle': 'อธิบายปัญหาที่พบ ระบบจะสร้างหมายเลขตั๋วเพื่อใช้ติดตาม',
  'intake.titleLabel': 'หัวข้อ',
  'intake.descLabel': 'รายละเอียด',
  'intake.descHint': 'ระบุว่าเกิดอะไรขึ้น เมื่อไหร่ และมีผู้ได้รับผลกระทบกี่คน',
  'intake.impact': 'ผลกระทบ (ไม่บังคับ)',
  'intake.urgency': 'ความเร่งด่วน (ไม่บังคับ)',
  'intake.autoDetect': 'ตรวจจับอัตโนมัติ',
  'intake.submit': 'ส่งเหตุการณ์',
  'intake.submitting': 'กำลังส่ง…',
  'intake.submitFailed': 'ส่งไม่สำเร็จ',
  'intake.successTitle': 'ส่งเหตุการณ์เรียบร้อย',
  'intake.successBody': 'ระบบสร้างตั๋วของคุณแล้วและสามารถติดตามได้',
  'intake.ticketId': 'หมายเลขตั๋ว:',
  'intake.reportAnother': 'แจ้งเหตุการณ์อื่น',
  'intake.viewMine': 'ดูเหตุการณ์ของฉัน',

  // My incidents
  'my.title': 'เหตุการณ์ของฉัน',
  'my.subtitle': 'เหตุการณ์ที่คุณแจ้งไว้ คลิกที่แถวเพื่อดูรายละเอียด ยืนยัน หรือเปิดใหม่',
  'my.emptyTitle': 'ยังไม่มีเหตุการณ์',
  'my.emptyMsg': 'แจ้งเหตุการณ์แรกของคุณเพื่อเริ่มต้น',

  // Control tower
  'ct.title': 'ศูนย์ควบคุมเหตุการณ์',
  'ct.subtitle': 'เหตุการณ์ทั้งหมดพร้อมสถานะและระดับความสำคัญแบบเรียลไทม์',
  'ct.allStatuses': 'ทุกสถานะ',
  'ct.allPriorities': 'ทุกระดับความสำคัญ',
  'ct.filterStatus': 'กรองตามสถานะ',
  'ct.filterPriority': 'กรองตามระดับความสำคัญ',
  'ct.noMatchTitle': 'ไม่พบเหตุการณ์ที่ตรงกัน',
  'ct.noMatchMsg': 'ลองปรับตัวกรองดู',
  'ct.loadFailed': 'โหลดเหตุการณ์ไม่สำเร็จ',

  // Incident table
  'table.ticket': 'ตั๋ว',
  'table.title': 'หัวข้อ',
  'table.priority': 'ความสำคัญ',
  'table.status': 'สถานะ',
  'table.group': 'กลุ่ม',
  'table.created': 'สร้างเมื่อ',

  // Badges / SLA states
  'badge.unset': 'ยังไม่กำหนด',
  'badge.noSla': 'ไม่มี SLA',
  'sla.within_target': 'อยู่ในเป้าหมาย',
  'sla.at_risk': 'เสี่ยงเกิน',
  'sla.breached': 'เกินกำหนด',

  // Workspace
  'ws.notFound': 'ไม่พบเหตุการณ์',
  'ws.description': 'รายละเอียด',
  'ws.reporter': 'ผู้แจ้ง: {name}',
  'ws.owner': 'ผู้รับผิดชอบ: {name}',
  'ws.classification': 'ประเภท: {value}',
  'ws.unassigned': 'ยังไม่มอบหมาย',
  'ws.activity': 'กิจกรรม',
  'ws.auditHistory': 'ประวัติการตรวจสอบ',
  'ws.addNotePlaceholder': 'เพิ่มบันทึกการทำงาน…',
  'ws.workNoteAria': 'บันทึกการทำงาน',
  'ws.addNote': 'เพิ่มบันทึก',
  'ws.adding': 'กำลังเพิ่ม…',

  // Triage panel
  'triage.title': 'คัดแยก',
  'triage.classification': 'ประเภท',
  'triage.impact': 'ผลกระทบ',
  'triage.urgency': 'ความเร่งด่วน',
  'triage.priority': 'ความสำคัญ',
  'triage.getAi': 'ขอคำแนะนำจาก AI',
  'triage.suggested': 'แนะนำ: {classification} / {priority}',
  'triage.apply': 'ใช้คำแนะนำ',
  'triage.save': 'บันทึกการคัดแยก',
  'triage.saving': 'กำลังบันทึก…',

  // Assign panel
  'assign.title': 'การมอบหมาย',
  'assign.group': 'กลุ่มสนับสนุน',
  'assign.autoRules': 'อัตโนมัติ (ตามกฎ)',
  'assign.owner': 'ผู้รับผิดชอบ',
  'assign.unassigned': 'ยังไม่มอบหมาย',
  'assign.assign': 'มอบหมาย',
  'assign.autoRoute': 'จัดเส้นทางอัตโนมัติ',
  'assign.fallbackMsg': 'ไม่พบกลุ่มที่ตรงกัน — ส่งเข้าคิวสำรอง',
  'assign.assignedMsg': 'มอบหมายแล้ว',

  // Status panel
  'status.title': 'สถานะ',
  'status.moveTo': 'เปลี่ยนเป็น {status}',

  // Resolve panel
  'resolve.title': 'แก้ไขเสร็จสิ้น',
  'resolve.code': 'รหัสการแก้ไข',
  'resolve.selectCode': 'เลือก…',
  'resolve.note': 'บันทึกการแก้ไข',
  'resolve.markResolved': 'ทำเครื่องหมายว่าแก้ไขแล้ว',
  'resolve.resolving': 'กำลังบันทึก…',
  'resolve.resolvedTitle': 'แก้ไขแล้ว',
  'resolve.awaiting': 'รอผู้แจ้งยืนยัน รหัส: {code}',
  'resolve.closeNow': 'ปิดเลย',

  // Reporter panel
  'reporter.confirmTitle': 'ยืนยันการแก้ไข',
  'reporter.confirmBody': 'ปัญหาของคุณได้รับการแก้ไขแล้วหรือไม่?',
  'reporter.confirmBtn': 'ใช่ ยืนยันและปิด',
  'reporter.reopenTitle': 'เปิดใหม่',
  'reporter.reopenPlaceholder': 'เหตุผลในการเปิดใหม่…',
  'reporter.reopenBtn': 'เปิดเหตุการณ์ใหม่',
  'reporter.thankTitle': 'ขอบคุณ',
  'reporter.thankBody': 'คุณให้คะแนน {rating}/5',
  'reporter.rateTitle': 'ให้คะแนนประสบการณ์ของคุณ',
  'reporter.statusTitle': 'สถานะ',
  'reporter.statusBody': 'ทีมสนับสนุนกำลังดำเนินการกับเหตุการณ์ของคุณ',

  // Activity / audit timeline
  'activity.work_note': 'บันทึกการทำงาน',
  'activity.status_change': 'เปลี่ยนสถานะ',
  'activity.assignment': 'การมอบหมาย',
  'activity.resolution': 'แก้ไขแล้ว',
  'activity.reopen': 'เปิดใหม่',
  'activity.emptyTitle': 'ยังไม่มีกิจกรรม',
  'audit.emptyTitle': 'ไม่มีบันทึกการตรวจสอบ',
  'audit.by': 'โดย {actor}',

  // CSAT
  'csat.ratingAria': 'คะแนนความพึงพอใจ',
  'csat.starAria': '{n} ดาว',
  'csat.starAria_plural': '{n} ดาว',
  'csat.comment': 'ความคิดเห็น (ไม่บังคับ)',
  'csat.error': 'กรุณาเลือกคะแนนตั้งแต่ 1 ถึง 5',
  'csat.submit': 'ส่งคะแนน',
  'csat.submitting': 'กำลังส่ง…',

  // Alerts
  'alerts.title': 'ศูนย์แจ้งเตือนกลาง',
  'alerts.subtitle': 'การแจ้งเตือนความสำคัญ SLA สถานะ และการยกระดับที่ส่งถึงคุณ',
  'alerts.emptyTitle': 'ไม่มีการแจ้งเตือน',
  'alerts.emptyMsg': 'คุณจัดการครบทุกรายการแล้ว',
  'alerts.loadFailed': 'โหลดการแจ้งเตือนไม่สำเร็จ',
  'alerts.sev.danger': 'วิกฤต',
  'alerts.sev.warning': 'เตือน',
  'alerts.sev.info': 'ข้อมูล',
  'alerts.group': '{label} ({count})',
  'alerts.viewIncident': 'ดูเหตุการณ์',
  'alerts.acknowledged': 'รับทราบแล้ว',
  'alerts.acknowledge': 'รับทราบ',

  // Dashboard
  'dash.title': 'แดชบอร์ดเหตุการณ์และ KPI',
  'dash.subtitle': 'ประสิทธิภาพการดำเนินงานของเหตุการณ์ทั้งหมด',
  'dash.refresh': 'รีเฟรช',
  'dash.refreshing': 'กำลังรีเฟรช…',
  'dash.loadFailed': 'โหลด KPI ไม่สำเร็จ',
  'dash.emptyTitle': 'ยังไม่มีข้อมูล',
  'dash.emptyMsg': 'KPI จะแสดงเมื่อมีเหตุการณ์เกิดขึ้น',
  'dash.slaCompliance': 'อัตราทำตาม SLA',
  'dash.slaBreaches': 'จำนวนเกิน SLA',
  'dash.reopened': 'เปิดใหม่',
  'dash.avgCsat': 'CSAT เฉลี่ย',
  'dash.csatValue': '{value} / 5',
  'dash.byStatus': 'ตามสถานะ',
  'dash.byPriority': 'ตามความสำคัญ',
  'dash.aging': 'อายุงาน (ที่เปิดอยู่)',
  'dash.recurring': 'เหตุการณ์ที่เกิดซ้ำ',
  'dash.trend': 'แนวโน้ม',

  // SLA config
  'slacfg.title': 'ตั้งค่า SLA',
  'slacfg.subtitleEdit': 'เป้าหมายสำหรับเวิร์กช็อปที่แก้ไขได้',
  'slacfg.subtitleReadonly': 'เป้าหมายสำหรับเวิร์กช็อปที่แก้ไขได้ (อ่านอย่างเดียว — ต้องเป็นผู้จัดการจึงจะแก้ไขได้)',
  'slacfg.priority': 'ความสำคัญ',
  'slacfg.responseMin': 'ตอบสนอง (นาที)',
  'slacfg.resolution': 'แก้ไขเสร็จ',
  'slacfg.businessDays': '{n} วันทำการ',
  'slacfg.atRisk': 'เกณฑ์เสี่ยงเกิน (%)',
  'slacfg.reminderMax': 'เตือน CSAT (สูงสุด)',
  'slacfg.save': 'บันทึกการตั้งค่า',
  'slacfg.saving': 'กำลังบันทึก…',
  'slacfg.saved': 'บันทึกแล้ว',
  'slacfg.loadFailed': 'โหลดการตั้งค่าไม่สำเร็จ',
  'slacfg.bdAria': 'วันทำการแก้ไขเสร็จของ {priority}',

  // Enum: status
  'status.new': 'ใหม่',
  'status.triaged': 'คัดแยกแล้ว',
  'status.assigned': 'มอบหมายแล้ว',
  'status.in_progress': 'กำลังดำเนินการ',
  'status.pending': 'รอดำเนินการ',
  'status.resolved': 'แก้ไขแล้ว',
  'status.reopened': 'เปิดใหม่',
  'status.closed': 'ปิดแล้ว',
  'status.fallback': 'คิวสำรอง',

  // Enum: role
  'role.business_user': 'ผู้ใช้ทั่วไป',
  'role.service_desk': 'ศูนย์บริการ',
  'role.application_support': 'ทีมสนับสนุนแอปพลิเคชัน',
  'role.infrastructure_support': 'ทีมสนับสนุนโครงสร้างพื้นฐาน',
  'role.manager': 'ผู้จัดการ',
  'role.management': 'ผู้บริหาร',

  // Enum: impact / urgency
  'iu.high': 'สูง',
  'iu.medium': 'ปานกลาง',
  'iu.low': 'ต่ำ',

  // Enum: classification
  'class.application': 'แอปพลิเคชัน',
  'class.infrastructure': 'โครงสร้างพื้นฐาน',
  'class.network': 'เครือข่าย',
  'class.access': 'การเข้าถึง',
  'class.email': 'อีเมล',
  'class.other': 'อื่น ๆ',

  // Enum: support group
  'group.service_desk': 'ศูนย์บริการ',
  'group.application_support': 'ทีมสนับสนุนแอปพลิเคชัน',
  'group.infrastructure_support': 'ทีมสนับสนุนโครงสร้างพื้นฐาน',

  // Enum: resolution code
  'rescode.fixed': 'แก้ไขแล้ว',
  'rescode.workaround': 'วิธีแก้ชั่วคราว',
  'rescode.configuration_change': 'เปลี่ยนการตั้งค่า',
  'rescode.no_fault_found': 'ไม่พบข้อผิดพลาด',
  'rescode.duplicate': 'รายการซ้ำ',
  'rescode.user_error': 'ผู้ใช้ดำเนินการผิด',
};
