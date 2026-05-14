import { createClient } from '@supabase/supabase-js'

const SURL = 'https://papimnhnmnbkmtczshaa.supabase.co'
const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcGltbmhubW5ia210Y3pzaGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjE5ODYsImV4cCI6MjA5Mzg5Nzk4Nn0.FWW7betV-K59LepczG9oKKYe7V1kI1krJ031tDRPVjk'

export const sb = createClient(SURL, SKEY)
