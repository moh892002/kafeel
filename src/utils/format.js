/** Shared formatting helpers */

export const fmtDate = (iso) =>
  new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))

export const num = (n) => n.toLocaleString('en-US')
