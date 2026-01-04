import { Link, useNavigate, useParams } from 'react-router-dom'
import { PlaceForm } from '../components/PlaceForm'
import { useEditPlace } from '../hooks/useEditPlace'

export const EditPlaceScreen = () => {
  const { id } = useParams()
  const parsedId = Number(id)
  const placeId = Number.isFinite(parsedId) ? parsedId : null
  const navigate = useNavigate()
  const editState = useEditPlace({
    placeId,
    onSuccess: (place) => {
      navigate(`/places/${place.id}`)
    },
  })

  const handleNavigateToDuplicate = (duplicateId: number) => {
    navigate(`/places/${duplicateId}`)
  }

  const handleBackToDetail = () => {
    if (placeId === null) {
      navigate('/places')
      return
    }
    navigate(`/places/${placeId}`)
  }

  return (
    <main className="layout layout--detail">
      <section className="result-card" aria-live="polite">
        <div className="result-header">
          <div>
            <h2>店舗情報の編集</h2>
            <p>登録済みのお店情報を更新できます。</p>
          </div>
          {placeId !== null ? (
            <button type="button" className="ghost" onClick={handleBackToDetail}>
              詳細に戻る
            </button>
          ) : (
            <Link className="ghost" to="/places">
              一覧に戻る
            </Link>
          )}
        </div>
        {editState.isLoading && (
          <p className="result-loading">編集内容を読み込み中です。</p>
        )}
        {editState.loadError && !editState.isLoading && (
          <div className="form-alert form-alert--error" role="alert">
            <p>{editState.loadError}</p>
            <button type="button" className="ghost" onClick={editState.reload}>
              再試行する
            </button>
          </div>
        )}
      </section>
      {editState.isReady && (
        <PlaceForm
          formState={editState.formState}
          errors={editState.errors}
          isSubmitting={editState.isSubmitting}
          submitError={editState.submitError}
          duplicatePlaceId={editState.duplicatePlaceId}
          submitLabel="更新する"
          actionSubText="Enter で更新、Shift + Tab で戻れます。"
          onChange={editState.handleChange}
          onSubmit={editState.handleSubmit}
          onNavigateToDuplicate={handleNavigateToDuplicate}
        />
      )}
    </main>
  )
}
