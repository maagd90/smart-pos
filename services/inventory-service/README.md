# Inventory Service — Independent Project

This service is a standalone Maven module. It can be built and deployed without the full monorepo:

```bash
# From repository root
mvn -f shared-contracts/pom.xml install -DskipTests
mvn -f services/inventory-service/pom.xml test package

# Docker (from repository root)
docker build -f services/inventory-service/Dockerfile .
```

## Responsibility
Append-only stock ledger, stock queries, and Kafka consumption of sale/refund events.
