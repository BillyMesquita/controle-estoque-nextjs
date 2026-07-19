import { prisma } from './prisma'

export async function createAuditLog(params: {
  userId: string
  action: string
  entity: string
  entityId: string
  module: string
  description?: string
  previousValues?: string
  newValues?: string
  ipAddress?: string
}) {
  await prisma.auditLog.create({ data: params })
}
