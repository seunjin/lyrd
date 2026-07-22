'use client'

import { Toast } from '@base-ui/react/toast'
import { type AppToastData, appToastManager } from './manager'
import styles from './Toast.module.css'

function ToastRegion() {
  const { toasts } = Toast.useToastManager<AppToastData>()

  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="알림" className={styles.Viewport}>
        {toasts.map((toast) => (
          <Toast.Root className={styles.Toast} key={toast.id} toast={toast}>
            <Toast.Content className={styles.Content}>
              <div className={styles.Text}>
                <Toast.Title className={styles.Title} />
                <Toast.Description className={styles.Description} />
              </div>
              {toast.data?.undo ? (
                <Toast.Action className={styles.Close} onClick={toast.data.undo}>
                  {toast.data.undoLabel}
                </Toast.Action>
              ) : null}
              <Toast.Close className={styles.Close} onClickCapture={toast.data?.dismiss}>
                닫기
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export function AppToastProvider() {
  return (
    <Toast.Provider toastManager={appToastManager} timeout={5000}>
      <ToastRegion />
    </Toast.Provider>
  )
}
