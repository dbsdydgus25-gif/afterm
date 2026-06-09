import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function retrigger() {
  const { data: yoonCases } = await supabase.from('cases').select('id, deceased_name').like('deceased_name', '%테스트%')
  if (!yoonCases || yoonCases.length === 0) return console.log('테스트 케이스 없음')

  const caseId = yoonCases[0].id
  console.log(`Triggering verify for case: ${caseId} (${yoonCases[0].deceased_name})`)

  const { data: docs } = await supabase.from('case_documents').select('id, status').eq('case_id', caseId)
  
  if (docs) {
    for (const doc of docs) {
      console.log(`Retriggering doc: ${doc.id} (current status: ${doc.status})`)
      const res = await fetch(`http://localhost:3000/api/agents/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id })
      })
      const result = await res.json()
      console.log('Result:', result)
    }
  }
}

retrigger()
