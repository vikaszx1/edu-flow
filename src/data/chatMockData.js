// ── Mock school members ───────────────────────────────────────────────────────
export const CONTACTS = [
  { id: 'u1', name: 'Ramesh Sharma', initials: 'RS', role: 'admin',   roleLabel: 'Principal', avColor: 'bl', online: true  },
  { id: 'u2', name: 'Anita Verma',   initials: 'AV', role: 'teacher', roleLabel: 'Teacher',   avColor: 'tl', online: true  },
  { id: 'u3', name: 'Raj Mehta',     initials: 'RM', role: 'teacher', roleLabel: 'Teacher',   avColor: 'pu', online: false },
  { id: 'u4', name: 'Priya Nair',    initials: 'PN', role: 'teacher', roleLabel: 'Teacher',   avColor: 'pk', online: true  },
  { id: 'u5', name: 'Arjun Patel',   initials: 'AP', role: 'student', roleLabel: 'Student',   avColor: 'am', online: true  },
  { id: 'u6', name: 'Sneha Rao',     initials: 'SR', role: 'student', roleLabel: 'Student',   avColor: 'co', online: false },
  { id: 'u7', name: 'Kiran Das',     initials: 'KD', role: 'student', roleLabel: 'Student',   avColor: 'gn', online: true  },
  { id: 'u8', name: 'Meera Gupta',   initials: 'MG', role: 'student', roleLabel: 'Student',   avColor: 'tl', online: false },
]

// ── Channels ──────────────────────────────────────────────────────────────────
export const CHANNELS = [
  { id: 'ch-general',  name: 'general',         description: 'School-wide discussions',              memberCount: 24, unread: 2 },
  { id: 'ch-announce', name: 'announcements',   description: 'Official notices from administration', memberCount: 24, unread: 1, readonly: true },
  { id: 'ch-teachers', name: 'teachers-lounge', description: 'Staff collaboration space',            memberCount: 8,  unread: 0 },
  { id: 'ch-10a',      name: 'class-10a',       description: 'Class 10-A students and teachers',     memberCount: 32, unread: 5 },
  { id: 'ch-10b',      name: 'class-10b',       description: 'Class 10-B students and teachers',     memberCount: 30, unread: 0 },
]

// ── Direct message threads ────────────────────────────────────────────────────
export const DMS = [
  { id: 'dm-u1', contactId: 'u1', unread: 0 },
  { id: 'dm-u2', contactId: 'u2', unread: 3 },
  { id: 'dm-u3', contactId: 'u3', unread: 0 },
  { id: 'dm-u4', contactId: 'u4', unread: 0 },
  { id: 'dm-u5', contactId: 'u5', unread: 1 },
]

// ── Files shared in channels ──────────────────────────────────────────────────
export const SHARED_FILES = {
  'ch-general': [
    { name: 'Academic_Calendar_2026.pdf', size: '1.2 MB', type: 'pdf', senderId: 'u1', timestamp: '2026-04-20T08:02:00' },
    { name: 'PTM_Notice_Apr2026.docx',    size: '48 KB',  type: 'doc', senderId: 'u4', timestamp: '2026-04-21T08:00:00' },
  ],
  'ch-announce': [
    { name: 'Sports_Day_Schedule.pdf',    size: '840 KB', type: 'pdf', senderId: 'u1', timestamp: '2026-04-20T10:00:00' },
    { name: 'Exam_Timetable_May2026.pdf', size: '520 KB', type: 'pdf', senderId: 'u1', timestamp: '2026-04-21T07:30:00' },
  ],
  'ch-teachers': [
    { name: 'Lesson_Plan_Template.docx',  size: '92 KB',  type: 'doc', senderId: 'u1', timestamp: '2026-04-20T11:00:00' },
  ],
  'ch-10a': [
    { name: 'Timetable_Week17.pdf',       size: '310 KB', type: 'pdf', senderId: 'u2', timestamp: '2026-04-21T08:10:00' },
  ],
}

