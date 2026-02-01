#!/bin/bash

# Agent Platform - Local Development Runner
# Usage: ./run.sh [command]
# Commands:
#   dev      - Start development server (default)
#   worker   - Start background worker
#   all      - Start both dev server and worker
#   build    - Build for production
#   start    - Start production server
#   install  - Install dependencies
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

# Show help message
show_help() {
    echo ""
    echo "Agent Platform - Local Development Runner"
    echo ""
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev      Start Next.js development server (default)"
    echo "  worker   Start background worker for async tasks"
    echo "  all      Start both dev server and worker"
    echo "  build    Build for production"
    echo "  start    Start production server"
    echo "  install  Install/update dependencies"
    echo "  lint     Run linting"
    echo "  help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh           # Start dev server"
    echo "  ./run.sh dev       # Start dev server"
    echo "  ./run.sh worker    # Start worker only"
    echo "  ./run.sh all       # Start both server and worker"
    echo ""
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
