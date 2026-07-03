SHELL := /bin/bash
.DEFAULT_GOAL := help

DEMO_DIR := examples/rabbitmq
COMPOSE_FILE := $(DEMO_DIR)/compose.yaml
STACK_COMPOSE_FILE := $(DEMO_DIR)/compose.rabbitlens.yaml
WEBSITE_DIR := website

COMPOSE_PROJECT_NAME ?= rabbitlens-demo

# Use the two Compose files to run RabbitMQ + RabbitLens together
COMPOSE = docker compose --project-name "$(COMPOSE_PROJECT_NAME)" \
	--file "$(COMPOSE_FILE)" --file "$(STACK_COMPOSE_FILE)"

.PHONY: help up down dev seed reset logs

help: ## Show available commands.
	@awk 'BEGIN {FS = ":.*## "; printf "RabbitLens Commands:\n\n"} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start RabbitLens and RabbitMQ in Docker.
	$(COMPOSE) up -d --build --wait --wait-timeout 240
	@echo ""
	@echo "RabbitLens is running at: http://127.0.0.1:8080"
	@echo "Username: admin | Password: rabbitlens-demo"

down: ## Stop all services.
	$(COMPOSE) down --remove-orphans

reset: ## Stop all services and wipe data.
	$(COMPOSE) down --volumes --remove-orphans

dev: ## Start frontend development server with HMR.
	npm --prefix "$(WEBSITE_DIR)" run dev

seed: ## Seed dummy messages to make the UI look lively.
	RABBITMQ_MANAGEMENT_URL="http://127.0.0.1:15672" \
	RABBITMQ_ADMIN_USER="admin" RABBITMQ_ADMIN_PASSWORD="rabbitlens-demo" \
	"$(DEMO_DIR)/seed-messages.sh"

logs: ## Follow logs for all services.
	$(COMPOSE) logs -f
