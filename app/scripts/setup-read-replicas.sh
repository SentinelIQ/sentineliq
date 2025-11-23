#!/bin/bash

# PostgreSQL Read Replica Setup Script
# This script helps configure read replicas for PostgreSQL

set -e

echo "=== PostgreSQL Read Replica Configuration ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}Error: Do not run this script as root${NC}"
  exit 1
fi

echo -e "${YELLOW}This script will help you configure PostgreSQL read replicas${NC}"
echo ""

# Function to check if PostgreSQL is installed
check_postgres() {
  if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
}

# Function to check replication status
check_replication() {
  local db_url=$1
  
  echo ""
  echo "Checking replication status..."
  
  psql "$db_url" -c "SELECT * FROM pg_stat_replication;" 2>/dev/null || {
    echo -e "${YELLOW}Warning: Could not query replication status${NC}"
    return 1
  }
  
  return 0
}

# Function to create replication user
create_replication_user() {
  local primary_url=$1
  local repl_user=$2
  local repl_password=$3
  
  echo ""
  echo "Creating replication user: $repl_user"
  
  psql "$primary_url" <<EOF
CREATE USER $repl_user WITH REPLICATION ENCRYPTED PASSWORD '$repl_password';
EOF
  
  echo -e "${GREEN}✓ Replication user created${NC}"
}

# Function to configure primary server
configure_primary() {
  local config_file=$1
  
  echo ""
  echo "Configuring primary server..."
  echo ""
  echo "Add the following to postgresql.conf:"
  echo "---"
  echo "wal_level = replica"
  echo "max_wal_senders = 10"
  echo "wal_keep_size = 1GB"
  echo "hot_standby = on"
  echo "---"
  echo ""
  echo "Add the following to pg_hba.conf:"
  echo "---"
  echo "# Replication connections"
  echo "host replication replication_user 0.0.0.0/0 md5"
  echo "---"
}

# Function to setup replica
setup_replica() {
  local primary_host=$1
  local replica_data_dir=$2
  local repl_user=$3
  local repl_password=$4
  
  echo ""
  echo "Setting up replica at: $replica_data_dir"
  
  # Backup existing data
  if [ -d "$replica_data_dir" ]; then
    echo "Backing up existing data directory..."
    mv "$replica_data_dir" "${replica_data_dir}.backup.$(date +%s)"
  fi
  
  # Run pg_basebackup
  echo "Running pg_basebackup..."
  PGPASSWORD="$repl_password" pg_basebackup \
    -h "$primary_host" \
    -U "$repl_user" \
    -D "$replica_data_dir" \
    -P \
    -Xs \
    -R
  
  echo -e "${GREEN}✓ Replica setup complete${NC}"
}

# Function to generate .env configuration
generate_env_config() {
  local primary_url=$1
  local replica_urls=$2
  
  echo ""
  echo "=== Environment Configuration ==="
  echo ""
  echo "Add the following to your .env.server file:"
  echo "---"
  echo "# Primary database (for writes)"
  echo "DATABASE_URL=\"$primary_url\""
  echo ""
  echo "# Read replicas (for read queries)"
  
  local i=1
  for url in $replica_urls; do
    echo "READ_REPLICA_URL_${i}=\"$url\""
    ((i++))
  done
  
  echo "---"
}

# Function to test replica connection
test_replica_connection() {
  local replica_url=$1
  
  echo ""
  echo "Testing replica connection..."
  
  psql "$replica_url" -c "SELECT 1;" &>/dev/null && {
    echo -e "${GREEN}✓ Replica connection successful${NC}"
    return 0
  } || {
    echo -e "${RED}✗ Replica connection failed${NC}"
    return 1
  }
}

# Function to show replication lag
show_replication_lag() {
  local replica_url=$1
  
  echo ""
  echo "Checking replication lag..."
  
  psql "$replica_url" -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;" 2>/dev/null || {
    echo -e "${YELLOW}Warning: Could not query replication lag${NC}"
    return 1
  }
}

# Main menu
main_menu() {
  echo ""
  echo "Choose an option:"
  echo "1) Check current replication status"
  echo "2) Generate primary server configuration"
  echo "3) Generate .env configuration for app"
  echo "4) Test replica connection"
  echo "5) Show replication lag"
  echo "6) Exit"
  echo ""
  read -p "Enter option: " option
  
  case $option in
    1)
      read -p "Enter primary database URL: " db_url
      check_replication "$db_url"
      main_menu
      ;;
    2)
      configure_primary
      main_menu
      ;;
    3)
      read -p "Enter primary database URL: " primary_url
      read -p "Enter replica URLs (space-separated): " replica_urls
      generate_env_config "$primary_url" "$replica_urls"
      main_menu
      ;;
    4)
      read -p "Enter replica database URL: " replica_url
      test_replica_connection "$replica_url"
      main_menu
      ;;
    5)
      read -p "Enter replica database URL: " replica_url
      show_replication_lag "$replica_url"
      main_menu
      ;;
    6)
      echo "Exiting..."
      exit 0
      ;;
    *)
      echo -e "${RED}Invalid option${NC}"
      main_menu
      ;;
  esac
}

# Run checks
check_postgres

# Start menu
main_menu
