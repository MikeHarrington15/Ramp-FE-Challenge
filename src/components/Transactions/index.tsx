import { useCallback, useState } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const { fetchWithoutCache, loading } = useCustomFetch()
  const [approvals, setApprovals] = useState<Record<string, boolean>>({})

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })
    },
    [fetchWithoutCache]
  )

  const handleApprovalChange = async (transactionId: string, newValue: boolean) => {
    // Update backend first
    await setTransactionApproval({ transactionId, newValue })

    // Update local state only after successful backend update
    setApprovals((prev) => ({ ...prev, [transactionId]: newValue }))
  }

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          isApproved={approvals[transaction.id] ?? transaction.approved}
          onApprovalChange={(newValue) => handleApprovalChange(transaction.id, newValue)}
        />
      ))}
    </div>
  )
}
