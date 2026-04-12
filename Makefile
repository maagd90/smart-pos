.PHONY: help setup start stop clean seed logs

help:
	@echo "Smart POS System - Available Commands"
	@echo "======================================"
	@echo "make setup        - Initial setup (install deps, create .env)"
	@echo "make start        - Start all services with Docker"
	@echo "make stop         - Stop all services"
	@echo "make clean        - Remove all containers and volumes"
	@echo "make seed         - Seed database with sample data"
	@echo "make logs         - Show backend logs"
	@echo "make dev-backend  - Start backend in dev mode"
	@echo "make dev-frontend - Start frontend in dev mode"

setup:
	@cp -n .env.example .env || true
	@echo "✅ .env file created - please fill in your values"
	@cd backend && npm install
	@cd frontend && npm install

start:
	@docker-compose up -d
	@echo "✅ Smart POS System is running!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:3000"
	@echo "   DB Admin: http://localhost:5432"

stop:
	@docker-compose down

clean:
	@docker-compose down -v
	@echo "✅ All containers and volumes removed"

seed:
	@cd backend && npm run db:seed

logs:
	@docker-compose logs -f backend

dev-backend:
	@cd backend && npm run dev

dev-frontend:
	@cd frontend && npm run dev