// ── Messages ──────────────────────────────────────────────────────────────────
// senderId 'me' = current logged-in user
// reactions: [{ emoji, count, reacted }]  reacted = current user has reacted
// replyTo: { id, senderId, text } | null
export const MESSAGES = {
  'ch-general': [
    {
      id: 'g1', senderId: 'u1',
      text: "Good morning, EduFlow family! 🎉 Welcome back to a new semester. Let's make it our most productive one yet. Please check the updated academic calendar in the Academics section.",
      timestamp: '2026-04-20T08:02:00',
      reactions: [{ emoji: '👏', count: 5, reacted: false }, { emoji: '❤️', count: 3, reacted: true }],
      replyTo: null, edited: false, pinned: true, starred: false,
    },
    {
      id: 'g2', senderId: 'u2',
      text: "Good morning! Really excited about this semester. The new science lab equipment looks amazing.",
      timestamp: '2026-04-20T08:10:00',
      reactions: [{ emoji: '👍', count: 2, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'g3', senderId: 'u3',
      text: "I've uploaded the revised syllabus for all Maths classes to the Academics section. Please review and let me know if adjustments are needed.",
      timestamp: '2026-04-20T08:15:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'g4', senderId: 'me',
      text: "Thanks everyone! Quick reminder — all teachers please submit your lesson plans by this Friday EOD.",
      timestamp: '2026-04-20T09:30:00',
      reactions: [{ emoji: '✅', count: 3, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'g5', senderId: 'u4',
      text: "PTM is scheduled for next Saturday, 27th April. Please inform your students and send the parent notice home today.",
      timestamp: '2026-04-21T08:00:00',
      reactions: [{ emoji: '👍', count: 4, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'g6', senderId: 'u2',
      text: "Will do! I'll send the PTM notice with my class this afternoon.",
      timestamp: '2026-04-21T08:05:00',
      reactions: [],
      replyTo: { id: 'g5', senderId: 'u4', text: 'PTM is scheduled for next Saturday, 27th April...' },
      edited: false, pinned: false, starred: false,
    },
    {
      id: 'g7', senderId: 'u2',
      text: "Quick question — will the PTM be held in classrooms or the auditorium this time?",
      timestamp: '2026-04-21T08:06:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'g8', senderId: 'u1',
      text: "We'll use classrooms this time. Each teacher in their own assigned room. The schedule will be shared by tomorrow.",
      timestamp: '2026-04-21T09:15:00',
      reactions: [{ emoji: '✅', count: 3, reacted: true }],
      replyTo: { id: 'g7', senderId: 'u2', text: 'Quick question — will the PTM be held in classrooms...' },
      edited: false, pinned: false, starred: true,
    },
  ],
  'ch-announce': [
    {
      id: 'a1', senderId: 'u1',
      text: "📢 IMPORTANT: The annual school sports day is scheduled for 10th May. All students must participate in at least one event. Registration forms are available at the front office.",
      timestamp: '2026-04-20T10:00:00',
      reactions: [{ emoji: '🎉', count: 12, reacted: false }, { emoji: '👍', count: 8, reacted: true }],
      replyTo: null, edited: false, pinned: true, starred: false,
    },
    {
      id: 'a2', senderId: 'u1',
      text: "📚 Reminder: Half-yearly exams begin from 5th May. The complete timetable has been uploaded to the Timetable section. Students should begin preparation immediately.",
      timestamp: '2026-04-21T07:30:00',
      reactions: [{ emoji: '😮', count: 6, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
  'ch-teachers': [
    {
      id: 't1', senderId: 'u1',
      text: "Team, please submit your lesson plans for next month by this Friday. Use the new template shared on the admin portal.",
      timestamp: '2026-04-20T11:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 't2', senderId: 'u3',
      text: "Will do, sir. Should we include the planned assessment schedule in the lesson plan as well?",
      timestamp: '2026-04-20T11:15:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 't3', senderId: 'u1',
      text: "Yes, please include planned assessments for each unit. It makes the review process much easier.",
      timestamp: '2026-04-20T11:20:00',
      reactions: [{ emoji: '👍', count: 2, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 't4', senderId: 'u4',
      text: "Already submitted mine for all three sections! You should see them on the admin portal.",
      timestamp: '2026-04-20T14:05:00',
      reactions: [{ emoji: '🙏', count: 1, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 't5', senderId: 'u2',
      text: "Working on mine, will send by Thursday morning.",
      timestamp: '2026-04-21T08:30:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
  'ch-10a': [
    {
      id: 'c1', senderId: 'u2',
      text: "📝 Class 10-A! Please make sure you've submitted your Social Studies assignment by this Friday. It counts towards your internal assessment marks.",
      timestamp: '2026-04-20T09:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: true, starred: false,
    },
    {
      id: 'c2', senderId: 'u5',
      text: "Ma'am, I've already submitted mine yesterday evening!",
      timestamp: '2026-04-20T09:10:00',
      reactions: [{ emoji: '👍', count: 1, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'c3', senderId: 'u7',
      text: "Same here! Submitted this morning before school.",
      timestamp: '2026-04-20T09:12:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'c4', senderId: 'u6',
      text: "I'll submit by Thursday, ma'am. Is that okay?",
      timestamp: '2026-04-20T09:30:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'c5', senderId: 'u2',
      text: "Thursday is fine, Sneha. But please don't push it to Friday.",
      timestamp: '2026-04-20T09:35:00',
      reactions: [],
      replyTo: { id: 'c4', senderId: 'u6', text: "I'll submit by Thursday, ma'am. Is that okay?" },
      edited: false, pinned: false, starred: false,
    },
    {
      id: 'c6', senderId: 'u5',
      text: "Ma'am, will the exam timetable be shared in this channel or the main #general channel?",
      timestamp: '2026-04-21T07:45:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'c7', senderId: 'u2',
      text: "It'll be on #general and also uploaded to the Timetable section. I'll send you the link directly once it's up.",
      timestamp: '2026-04-21T08:10:00',
      reactions: [{ emoji: '🙏', count: 2, reacted: false }],
      replyTo: { id: 'c6', senderId: 'u5', text: "Ma'am, will the exam timetable be shared in this channel..." },
      edited: false, pinned: false, starred: false,
    },
    {
      id: 'c8', senderId: 'u7',
      text: "Thank you ma'am! 🙏",
      timestamp: '2026-04-21T08:11:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'c9', senderId: 'u8',
      text: "Thank you so much!",
      timestamp: '2026-04-21T08:11:30',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
  'ch-10b': [
    {
      id: 'b1', senderId: 'u4',
      text: "Class 10-B! Physics practicals are scheduled for next Wednesday. Please bring your lab coat and observation notebooks.",
      timestamp: '2026-04-21T09:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
  'dm-u1': [
    {
      id: 'd1u1', senderId: 'u1',
      text: "Good morning! Could you please review the updated admission policy document I shared on the portal?",
      timestamp: '2026-04-20T10:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd2u1', senderId: 'me',
      text: "Good morning, sir! Of course, I'll review it and send my feedback by this afternoon.",
      timestamp: '2026-04-20T10:05:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd3u1', senderId: 'me',
      text: "Done reviewing. A few suggestions around the late fee structure and the grace period. I'll drop a detailed note on the portal.",
      timestamp: '2026-04-20T14:30:00',
      reactions: [{ emoji: '👍', count: 1, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd4u1', senderId: 'u1',
      text: "Thank you! Let's discuss the finer points in tomorrow's staff meeting.",
      timestamp: '2026-04-20T15:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
  'dm-u2': [
    {
      id: 'd1u2', senderId: 'u2',
      text: "Hi! Do you have the updated timetable for next week? Haven't received it yet.",
      timestamp: '2026-04-21T07:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd2u2', senderId: 'me',
      text: "Yes, just finishing it up! Will upload it to the Timetable section by 9 AM.",
      timestamp: '2026-04-21T07:05:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd3u2', senderId: 'me',
      text: "Done! Just uploaded it. You should be able to see it now in the Timetable section.",
      timestamp: '2026-04-21T09:00:00',
      reactions: [{ emoji: '🙏', count: 1, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd4u2', senderId: 'u2',
      text: "Wonderful, thank you! One more thing — I think we should move the unit test to 28th April instead of 25th. Students need a couple more days to prepare.",
      timestamp: '2026-04-21T09:10:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd5u2', senderId: 'u2',
      text: "The 25th also clashes with the inter-school debate competition, so several students will be absent.",
      timestamp: '2026-04-21T09:11:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd6u2', senderId: 'me',
      text: "That's a valid point. Let me check with Raj and Priya first and then we can finalize the date.",
      timestamp: '2026-04-21T09:20:00',
      reactions: [],
      replyTo: { id: 'd4u2', senderId: 'u2', text: 'I think we should move the unit test to 28th April...' },
      edited: false, pinned: false, starred: false,
    },
    {
      id: 'd7u2', senderId: 'u2',
      text: "Sure, no rush at all! Thanks for looking into it 🙏",
      timestamp: '2026-04-21T09:22:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
  'dm-u3': [
    {
      id: 'd1u3', senderId: 'me',
      text: "Raj, have you reviewed the new question paper format I sent last week?",
      timestamp: '2026-04-19T14:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd2u3', senderId: 'u3',
      text: "Yes, went through it. The format looks solid. Should we use it for the upcoming unit test?",
      timestamp: '2026-04-19T16:30:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
    {
      id: 'd3u3', senderId: 'me',
      text: "Let's standardize it across all subjects from the next exam cycle.",
      timestamp: '2026-04-19T16:45:00',
      reactions: [{ emoji: '👍', count: 1, reacted: false }],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
  'dm-u4': [],
  'dm-u5': [
    {
      id: 'd1u5', senderId: 'u5',
      text: "Good afternoon, ma'am. I wanted to ask about the extra credit assignment you mentioned in today's class.",
      timestamp: '2026-04-21T13:00:00',
      reactions: [],
      replyTo: null, edited: false, pinned: false, starred: false,
    },
  ],
}
