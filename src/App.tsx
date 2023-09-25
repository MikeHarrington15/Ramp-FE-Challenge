import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isPaginationUsed, setIsPaginationUsed] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)

  useEffect(() => {
    setHasNextPage(paginatedTransactions?.nextPage !== null)
  }, [paginatedTransactions])

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setSelectedEmployeeId(null) // No employee is selected
    transactionsByEmployeeUtils.invalidateData()
    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()
    setIsPaginationUsed(true)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setSelectedEmployeeId(employeeId)
      paginatedTransactionsUtils.invalidateData()
      setIsPaginationUsed(false)
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const handleViewMoreClick = async () => {
    if (selectedEmployeeId) {
      await loadTransactionsByEmployee(selectedEmployeeId)
    } else {
      await loadAllTransactions()
    }
  }

  // In your JSX:
  ;<button
    className="RampButton"
    disabled={paginatedTransactionsUtils.loading}
    onClick={handleViewMoreClick} // use the new handler here
  >
    View More
  </button>

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeeUtils.loading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            console.log("InputSelect onChange triggered", newValue)
            if (newValue === null) {
              return
            }

            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && isPaginationUsed && hasNextPage && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={handleViewMoreClick}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
