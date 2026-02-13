# Database Migration Rules

This document outlines the mandatory workflow for managing database schema changes.

## Trigger Condition

**Whenever you add a new feature that requires database changes:**

## mandatory Steps

### 1. Generate Migration File

Run the following command to generate a new migration file:

```bash
npx sequelize-cli migration:generate --name [migration-name]
```

- Replace `[migration-name]` with a clear, descriptive name (e.g., `create-users-table`, `add-email-column`).

### 2. Implement Migration Script

Locate the generated file in `src/migrations/`. The filename will include a timestamp prefix (e.g., `YYYYMMDDHHMMSS-[migration-name].js`).

Implement the schema changes within this file:

- **up**: Code to apply the changes (e.g., `queryInterface.createTable`, `queryInterface.addColumn`).
- **down**: Code to revert the changes (e.g., `queryInterface.dropTable`, `queryInterface.removeColumn`).
