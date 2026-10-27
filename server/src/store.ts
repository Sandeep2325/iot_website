import { createCatalog, type Catalog } from '../../shared/catalog'
import type { Category } from '../../shared/types'
import type { Database } from './db'

/** The shared catalog query logic over the database's current contents. Call reload() after writes. */
export class Store {
  catalog!: Catalog
  categories!: Category[]

  constructor(readonly db: Database) {
    this.reload()
  }

  reload() {
    this.catalog = createCatalog(this.db.catalogData())
    this.categories = this.db.categories()
  }
}
