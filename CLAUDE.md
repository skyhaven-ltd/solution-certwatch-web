# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CertWatch is a web application for tracking IT certification expiry dates across Microsoft, AWS, and CompTIA. It provides a React and Vite web experience backed by Azure Functions for certification records, reminder preferences, profile details, automated reminder jobs, and provider sync flows.

## Structure

- `frontend/` — React + TypeScript + Vite static web app.
- `functions/api/` — Azure Functions API project.
- `functions/jobs/` — Azure Functions scheduled jobs project.
- `infra/` — Terraform infrastructure for Azure hosting and supporting services.
- `.github/workflows/` — linting, Static Web Apps deployment, Terraform, and tagging workflows.

## Common Commands

Inspect package scripts before adding new commands. Current Node projects are under `frontend/`, `functions/api/`, and `functions/jobs/`.

```bash
cd frontend
npm ci
npm run build

cd ../functions/api
npm ci
npm run build --if-present

cd ../jobs
npm ci
npm run build --if-present
```

For Terraform changes, work from `infra/` and run formatting and validation before proposing an apply.

```bash
cd infra
terraform fmt -recursive
terraform validate
```

## Working Guidelines

- Treat `functions/api/local.settings.json`, `infra/*.tfvars`, and any local environment files as sensitive; do not print or expose secrets.
- Keep frontend, API, jobs, and infrastructure concerns separated unless the feature explicitly spans them.
- Preserve existing Azure Static Web Apps and Terraform workflow conventions.
