resource "azurerm_static_web_app" "main" {
  name                = "stapp-${local.resource_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = "westeurope"
  sku_tier            = "Free"
  sku_size            = "Free"

  app_settings = {
    ENTRA_CLIENT_ID     = var.entra_api_client_id
    ENTRA_CLIENT_SECRET = var.entra_client_secret
    COSMOS_ENDPOINT     = azurerm_cosmosdb_account.main.endpoint
    COSMOS_KEY          = azurerm_cosmosdb_account.main.primary_key
    COSMOS_DATABASE     = azurerm_cosmosdb_sql_database.certwatch.name

    BREVO_API_KEY   = var.brevo_api_key
    EMAIL_FROM      = var.email_from
    EMAIL_FROM_NAME = var.email_from_name
    EMAIL_REPLY_TO  = var.email_reply_to
  }

  tags = local.tags
}

resource "azurerm_static_web_app_custom_domain" "certwatch" {
  static_web_app_id = azurerm_static_web_app.main.id
  domain_name       = "certwatch.skyhaven.ltd"
  validation_type   = "cname-delegation"

  depends_on = [cloudflare_dns_record.swa_certwatch]
}
