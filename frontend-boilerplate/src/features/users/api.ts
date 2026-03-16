import type {
  User,
  UserFilters,
  UsersResponse,
  UserStats,
  CreateUserInput,
  UpdateUserInput,
} from './types'

// Mock data generator
const generateMockUsers = (): User[] => {
  const firstNames = [
    'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
    'Igor', 'Juliana', 'Kevin', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula',
    'Rafael', 'Sofia', 'Thiago', 'Valéria', 'Wagner', 'Yasmin', 'Zeca',
  ]
  const lastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida',
    'Costa', 'Pereira', 'Martins', 'Lima', 'Gomes', 'Ribeiro', 'Carvalho',
  ]
  const roles: Array<'admin' | 'user' | 'editor'> = ['admin', 'user', 'editor']
  const statuses: Array<'active' | 'inactive'> = ['active', 'inactive']

  const users: User[] = []
  const usedEmails = new Set<string>()

  for (let i = 1; i <= 20; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@exemplo.com`

    // Ensure unique emails
    let finalEmail = email
    let counter = 1
    while (usedEmails.has(finalEmail)) {
      finalEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}-${counter}@exemplo.com`
      counter++
    }
    usedEmails.add(finalEmail)

    const role = roles[Math.floor(Math.random() * roles.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    // Generate a random date within the last year
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()

    users.push({
      id: `user-${i}`,
      name,
      email: finalEmail,
      role,
      status,
      createdAt,
    })
  }

  return users
}

// In-memory storage
let mockUsers = generateMockUsers()

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const usersApi = {
  // Get all users with filters and pagination
  getUsers: async (filters: UserFilters = {}): Promise<UsersResponse> => {
    await delay(500)

    let filtered = [...mockUsers]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status)
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    const paginatedUsers = filtered.slice(startIndex, endIndex)

    return {
      users: paginatedUsers,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    }
  },

  // Get user statistics
  getStats: async (): Promise<UserStats> => {
    await delay(300)

    return {
      total: mockUsers.length,
      active: mockUsers.filter(u => u.status === 'active').length,
      inactive: mockUsers.filter(u => u.status === 'inactive').length,
      admins: mockUsers.filter(u => u.role === 'admin').length,
    }
  },

  // Get a single user by ID
  getUserById: async (id: string): Promise<User | null> => {
    await delay(200)
    return mockUsers.find(user => user.id === id) || null
  },

  // Create a new user
  createUser: async (input: CreateUserInput): Promise<User> => {
    await delay(600)

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status,
      createdAt: new Date().toISOString(),
    }

    mockUsers.unshift(newUser)
    return newUser
  },

  // Update an existing user
  updateUser: async (input: UpdateUserInput): Promise<User> => {
    await delay(500)

    const index = mockUsers.findIndex(user => user.id === input.id)
    if (index === -1) {
      throw new Error('User not found')
    }

    mockUsers[index] = {
      ...mockUsers[index],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.status !== undefined && { status: input.status }),
    }

    return mockUsers[index]
  },

  // Delete a user
  deleteUser: async (id: string): Promise<void> => {
    await delay(400)
    mockUsers = mockUsers.filter(user => user.id !== id)
  },

  // Bulk delete users
  bulkDeleteUsers: async (ids: string[]): Promise<void> => {
    await delay(600)
    mockUsers = mockUsers.filter(user => !ids.includes(user.id))
  },

  // Bulk update status
  bulkUpdateStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<void> => {
    await delay(500)
    mockUsers = mockUsers.map(user =>
      ids.includes(user.id) ? { ...user, status } : user
    )
  },
}
