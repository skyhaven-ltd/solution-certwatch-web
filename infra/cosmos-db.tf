resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${local.resource_suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  capacity {
    total_throughput_limit = 4000
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  tags = local.tags
}

resource "azurerm_cosmosdb_sql_database" "certwatch" {
  name                = "db-${local.resource_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "users" {
  name                = "users"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.certwatch.name
  partition_key_paths = ["/userId"]

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "certifications" {
  name                = "certifications"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.certwatch.name
  partition_key_paths = ["/userId"]
  default_ttl         = -1

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    composite_index {
      index {
        path  = "/expirationDate"
        order = "Ascending"
      }
      index {
        path  = "/userId"
        order = "Ascending"
      }
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "reminder_logs" {
  name                = "reminderLogs"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.certwatch.name
  partition_key_paths = ["/userId"]
  default_ttl         = 7776000

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}
