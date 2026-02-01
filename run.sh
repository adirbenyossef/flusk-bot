#!/bin/bash

# Agent Platform - Local Development Runner
# Usage: ./run.sh [command]
# Commands:
#   local    - Start local MongoDB + dev server (recommended for first run)
#   dev      - Start development server (default)
#   worker   - Start background worker
#   all      - Start both dev server and worker
#   build    - Build for production
#   start    - Start production server
#   install  - Install dependencies
#   db       - Start local MongoDB only
#   db:stop  - Stop local MongoDB
#   help     - Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker detected"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm $(npm -v) detected"
}

# Check and install dependencies
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_info "Dependencies already installed"
    fi
}

# Check for environment file
check_env() {
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            print_warning ".env.local not found. Creating from .env.example..."
            cp .env.example .env.local
            print_warning "Please edit .env.local with your actual configuration values"
            print_info "Required environment variables:"
            echo "  - MONGODB_URI: Your MongoDB connection string"
            echo "  - OPENROUTER_API_KEY: Your OpenRouter API key"
            echo "  - SLACK_* variables: For Slack integration"
            echo "  - WA_* variables: For WhatsApp integration"
            echo ""
        else
            print_error ".env.local not found and no .env.example available"
            exit 1
        fi
    else
        print_success ".env.local found"
    fi
}

# Setup local environment (for local-first development)
setup_local_env() {
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.example" ]; then
            print_info "Creating .env.local for local development..."
            cp .env.local.example .env.local
            print_success "Created .env.local with local defaults (mock LLM + local MongoDB)"
        else
            print_error ".env.local.example not found"
            exit 1
        fi
    else
        print_success ".env.local found"
    fi
}

# Start local MongoDB via Docker
start_db() {
    check_docker
    print_info "Starting MongoDB via Docker..."
    docker compose up -d mongodb
    print_success "MongoDB started on localhost:27017"
}

# Stop local MongoDB
stop_db() {
    check_docker
    print_info "Stopping MongoDB..."
    docker compose down
    print_success "MongoDB stopped"
}

# Wait for MongoDB to be ready
wait_for_db() {
    print_info "Waiting for MongoDB to be ready..."
    for i in {1..30}; do
        if docker exec agent-platform-mongo mongosh --eval "db.runCommand('ping')" &> /dev/null; then
            print_success "MongoDB is ready"
            return 0
        fi
        sleep 1
    done
    print_error "MongoDB failed to start in time"
    exit 1
}

# Show help message
show_help() {
    echo ""
    echo "Agent Platform - Local Development Runner"
    echo ""
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  local    Start local MongoDB + dev server (recommended for first run)"
    echo "  dev      Start Next.js development server"
    echo "  worker   Start background worker for async tasks"
    echo "  all      Start both dev server and worker"
    echo "  build    Build for production"
    echo "  start    Start production server"
    echo "  install  Install/update dependencies"
    echo "  db       Start local MongoDB only (via Docker)"
    echo "  db:stop  Stop local MongoDB"
    echo "  lint     Run linting"
    echo "  help     Show this help message"
    echo ""
    echo "Quick Start (local development, no external services):"
    echo "  ./run.sh local     # Starts MongoDB + dev server with mock LLM"
    echo ""
    echo "Examples:"
    echo "  ./run.sh local     # Best for first-time setup"
    echo "  ./run.sh dev       # Just the dev server (MongoDB must be running)"
    echo "  ./run.sh worker    # Start worker only"
    echo "  ./run.sh all       # Start both server and worker"
    echo ""
}

# Start local development (MongoDB + dev server)
start_local() {
    print_info "Starting local development environment..."
    start_db
    wait_for_db
    echo ""
    print_info "Starting development server on http://localhost:3000"
    print_info "Using mock LLM mode (no API keys required)"
    npm run dev
}

# Start development server
start_dev() {
    print_info "Starting development server on http://localhost:3000"
    npm run dev
}

# Start worker
start_worker() {
    print_info "Starting background worker..."
    npm run worker
}

# Start both dev and worker
start_all() {
    print_info "Starting development server and worker..."
    print_info "Dev server: http://localhost:3000"

    # Start worker in background
    npm run worker &
    WORKER_PID=$!

    # Trap to kill worker when script exits
    trap "kill $WORKER_PID 2>/dev/null" EXIT

    # Start dev server in foreground
    npm run dev
}

# Build for production
build_app() {
    print_info "Building for production..."
    npm run build
    print_success "Build completed"
}

# Start production server
start_prod() {
    print_info "Starting production server..."
    npm run start
}

# Install dependencies
install_deps() {
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Run linting
run_lint() {
    print_info "Running linting..."
    npm run lint
}

# Main script
main() {
    COMMAND=${1:-dev}

    # Change to script directory
    cd "$(dirname "$0")"

    echo ""
    echo "=================================="
    echo "  Agent Platform - Local Runner"
    echo "=================================="
    echo ""

    case $COMMAND in
        help|-h|--help)
            show_help
            exit 0
            ;;
        install)
            check_node
            check_npm
            install_deps
            ;;
        local)
            check_node
            check_npm
            check_docker
            check_dependencies
            setup_local_env
            start_local
            ;;
        db)
            start_db
            ;;
        db:stop)
            stop_db
            ;;
        dev)
            check_node
            check_npm
            check_dependencies
            check_env
            start_dev
            ;;
        worker)
            check_node
            check_npm
            check_dependencies
            check_env
            start_worker
            ;;
        all)
            check_node
            check_npm
            check_dependencies
            check_env
            start_all
            ;;
        build)
            check_node
            check_npm
            check_dependencies
            check_env
            build_app
            ;;
        start)
            check_node
            check_npm
            check_env
            start_prod
            ;;
        lint)
            check_node
            check_npm
            check_dependencies
            run_lint
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
