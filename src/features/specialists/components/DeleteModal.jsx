import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'

export default function DeleteModal({ specialist, busy, onConfirm, onClose }) {
  return (
    <ConfirmDeleteModal
      open
      title="حذف الأخصائي"
      message={
        <>
          سيتم حذف <span className="font-extrabold text-ink">{specialist.title} {specialist.name}</span> من المنصة نهائياً.
        </>
      }
      confirmLabel="نعم، احذف"
      busy={busy}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-700">
        ملاحظة: لا يمكن حذف الأخصائي إذا كان مرتبطاً بجلسات أو دورات قائمة — حمايةً لبيانات المنصة،
        وسيتم إشعارك في هذه الحالة.
      </div>
    </ConfirmDeleteModal>
  )
}
