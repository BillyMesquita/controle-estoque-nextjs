import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('PRAGMA foreign_keys = OFF')

      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "invoices_new" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "invoice_number" TEXT NOT NULL,
          "invoice_type" TEXT NOT NULL,
          "supplier_id" TEXT,
          "customer_name" TEXT,
          "customer_document" TEXT,
          "total_amount" REAL NOT NULL DEFAULT 0,
          "tax_amount" REAL NOT NULL DEFAULT 0,
          "payment_status" TEXT NOT NULL DEFAULT 'Pendente',
          "status" TEXT NOT NULL DEFAULT 'Registrada',
          "issued_date" DATETIME NOT NULL,
          "due_date" DATETIME,
          "paid_at" DATETIME,
          "notes" TEXT,
          "registered_by" TEXT NOT NULL,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL,
          "deleted_at" DATETIME,
          FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id"),
          FOREIGN KEY ("registered_by") REFERENCES "users" ("id")
        )
      `)

      const count: any = await tx.$queryRawUnsafe('SELECT COUNT(*) as cnt FROM invoices')
      if (count[0]?.cnt > 0) {
        await tx.$executeRawUnsafe('INSERT INTO invoices_new SELECT * FROM invoices')
      }

      await tx.$executeRawUnsafe('DROP TABLE invoices')
      await tx.$executeRawUnsafe('ALTER TABLE invoices_new RENAME TO invoices')

      await tx.$executeRawUnsafe('PRAGMA foreign_keys = ON')

      const fkList: any = await tx.$queryRawUnsafe('PRAGMA foreign_key_list(invoices)')
      return fkList
    })

    return NextResponse.json({ ok: true, foreignKeys: result })
  } catch (e: any) {
    console.error('Erro ao fix FK:', e)
    return NextResponse.json({ error: 'Erro ao fix FK' }, { status: 500 })
  }
}
