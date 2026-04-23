import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import useStore from '../store/useStore'

const toast = (type, msg) => useStore.getState().toast(type, msg)

// ── Helpers ───────────────────────────────────────────────────────────────────
const AV_COLORS = ['bl', 'tl', 'co', 'pu', 'am', 'pk', 'gn']
const ROLE_LABELS = { admin: 'Principal', teacher: 'Teacher', student: 'Student', superadmin: 'Super Admin' }

function avColor(id = '') {
  const sum = [...id].reduce((a, c) => a + c.charCodeAt(0), 0)
  return AV_COLORS[sum % AV_COLORS.length]
}
function initials(name = '') {
  return name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
}
function shapeUser(u) {
  if (!u) return null
  return { ...u, initials: initials(u.name), avColor: avColor(u.id), roleLabel: ROLE_LABELS[u.role] ?? u.role }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export default function useChat() {
  const { schoolId, userId } = useStore()

  const [contacts, setContacts]       = useState([])
  const [channels, setChannels]       = useState([])
  const [dms, setDms]                 = useState([])
  const [messages, setMessages]       = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(false)

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId || !userId) return
    setLoading(true)
    Promise.all([loadContacts(), loadChannels(), loadDms()])
      .finally(() => setLoading(false))
  }, [schoolId, userId])

  // ── Contacts ─────────────────────────────────────────────────────────────────
  async function loadContacts() {
    const { data } = await supabase
      .from('users')
      .select('id, name, role, email')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .neq('id', userId)
      .order('role').order('name')

    if (!data?.length) return

    // Enrich students with their class label
    const studentIds = data.filter(u => u.role === 'student').map(u => u.id)
    let classMap = {}
    if (studentIds.length) {
      const { data: rows } = await supabase
        .from('students')
        .select('user_id, classes(grade, section)')
        .in('user_id', studentIds)
        .eq('school_id', schoolId)
      classMap = Object.fromEntries(
        (rows || []).map(s => [s.user_id, s.classes ? `${s.classes.grade}-${s.classes.section}` : null])
      )
    }

    setContacts(data.map(u => ({
      ...shapeUser(u),
      classLabel: u.role === 'student' ? (classMap[u.id] ?? null) : null,
    })))
  }

  // ── Channels ─────────────────────────────────────────────────────────────────
  async function loadChannels() {
    const { data: convs } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('school_id', schoolId)
      .eq('type', 'channel')
      .order('name')

    if (!convs?.length) return

    // Get this user's last_read per channel
    const { data: parts } = await supabase
      .from('chat_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .in('conversation_id', convs.map(c => c.id))

    const readMap = Object.fromEntries((parts || []).map(p => [p.conversation_id, p.last_read_at]))

    // Unread counts in parallel
    const withUnread = await Promise.all(
      convs.map(async ch => {
        const lastRead = readMap[ch.id]
        if (!lastRead) return { ...ch, unread: 0 }
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', ch.id)
          .gt('created_at', lastRead)
          .neq('sender_id', userId)
        return { ...ch, unread: count || 0 }
      })
    )
    setChannels(withUnread)
  }

  // ── DMs ───────────────────────────────────────────────────────────────────────
  async function loadDms() {
    // Conversations where I'm a participant AND type = 'dm' AND same school
    const { data: myParts } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', userId)

    if (!myParts?.length) return
    const convIds = myParts.map(p => p.conversation_id)

    const { data: dmConvs } = await supabase
      .from('chat_conversations')
      .select('id')
      .in('id', convIds)
      .eq('type', 'dm')
      .eq('school_id', schoolId)

    if (!dmConvs?.length) return

    // Get the OTHER participant for each DM
    const { data: otherParts } = await supabase
      .from('chat_participants')
      .select('conversation_id, user_id, users!inner(id, name, role, email, is_active)')
      .in('conversation_id', dmConvs.map(c => c.id))
      .neq('user_id', userId)

    // Enrich student DM contacts with class label
    const studentIds = (otherParts || [])
      .filter(p => p.users?.role === 'student' && p.users?.is_active)
      .map(p => p.user_id)

    let classMap = {}
    if (studentIds.length) {
      const { data: rows } = await supabase
        .from('students')
        .select('user_id, classes(grade, section)')
        .in('user_id', studentIds)
        .eq('school_id', schoolId)
      classMap = Object.fromEntries(
        (rows || []).map(s => [s.user_id, s.classes ? `${s.classes.grade}-${s.classes.section}` : null])
      )
    }

    const shaped = (otherParts || [])
      .filter(p => p.users?.is_active)
      .map(p => ({
        id: p.conversation_id,
        contact: {
          ...shapeUser(p.users),
          classLabel: p.users?.role === 'student' ? (classMap[p.user_id] ?? null) : null,
        },
        unread: 0,
      }))

    setDms(shaped)
  }

  // ── Select conversation ───────────────────────────────────────────────────────
  const selectConv = useCallback(async (convId) => {
    setActiveConvId(convId)
    setMsgsLoading(true)
    setMessages([])

    const { data } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(id, name, role),
        reply_to:chat_messages!reply_to_id(
          id, content,
          reply_sender:users!sender_id(name)
        )
      `)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    setMessages((data || []).map(m => ({ ...m, sender: shapeUser(m.sender) })))
    setMsgsLoading(false)

    // Mark as read
    await supabase
      .from('chat_participants')
      .upsert(
        { conversation_id: convId, user_id: userId, last_read_at: new Date().toISOString() },
        { onConflict: 'conversation_id,user_id' }
      )

    setChannels(prev => prev.map(c => c.id === convId ? { ...c, unread: 0 } : c))
    setDms(prev => prev.map(d => d.id === convId ? { ...d, unread: 0 } : d))
  }, [userId])

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content, replyToId = null) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: activeConvId,
        school_id: schoolId,
        sender_id: userId,
        content: content.trim(),
        reply_to_id: replyToId || null,
      })
      .select(`
        *,
        sender:users!sender_id(id, name, role),
        reply_to:chat_messages!reply_to_id(
          id, content,
          reply_sender:users!sender_id(name)
        )
      `)
      .single()

    if (error) { toast('error', 'Failed to send message'); return { error } }
    if (data) setMessages(prev => [...prev, { ...data, sender: shapeUser(data.sender) }])
    return { error: null }
  }, [activeConvId, schoolId, userId])

  // ── Edit message ──────────────────────────────────────────────────────────────
  const editMessage = useCallback(async (msgId, content) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ content: content.trim(), is_edited: true })
      .eq('id', msgId)
      .eq('sender_id', userId)

    if (error) { toast('error', 'Could not edit message'); return }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: content.trim(), is_edited: true } : m))
  }, [userId])

  // ── Delete message ────────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (msgId) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', msgId)
    if (error) { toast('error', 'Could not delete message'); return }
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }, [])

  // ── Toggle reaction ───────────────────────────────────────────────────────────
  const toggleReaction = useCallback(async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return

    const reactions = Array.isArray(msg.reactions) ? msg.reactions : []
    const existing = reactions.find(r => r.emoji === emoji)
    let newReactions

    if (!existing) {
      newReactions = [...reactions, { emoji, user_ids: [userId] }]
    } else if (existing.user_ids.includes(userId)) {
      const ids = existing.user_ids.filter(id => id !== userId)
      newReactions = ids.length
        ? reactions.map(r => r.emoji === emoji ? { ...r, user_ids: ids } : r)
        : reactions.filter(r => r.emoji !== emoji)
    } else {
      newReactions = reactions.map(r =>
        r.emoji === emoji ? { ...r, user_ids: [...r.user_ids, userId] } : r
      )
    }

    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: newReactions } : m))
    await supabase.from('chat_messages').update({ reactions: newReactions }).eq('id', msgId)
  }, [messages, userId])

  // ── Pin message ───────────────────────────────────────────────────────────────
  const pinMessage = useCallback(async (msgId, pinned) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_pinned: pinned })
      .eq('id', msgId)
    if (!error)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: pinned } : m))
  }, [])

  // ── Start DM ──────────────────────────────────────────────────────────────────
  const startDm = useCallback(async (contactId) => {
    const existing = dms.find(d => d.contact?.id === contactId)
    if (existing) { selectConv(existing.id); return }

    const { data: convId, error } = await supabase
      .rpc('start_dm_conversation', { target_user_id: contactId })

    if (error || !convId) {
      toast('error', 'Could not start conversation. ' + (error?.message ?? ''))
      return
    }

    const contact = contacts.find(c => c.id === contactId)
    setDms(prev => [{ id: convId, contact, unread: 0 }, ...prev])
    selectConv(convId)
  }, [dms, contacts, selectConv])

  // ── Real-time: keep activeConvId in a ref so background callbacks stay current ──
  const activeConvIdRef = useRef(activeConvId)
  useEffect(() => { activeConvIdRef.current = activeConvId }, [activeConvId])

  // ── Real-time: active conversation (INSERT / UPDATE / DELETE) ─────────────────
  useEffect(() => {
    if (!activeConvId || !userId) return

    const ch = supabase
      .channel(`conv:${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages',
          filter: `conversation_id=eq.${activeConvId}` },
        async (payload) => {
          const raw = payload.new
          if (raw.sender_id === userId) return   // already added optimistically

          // Fetch full message with joined sender + reply_to
          const { data } = await supabase
            .from('chat_messages')
            .select(`*, sender:users!sender_id(id, name, role),
              reply_to:chat_messages!reply_to_id(id, content, reply_sender:users!sender_id(name))`)
            .eq('id', raw.id)
            .single()

          if (!data) return
          setMessages(prev => prev.find(m => m.id === data.id)
            ? prev
            : [...prev, { ...data, sender: shapeUser(data.sender) }]
          )

          // Mark as read since user is viewing this conversation
          supabase.from('chat_participants').upsert(
            { conversation_id: activeConvId, user_id: userId, last_read_at: new Date().toISOString() },
            { onConflict: 'conversation_id,user_id' }
          )
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages',
          filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          const updated = payload.new
          setMessages(prev => prev.map(m =>
            m.id === updated.id
              ? { ...m, content: updated.content, is_edited: updated.is_edited,
                  is_pinned: updated.is_pinned, reactions: updated.reactions }
              : m
          ))
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages',
          filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [activeConvId, userId])

  // ── Real-time: background unread counter for all other conversations ──────────
  useEffect(() => {
    if (!userId || !schoolId) return

    const ch = supabase
      .channel(`unread:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages',
          filter: `school_id=eq.${schoolId}` },
        (payload) => {
          const msg = payload.new
          if (msg.sender_id === userId) return              // own message
          if (msg.conversation_id === activeConvIdRef.current) return  // already viewing

          setChannels(prev => prev.map(c =>
            c.id === msg.conversation_id ? { ...c, unread: (c.unread || 0) + 1 } : c
          ))
          setDms(prev => prev.map(d =>
            d.id === msg.conversation_id ? { ...d, unread: (d.unread || 0) + 1 } : d
          ))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [userId, schoolId])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const activeConv =
    channels.find(c => c.id === activeConvId) ||
    dms.find(d => d.id === activeConvId) ||
    null

  const totalUnread =
    channels.reduce((s, c) => s + (c.unread || 0), 0) +
    dms.reduce((s, d) => s + (d.unread || 0), 0)

  return {
    contacts, channels, dms, messages, activeConvId, activeConv, totalUnread,
    loading, msgsLoading,
    selectConv, sendMessage, editMessage, deleteMessage,
    toggleReaction, pinMessage, startDm,
  }
}
