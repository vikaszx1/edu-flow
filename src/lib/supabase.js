import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nzspjonqgjsbuibmxhdw.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Zw_He3LqfoMUXf9YC915Xw_-WaM6Ypx'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
