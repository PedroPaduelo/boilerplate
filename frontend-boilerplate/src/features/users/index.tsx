'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import {
  useUsers,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useBulkDeleteUsers,
  useBulkUpdateStatus,
} from './hooks/use-users'
import { UsersStats } from './components/users-stats'
import { UsersTable } from './components/users-table'
import { UserFormDialog } from './components/user-form-dialog'
import type { UserFormValues } from './components/user-form-dialog'
import { UserDeleteAlert } from './components/user-delete-alert'
import type { User, UserFilters } from './types'

export function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 10,
  })

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  // Queries
  const { data: usersData, isLoading: usersLoading } = useUsers(filters)
  const { data: stats, isLoading: statsLoading } = useUserStats()

  // Mutations
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const bulkDelete = useBulkDeleteUsers()
  const bulkUpdateStatus = useBulkUpdateStatus()

  const handleCreateUser = () => {
    setSelectedUser(null)
    setFormMode('create')
    setFormDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormMode('edit')
    setFormDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = (data: UserFormValues) => {
    if (formMode === 'create') {
      createUser.mutate({
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
      })
    } else if (selectedUser) {
      updateUser.mutate({
        id: selectedUser.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
      })
    }
    setFormDialogOpen(false)
  }

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUser.mutate(selectedUser.id)
    }
    setDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  const handleBulkDelete = (ids: string[]) => {
    bulkDelete.mutate(ids)
  }

  const handleBulkStatusChange = (ids: string[], status: 'active' | 'inactive') => {
    bulkUpdateStatus.mutate({ ids, status })
  }

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters)
  }

  const isFormLoading = createUser.isPending || updateUser.isPending

  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
                <p className="text-muted-foreground">
                  Gerencie os usuários do sistema
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <UsersStats stats={stats} isLoading={statsLoading} />

        {/* Users Table */}
        <UsersTable
          users={usersData?.users || []}
          total={usersData?.total || 0}
          page={usersData?.page || 1}
          totalPages={usersData?.totalPages || 0}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
          onCreate={handleCreateUser}
          isLoading={usersLoading}
        />

        {/* Create/Edit Form Dialog */}
        <UserFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          onSubmit={handleFormSubmit}
          user={selectedUser}
          isLoading={isFormLoading}
          mode={formMode}
        />

        {/* Delete Confirmation Dialog */}
        <UserDeleteAlert
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          user={selectedUser}
          isLoading={deleteUser.isPending}
        />
      </motion.div>
    </div>
  )
}

export default UsersPage
