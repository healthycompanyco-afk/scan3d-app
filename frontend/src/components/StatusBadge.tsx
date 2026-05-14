const CONFIG: Record<string, { label: string; classes: string }> = {
  pending:    { label: 'A aguardar',   classes: 'bg-gray-100 text-gray-600' },
  extracting: { label: 'A extrair',    classes: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'A processar',  classes: 'bg-blue-100 text-blue-700' },
  done:       { label: 'Pronto',       classes: 'bg-green-100 text-green-700' },
  error:      { label: 'Erro',         classes: 'bg-red-100 text-red-600' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? CONFIG['pending']
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}
