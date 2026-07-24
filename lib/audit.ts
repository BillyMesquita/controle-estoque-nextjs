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
  try {
    await prisma.auditLog.create({
      data: {
        user: { connect: { id: params.userId } },
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        module: params.module,
        ...(params.description && { description: params.description }),
        ...(params.previousValues && { previousValues: params.previousValues }),
        ...(params.newValues && { newValues: params.newValues }),
        ...(params.ipAddress && { ipAddress: params.ipAddress }),
      },
    })
  } catch (e) {
    console.error('Erro ao criar audit log:', e)
  }
}
