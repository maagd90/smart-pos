# Identity & Access Service — Independent Project

Standalone user management, authentication, RBAC, and audit logging.

```bash
mvn -f shared-contracts/pom.xml install -DskipTests
mvn -f services/identity-access-service/pom.xml test package
```

## Responsibility
Authentication (bcrypt + JWT), role/permission resolution, accessible stores, audit logs.
