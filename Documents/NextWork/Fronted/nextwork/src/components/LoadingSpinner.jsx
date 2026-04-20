export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true" />
      <p className="text-muted">{message}</p>
    </div>
  )
}
